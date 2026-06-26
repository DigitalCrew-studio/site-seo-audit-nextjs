import type { Page, Response as PWResponse } from "playwright";
import type { BrowserToolContext } from "../types";

/**
 * Same-host BFS crawl from a start URL using the existing headless Chromium
 * page. Sequential by design (no new contexts) and per-page work is kept
 * compact via a single page.evaluate per visit. Intended as a quick coverage
 * snapshot, not a deep audit.
 */
export async function crawlSiteSample(
  ctx: BrowserToolContext,
  inputUrl: string,
  maxPages?: number
): Promise<Record<string, unknown>> {
  const DEFAULT_MAX_PAGES = 20;
  const HARD_CAP_MAX_PAGES = 50;
  const MAX_OUTGOING_SAMPLE = 10;
  const MAX_H1_SAMPLE = 3;
  const MAX_JSONLD_SAMPLE = 10;
  const DUPLICATE_SAMPLE_CAP = 5;
  const MISSING_SAMPLE_CAP = 5;
  const ERROR_SAMPLE_CAP = 5;
  const SKIP_EXT_RE = /\.(png|jpe?g|webp|gif|svg|ico|pdf|zip|mp4|webm|css|js|mjs|map|woff2?|ttf|otf|eot|mp3|ogg|wav|flv|mov|m4v|avi|wmv|webmanifest)(?:[?#].*)?$/i;
  const SKIP_SCHEMES = /^(?:mailto:|tel:|javascript:|sms:|ftp:)/i;

  const bucket = (status: number): "2xx" | "3xx" | "4xx" | "5xx" | "other" => {
    if (status >= 200 && status < 300) return "2xx";
    if (status >= 300 && status < 400) return "3xx";
    if (status >= 400 && status < 500) return "4xx";
    if (status >= 500 && status < 600) return "5xx";
    return "other";
  };

  const normalizeKey = (raw: string): string | null => {
    try {
      const u = new URL(raw);
      u.hash = "";
      // Drop a trailing slash from the path so /foo and /foo/ dedupe.
      if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
        u.pathname = u.pathname.replace(/\/+$/, "");
      }
      return u.toString();
    } catch {
      return null;
    }
  };

  const trimmedEmpty = (s: string): boolean => s.trim().length === 0;

  const emptyAggregate = () => ({
    statusBuckets: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, other: 0 },
    duplicateTitles: [] as { title: string; urls: string[] }[],
    duplicateMetaDescriptions: [] as { metaDescription: string; urls: string[] }[],
    missingTitle: [] as string[],
    missingMetaDescription: [] as string[],
    missingH1: [] as string[],
    noindex: [] as string[],
    canonicalToOther: [] as { url: string; canonical: string }[],
    crawlErrors: [] as { url: string; error: string }[],
  });

  let startUrl = "";
  let startOrigin = "";
  try {
    const u = new URL(inputUrl);
    startUrl = u.toString();
    startOrigin = u.origin;
  } catch {
    return {
      startUrl: inputUrl,
      maxPages: 0,
      error: `Invalid URL: ${inputUrl}`,
      visitedCount: 0,
      queuedCount: 0,
      skippedStaticCount: 0,
      pages: [],
      ...emptyAggregate(),
    };
  }

  if (SKIP_EXT_RE.test(startUrl)) {
    return {
      startUrl,
      maxPages: 0,
      error: `Start URL looks like a static asset and cannot be crawled: ${startUrl}`,
      visitedCount: 0,
      queuedCount: 0,
      skippedStaticCount: 1,
      pages: [],
      ...emptyAggregate(),
    };
  }

  const cap = Math.max(
    1,
    Math.min(HARD_CAP_MAX_PAGES, Math.floor(Number(maxPages) || DEFAULT_MAX_PAGES))
  );

  ctx.log?.("status", `Crawling ${startUrl} (max ${cap} pages)...`);
  ctx.log?.("debug", "crawl_site_sample start", { startUrl, maxPages: cap });

  type PageSummary = {
    url: string;
    finalUrl: string;
    status: number;
    title: string;
    metaDescription: string;
    metaDescriptionLength: number;
    metaDescriptionPresent: boolean;
    canonical: string;
    robotsMeta: string;
    xRobotsTag: string;
    h1Count: number;
    h1Sample: string[];
    wordCount: number;
    internalLinkCount: number;
    outgoingSample: string[];
    jsonLdTypes: string[];
    noindex: boolean;
    canonicalToOther: boolean;
  };

  const pages: PageSummary[] = [];
  const aggregate = emptyAggregate();
  const seen = new Set<string>();
  const queue: string[] = [];
  let skippedStaticCount = 0;
  let queuedCount = 0;

  const seedKey = normalizeKey(startUrl);
  if (seedKey) {
    seen.add(seedKey);
    queue.push(startUrl);
  }

  while (queue.length > 0 && pages.length < cap) {
    const target = queue.shift() as string;
    const startedAt = Date.now();
    let response: PWResponse | null = null;
    let status = 0;
    let finalUrl = target;
    let xRobotsTag = "";
    let pageError: string | undefined;

    try {
      response = await ctx.goto(target);
      status = response?.status() ?? 0;
      finalUrl = ctx.getPage().url();
      const headers = response?.headers() ?? {};
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "x-robots-tag") {
          xRobotsTag = headers[key] ?? "";
          break;
        }
      }
    } catch (navErr) {
      pageError = navErr instanceof Error ? navErr.message : String(navErr);
      ctx.log?.("debug", "crawl navigation failed", { url: target, error: pageError });
    }

    let pageObj: Page | undefined;
    try {
      pageObj = ctx.getPage();
    } catch {
      pageObj = undefined;
    }
    let data: {
      title: string;
      metaDescription: string;
      canonical: string;
      robotsMeta: string;
      h1s: string[];
      wordCount: number;
      internalLinks: string[];
      jsonLdTypes: string[];
    } = {
      title: "",
      metaDescription: "",
      canonical: "",
      robotsMeta: "",
      h1s: [],
      wordCount: 0,
      internalLinks: [],
      jsonLdTypes: [],
    };

    if (pageObj && !pageError) {
      try {
        data = await pageObj.evaluate(() => {
          const title = document.title || "";
          const descEl = document.querySelector('meta[name="description"]');
          const metaDescription = descEl
            ? (descEl.getAttribute("content") || "")
            : "";
          const canonicalEl = document.querySelector('link[rel="canonical"]');
          const canonical = canonicalEl
            ? (canonicalEl.getAttribute("href") || "")
            : "";
          const robotsEl = document.querySelector('meta[name="robots"]');
          const robotsMeta = robotsEl
            ? (robotsEl.getAttribute("content") || "")
            : "";

          const h1Els = Array.from(document.querySelectorAll("h1"));
          const h1s = h1Els
            .map((h) => h.innerText.trim())
            .filter(Boolean);

          const bodyText = (
            document.body && document.body.innerText
              ? document.body.innerText
              : ""
          )
            .replace(/\s+/g, " ")
            .trim();
          const wordCount = bodyText
            ? bodyText.split(/\s+/).filter(Boolean).length
            : 0;

          const anchors = Array.from(document.querySelectorAll("a[href]"));
          const loc = window.location;
          const internalSet = new Set<string>();
          for (const a of anchors) {
            const href = a.getAttribute("href") || "";
            let resolved: URL;
            try {
              resolved = new URL(href, loc.href);
            } catch {
              continue;
            }
            if (resolved.hostname === loc.hostname) {
              resolved.hash = "";
              internalSet.add(resolved.toString());
            }
          }

          const ldScripts = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]')
          );
          const typesSet = new Set<string>();
          for (const s of ldScripts) {
            const text = s.textContent || "";
            if (!text.trim()) continue;
            try {
              const parsed: unknown = JSON.parse(text);
              const collectTypes = (node: unknown): void => {
                if (!node) return;
                if (Array.isArray(node)) {
                  node.forEach(collectTypes);
                  return;
                }
                if (typeof node === "object") {
                  const obj = node as Record<string, unknown>;
                  const t = obj["@type"];
                  if (typeof t === "string") typesSet.add(t);
                  else if (Array.isArray(t)) {
                    t.forEach((x) => {
                      if (typeof x === "string") typesSet.add(x);
                    });
                  }
                  const graph = obj["@graph"];
                  if (Array.isArray(graph)) graph.forEach(collectTypes);
                }
              };
              collectTypes(parsed);
            } catch {
              /* ignore parse errors for crawl coverage */
            }
          }

          return {
            title,
            metaDescription,
            canonical,
            robotsMeta,
            h1s,
            wordCount,
            internalLinks: Array.from(internalSet),
            jsonLdTypes: Array.from(typesSet),
          };
        });
      } catch (evalErr) {
        pageError = evalErr instanceof Error ? evalErr.message : String(evalErr);
        ctx.log?.("debug", "crawl page evaluate failed", {
          url: target,
          error: pageError,
        });
      }
    }

    const isNoindex =
      /\bnoindex\b/i.test(data.robotsMeta) || /\bnoindex\b/i.test(xRobotsTag);
    const normalizedFinal = normalizeKey(finalUrl) || finalUrl;
    const canonicalNormalized = data.canonical ? normalizeKey(data.canonical) : "";
    const canonicalToOther = Boolean(
      canonicalNormalized && canonicalNormalized !== normalizedFinal
    );

    const summary: PageSummary = {
      url: target,
      finalUrl,
      status,
      title: data.title,
      metaDescription: data.metaDescription,
      metaDescriptionLength: data.metaDescription.length,
      metaDescriptionPresent: !trimmedEmpty(data.metaDescription),
      canonical: data.canonical,
      robotsMeta: data.robotsMeta,
      xRobotsTag,
      h1Count: data.h1s.length,
      h1Sample: data.h1s.slice(0, MAX_H1_SAMPLE),
      wordCount: data.wordCount,
      internalLinkCount: data.internalLinks.length,
      outgoingSample: data.internalLinks.slice(0, MAX_OUTGOING_SAMPLE),
      jsonLdTypes: data.jsonLdTypes.slice(0, MAX_JSONLD_SAMPLE),
      noindex: isNoindex,
      canonicalToOther,
    };
    pages.push(summary);

    if (pageError) {
      if (aggregate.crawlErrors.length < ERROR_SAMPLE_CAP) {
        aggregate.crawlErrors.push({ url: target, error: pageError });
      }
    }

    // Bucket accounting and issue samples (skip when we had a navigation error).
    if (!pageError) {
      aggregate.statusBuckets[bucket(status)] += 1;
      if (trimmedEmpty(summary.title) && aggregate.missingTitle.length < MISSING_SAMPLE_CAP) {
        aggregate.missingTitle.push(finalUrl);
      }
      if (
        !summary.metaDescriptionPresent &&
        aggregate.missingMetaDescription.length < MISSING_SAMPLE_CAP
      ) {
        aggregate.missingMetaDescription.push(finalUrl);
      }
      if (summary.h1Count === 0 && aggregate.missingH1.length < MISSING_SAMPLE_CAP) {
        aggregate.missingH1.push(finalUrl);
      }
      if (isNoindex && aggregate.noindex.length < MISSING_SAMPLE_CAP) {
        aggregate.noindex.push(finalUrl);
      }
      if (
        canonicalToOther &&
        aggregate.canonicalToOther.length < MISSING_SAMPLE_CAP
      ) {
        aggregate.canonicalToOther.push({
          url: finalUrl,
          canonical: data.canonical,
        });
      }
    }

    // Enqueue same-host, non-static, hash-deduped internal links.
    if (pages.length < cap) {
      for (const link of data.internalLinks) {
        if (!link) continue;
        if (SKIP_EXT_RE.test(link)) {
          skippedStaticCount += 1;
          continue;
        }
        if (SKIP_SCHEMES.test(link)) continue;
        let key: string | null;
        try {
          const parsed = new URL(link);
          if (parsed.origin !== startOrigin) continue;
          key = normalizeKey(link);
        } catch {
          continue;
        }
        if (!key || seen.has(key)) continue;
        seen.add(key);
        queue.push(link);
        queuedCount += 1;
      }
    }

    ctx.log?.("debug", "crawl page done", {
      url: target,
      finalUrl,
      status,
      durationMs: Date.now() - startedAt,
      queueSize: queue.length,
      visited: pages.length,
    });
  }

  // Duplicate detection over the visited set. Each sample is capped to keep
  // the model context small.
  const titleGroups = new Map<string, string[]>();
  const descGroups = new Map<string, string[]>();
  for (const p of pages) {
    const t = p.title.trim();
    if (t) {
      const arr = titleGroups.get(t) ?? [];
      arr.push(p.finalUrl);
      titleGroups.set(t, arr);
    }
    const d = p.metaDescription.trim();
    if (d) {
      const arr = descGroups.get(d) ?? [];
      arr.push(p.finalUrl);
      descGroups.set(d, arr);
    }
  }
  for (const [t, urls] of titleGroups) {
    if (urls.length > 1 && aggregate.duplicateTitles.length < DUPLICATE_SAMPLE_CAP) {
      aggregate.duplicateTitles.push({
        title: t.length > 200 ? `${t.slice(0, 200)}…` : t,
        urls: urls.slice(0, 5),
      });
    }
  }
  for (const [d, urls] of descGroups) {
    if (
      urls.length > 1 &&
      aggregate.duplicateMetaDescriptions.length < DUPLICATE_SAMPLE_CAP
    ) {
      aggregate.duplicateMetaDescriptions.push({
        metaDescription: d.length > 200 ? `${d.slice(0, 200)}…` : d,
        urls: urls.slice(0, 5),
      });
    }
  }

  const result = {
    startUrl,
    startOrigin,
    maxPages: cap,
    visitedCount: pages.length,
    queuedCount,
    skippedStaticCount,
    pages,
    ...aggregate,
  };

  ctx.log?.("debug", "crawl_site_sample done", {
    startUrl,
    visitedCount: result.visitedCount,
    queuedCount: result.queuedCount,
    skippedStaticCount: result.skippedStaticCount,
    statusBuckets: result.statusBuckets,
  });

  return result;
}
