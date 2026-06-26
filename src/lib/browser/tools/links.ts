import type { BrowserToolContext } from "../types";

export async function checkLinkHealth(
  ctx: BrowserToolContext,
  url: string,
  maxLinks?: number,
  includeExternal?: boolean
): Promise<Record<string, unknown>> {
  const DEFAULT_MAX_LINKS = 50;
  const HARD_CAP = 150;
  const EXTERNAL_SAMPLE_CAP = 20;
  const EXTERNAL_SAMPLE_OUT = 10;
  const PER_REQUEST_TIMEOUT_MS = 5000;
  const CONCURRENCY = 8;
  const ANCHOR_TEXT_LIMIT = 80;
  const MAX_BROKEN_SAMPLE = 15;
  const MAX_REDIRECT_SAMPLE = 10;
  const MAX_NON_CANONICAL_SAMPLE = 10;
  const MAX_ANCHOR_SAMPLE = 30;
  const EXTERNAL_NOFOLLOW_WARN = 20;

  const userAgent =
    "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";

  let sourceStatus = 0;
  let sourceFinalUrl = "";
  let extracted: { href: string; text: string; rel: string }[] = [];
  let sourceError: string | undefined;

  try {
    const response = await ctx.goto(url);
    const page = ctx.getPage();
    sourceStatus = response?.status() ?? 0;
    sourceFinalUrl = page.url();
    extracted = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a[href]"));
      const out: { href: string; text: string; rel: string }[] = [];
      for (const a of anchors) {
        const href = a.getAttribute("href");
        if (!href) continue;
        const text = (a.textContent || "").replace(/\s+/g, " ").trim();
        const rel = a.getAttribute("rel") || "";
        out.push({ href, text, rel });
      }
      return out;
    });
  } catch (err) {
    sourceError = err instanceof Error ? err.message : String(err);
  }

  const totalAnchors = extracted.length;

  let pageHost = "";
  try {
    pageHost = new URL(sourceFinalUrl || url).hostname;
  } catch {
    /* non-fatal */
  }

  const internalMap = new Map<
    string,
    { text: string; rel: string; nofollow: boolean; isEmpty: boolean }
  >();
  const externalMap = new Map<
    string,
    { text: string; rel: string; nofollow: boolean; isEmpty: boolean }
  >();

  let nofollowCount = 0;
  let externalNofollowCount = 0;
  let emptyAnchorCount = 0;

  for (const a of extracted) {
    const text = (a.text || "").slice(0, ANCHOR_TEXT_LIMIT);
    const rel = (a.rel || "").toLowerCase();
    const nofollow = /(?:^|\s)nofollow(?:\s|$)/.test(rel);
    const isEmpty = !text;
    let resolved = "";
    try {
      resolved = new URL(a.href, sourceFinalUrl || url).toString();
    } catch {
      continue;
    }
    let proto = "";
    let host = "";
    try {
      const u = new URL(resolved);
      proto = u.protocol;
      host = u.hostname;
    } catch {
      continue;
    }
    if (proto !== "http:" && proto !== "https:") continue;
    if (nofollow) nofollowCount += 1;
    if (isEmpty) emptyAnchorCount += 1;
    if (host === pageHost) {
      if (!internalMap.has(resolved)) {
        internalMap.set(resolved, { text, rel, nofollow, isEmpty });
      }
    } else {
      if (nofollow) externalNofollowCount += 1;
      if (!externalMap.has(resolved)) {
        externalMap.set(resolved, { text, rel, nofollow, isEmpty });
      }
    }
  }

  const uniqueInternal = internalMap.size;
  const uniqueExternal = externalMap.size;

  const cap = Math.max(
    1,
    Math.min(HARD_CAP, Math.floor(Number(maxLinks) || DEFAULT_MAX_LINKS))
  );
  const internalTargets = Array.from(internalMap.entries()).slice(0, cap);

  let externalTargets: [
    string,
    { text: string; rel: string; nofollow: boolean; isEmpty: boolean }
  ][] = [];
  if (includeExternal) {
    const externalCap = Math.min(EXTERNAL_SAMPLE_CAP, cap);
    externalTargets = Array.from(externalMap.entries()).slice(0, externalCap);
  }

  type LinkCheck = {
    url: string;
    status: number;
    finalUrl: string;
    redirected: boolean;
    anchor: string;
    rel: string;
    error?: string;
  };

  const checkOne = async (
    target: [
      string,
      { text: string; rel: string; nofollow: boolean; isEmpty: boolean }
    ]
  ): Promise<LinkCheck> => {
    const [targetUrl, meta] = target;
    const result: LinkCheck = {
      url: targetUrl,
      status: 0,
      finalUrl: targetUrl,
      redirected: false,
      anchor: meta.text,
      rel: meta.rel,
    };

    let resp: Response;
    try {
      resp = await fetch(targetUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(PER_REQUEST_TIMEOUT_MS),
      });
    } catch {
      try {
        resp = await fetch(targetUrl, {
          method: "GET",
          redirect: "follow",
          headers: { "User-Agent": userAgent, Accept: "text/html,*/*" },
          signal: AbortSignal.timeout(PER_REQUEST_TIMEOUT_MS),
        });
        if (resp.body) {
          try {
            await resp.body.cancel();
          } catch {
            /* best effort */
          }
        }
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        return result;
      }
    }

    if (resp.body) {
      try {
        await resp.body.cancel();
      } catch {
        /* best effort */
      }
    }

    result.status = resp.status;
    result.finalUrl = resp.url || targetUrl;
    result.redirected = result.finalUrl !== targetUrl;
    return result;
  };

  const runWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<R>
  ): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    if (items.length === 0) return results;
    let idx = 0;
    const workerCount = Math.min(limit, items.length);
    const runners: Promise<void>[] = [];
    for (let w = 0; w < workerCount; w += 1) {
      runners.push(
        (async () => {
          while (true) {
            const cur = idx;
            idx += 1;
            if (cur >= items.length) break;
            results[cur] = await worker(items[cur]);
          }
        })()
      );
    }
    await Promise.all(runners);
    return results;
  };

  const [internalChecks, externalChecks] = await Promise.all([
    runWithConcurrency(internalTargets, CONCURRENCY, checkOne),
    runWithConcurrency(externalTargets, CONCURRENCY, checkOne),
  ]);

  const statusBuckets = {
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
    errors: 0,
  };
  for (const c of internalChecks) {
    if (c.status === 0) statusBuckets.errors += 1;
    else if (c.status >= 200 && c.status < 300) statusBuckets["2xx"] += 1;
    else if (c.status >= 300 && c.status < 400) statusBuckets["3xx"] += 1;
    else if (c.status >= 400 && c.status < 500) statusBuckets["4xx"] += 1;
    else if (c.status >= 500 && c.status < 600) statusBuckets["5xx"] += 1;
    else statusBuckets.errors += 1;
  }

  const brokenLinks = internalChecks
    .filter((c) => c.status === 0 || c.status >= 400)
    .slice(0, MAX_BROKEN_SAMPLE)
    .map((c) => ({
      url: c.url,
      status: c.status,
      anchor: c.anchor,
      ...(c.error ? { error: c.error } : {}),
    }));

  const redirectedLinks = internalChecks
    .filter((c) => c.redirected)
    .slice(0, MAX_REDIRECT_SAMPLE)
    .map((c) => ({
      url: c.url,
      finalUrl: c.finalUrl,
      anchor: c.anchor,
    }));

  const materialDiff = (a: string, b: string): boolean => {
    if (a === b) return false;
    let ua: URL;
    let ub: URL;
    try {
      ua = new URL(a);
      ub = new URL(b);
    } catch {
      return a !== b;
    }
    if (ua.hostname !== ub.hostname) return true;
    const pa = ua.pathname.replace(/\/+$/, "") || "/";
    const pb = ub.pathname.replace(/\/+$/, "") || "/";
    if (pa !== pb) return true;
    if (ua.search !== ub.search) return true;
    return false;
  };

  const nonCanonicalLike: {
    url: string;
    finalUrl: string;
    anchor: string;
  }[] = [];
  for (const c of internalChecks) {
    if (!c.redirected) continue;
    if (!materialDiff(c.url, c.finalUrl)) continue;
    nonCanonicalLike.push({
      url: c.url,
      finalUrl: c.finalUrl,
      anchor: c.anchor,
    });
    if (nonCanonicalLike.length >= MAX_NON_CANONICAL_SAMPLE) break;
  }

  const externalSample = externalChecks
    .slice(0, EXTERNAL_SAMPLE_OUT)
    .map((c) => ({
      url: c.url,
      status: c.status,
      finalUrl: c.finalUrl,
      redirected: c.redirected,
      anchor: c.anchor,
      ...(c.error ? { error: c.error } : {}),
    }));

  const anchorSamples = internalChecks
    .slice(0, MAX_ANCHOR_SAMPLE)
    .map((c) => ({
      url: c.url,
      anchor: c.anchor,
      status: c.status,
      redirected: c.redirected,
    }));

  const issues: string[] = [];
  const warnings: string[] = [];
  if (sourceError) issues.push("sourceLoadFailed");
  if (brokenLinks.length > 0) issues.push("brokenInternalLinks");
  if (redirectedLinks.length > 0) warnings.push("internalRedirects");
  if (emptyAnchorCount > 0) warnings.push("emptyAnchors");
  if (externalNofollowCount >= EXTERNAL_NOFOLLOW_WARN) {
    warnings.push("manyExternalNofollow");
  }

  const result: Record<string, unknown> = {
    source: { url, finalUrl: sourceFinalUrl, status: sourceStatus },
    discovered: {
      totalAnchors,
      uniqueInternal,
      uniqueExternal,
      nofollowCount,
      externalNofollowCount,
      emptyAnchorCount,
    },
    checkedCount: internalChecks.length + externalChecks.length,
    internalCheckedCount: internalChecks.length,
    externalCheckedCount: externalChecks.length,
    internalSelected: internalTargets.length,
    externalSelected: externalTargets.length,
    uniqueInternalFound: uniqueInternal,
    uniqueExternalFound: uniqueExternal,
    cap,
    includeExternal: Boolean(includeExternal),
    statusBuckets,
    brokenLinks,
    brokenInternalCount: internalChecks.filter(
      (c) => c.status === 0 || c.status >= 400
    ).length,
    redirectedLinks,
    redirectedInternalCount: internalChecks.filter((c) => c.redirected)
      .length,
    nonCanonicalLike,
    externalSample,
    anchorSamples,
    issues,
    warnings,
  };
  if (sourceError) {
    result.sourceError = sourceError;
  }
  return result;
}
