import type { BrowserToolContext } from "../types";

export async function inspectHreflang(
  ctx: BrowserToolContext,
  url: string,
  checkReciprocal?: boolean
) {
  const MAX_ALTERNATE_CHECK = 20;
  const MAX_SAMPLE = 30;
  const MAX_RECIPROCAL = 8;
  const MAX_RECIPROCAL_SAMPLE = 10;
  const ALT_CHECK_TIMEOUT_MS = 5000;
  const RECIPROCAL_TIMEOUT_MS = 6000;
  const HREFLANG_REGEX = /^(?:[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*|x-default)$/;

  const userAgent =
    "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";

  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  const data = await page.evaluate(() => {
    const root = document.documentElement;
    const htmlLang = root.getAttribute("lang") || "";
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalEl
      ? canonicalEl.getAttribute("href") || ""
      : "";
    const altLinks = Array.from(
      document.querySelectorAll('link[rel="alternate"][hreflang]')
    );
    const alternates: { hreflang: string; href: string }[] = [];
    for (const link of altLinks) {
      const hl = (link.getAttribute("hreflang") || "").trim();
      const href = (link.getAttribute("href") || "").trim();
      if (!hl || !href) continue;
      alternates.push({ hreflang: hl, href });
    }
    return { htmlLang, canonical, alternates };
  });

  const normalizeUrl = (raw: string, base: string): string => {
    try {
      return new URL(raw, base).toString().replace(/\/$/, "");
    } catch {
      return raw;
    }
  };
  const sourceNorm = normalizeUrl(finalUrl, finalUrl);
  let resolvedCanonical = "";
  if (data.canonical) {
    try {
      resolvedCanonical = new URL(data.canonical, finalUrl).toString();
    } catch {
      resolvedCanonical = data.canonical;
    }
  }
  const canonicalNorm = resolvedCanonical
    ? normalizeUrl(resolvedCanonical, finalUrl)
    : "";

  const hreflangCounts = new Map<string, number>();
  const duplicateLangs: string[] = [];
  const invalidLangs: string[] = [];
  let xDefault = false;
  let selfReference = false;

  for (const alt of data.alternates) {
    const hl = alt.hreflang;
    const hlLower = hl.toLowerCase();
    if (hlLower === "x-default") xDefault = true;
    const next = (hreflangCounts.get(hlLower) || 0) + 1;
    hreflangCounts.set(hlLower, next);
    if (next === 2) duplicateLangs.push(hl);
    if (!HREFLANG_REGEX.test(hl) && !invalidLangs.includes(hl)) {
      invalidLangs.push(hl);
    }
    const norm = normalizeUrl(alt.href, finalUrl);
    if (norm === sourceNorm || (canonicalNorm && norm === canonicalNorm)) {
      selfReference = true;
    }
  }

  const sample = data.alternates.slice(0, MAX_SAMPLE);
  const targets = data.alternates.slice(0, MAX_ALTERNATE_CHECK);

  const checkOne = async (alt: { hreflang: string; href: string }) => {
    let resolved = "";
    try {
      resolved = new URL(alt.href, finalUrl).toString();
    } catch {
      return {
        hreflang: alt.hreflang,
        href: alt.href,
        status: 0,
        finalUrl: "",
        redirects: false,
        indexable: false,
        error: "invalidUrl",
      };
    }
    const fetchOnce = async (
      method: "HEAD" | "GET"
    ): Promise<Response | null> => {
      try {
        const r = await fetch(resolved, {
          method,
          redirect: "follow",
          headers: {
            "User-Agent": userAgent,
            Accept: method === "HEAD" ? "*/*" : "text/html,*/*",
          },
          signal: AbortSignal.timeout(ALT_CHECK_TIMEOUT_MS),
        });
        if (r.body) {
          try {
            await r.body.cancel();
          } catch {
            /* best effort */
          }
        }
        return r;
      } catch {
        return null;
      }
    };
    let fetchErr: string | undefined;
    let response = await fetchOnce("HEAD");
    if (!response || response.status === 405 || response.status === 501) {
      response = await fetchOnce("GET");
    }
    let statusCode = 0;
    let finalUrlResp = resolved;
    if (response) {
      statusCode = response.status;
      finalUrlResp = response.url || resolved;
    } else {
      fetchErr = "fetchFailed";
    }
    const redirects = finalUrlResp !== resolved;
    const indexable = statusCode >= 200 && statusCode < 300;
    const result: {
      hreflang: string;
      href: string;
      status: number;
      finalUrl: string;
      redirects: boolean;
      indexable: boolean;
      error?: string;
    } = {
      hreflang: alt.hreflang,
      href: alt.href,
      status: statusCode,
      finalUrl: finalUrlResp,
      redirects,
      indexable,
    };
    if (fetchErr) result.error = fetchErr;
    return result;
  };

  const alternateChecks = await Promise.all(targets.map(checkOne));

  type ReciprocalResult = {
    hreflang: string;
    sourceUrl: string;
    foundBack: boolean;
    matchedVia: string;
    error?: string;
  };

  const parseHreflangLinks = (
    html: string
  ): { hreflang: string; href: string }[] => {
    const out: { hreflang: string; href: string }[] = [];
    const re = /<link\b[^>]*?\/?>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const tag = m[0];
      const relMatch = tag.match(/\brel\s*=\s*["']([^"']*)["']/i);
      if (!relMatch || !relMatch[1]) continue;
      const relParts = relMatch[1].toLowerCase().split(/\s+/);
      if (!relParts.includes("alternate")) continue;
      const hlMatch = tag.match(/\bhreflang\s*=\s*["']([^"']*)["']/i);
      const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i);
      if (hlMatch && hlMatch[1] && hrefMatch && hrefMatch[1]) {
        out.push({ hreflang: hlMatch[1].trim(), href: hrefMatch[1].trim() });
      }
    }
    return out;
  };

  const parseCanonical = (html: string): string => {
    const re = /<link\b[^>]*?\/?>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const tag = m[0];
      const relMatch = tag.match(/\brel\s*=\s*["']([^"']*)["']/i);
      if (!relMatch || !relMatch[1]) continue;
      const relParts = relMatch[1].toLowerCase().split(/\s+/);
      if (!relParts.includes("canonical")) continue;
      const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i);
      if (hrefMatch && hrefMatch[1]) return hrefMatch[1].trim();
    }
    return "";
  };

  let reciprocalCheck:
    | {
        checkedCount: number;
        results: ReciprocalResult[];
        reciprocalMissing: { hreflang: string; sourceUrl: string }[];
      }
    | undefined;

  if (checkReciprocal) {
    const candidates = alternateChecks
      .filter((c) => c.status >= 200 && c.status < 400 && c.finalUrl)
      .slice(0, MAX_RECIPROCAL);

    const checkReciprocalOne = async (
      c: (typeof alternateChecks)[number]
    ): Promise<ReciprocalResult> => {
      const targetUrl = c.finalUrl;
      try {
        const resp = await fetch(targetUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": userAgent,
            Accept: "text/html,*/*",
          },
          signal: AbortSignal.timeout(RECIPROCAL_TIMEOUT_MS),
        });
        if (!resp.ok) {
          return {
            hreflang: c.hreflang,
            sourceUrl: targetUrl,
            foundBack: false,
            matchedVia: "",
            error: `HTTP ${resp.status}`,
          };
        }
        const html = await resp.text();
        const alts = parseHreflangLinks(html);
        const canonical = parseCanonical(html);
        const pageFinalUrl = resp.url || targetUrl;
        const targetNorm = (s: string): string =>
          normalizeUrl(s, pageFinalUrl);
        let foundBack = false;
        let matchedVia = "";
        for (const a of alts) {
          const n = targetNorm(a.href);
          if (n === sourceNorm) {
            foundBack = true;
            matchedVia = `hreflang:${a.hreflang}`;
            break;
          }
          if (canonicalNorm && n === canonicalNorm) {
            foundBack = true;
            matchedVia = `hreflang:${a.hreflang}->canonical`;
            break;
          }
        }
        if (!foundBack && canonical) {
          const cn = targetNorm(canonical);
          if (cn === sourceNorm) {
            foundBack = true;
            matchedVia = "canonical";
          }
        }
        return {
          hreflang: c.hreflang,
          sourceUrl: targetUrl,
          foundBack,
          matchedVia,
        };
      } catch (e) {
        return {
          hreflang: c.hreflang,
          sourceUrl: targetUrl,
          foundBack: false,
          matchedVia: "",
          error: e instanceof Error ? e.message : String(e),
        };
      }
    };

    const results = await Promise.all(candidates.map(checkReciprocalOne));
    const reciprocalMissing = results
      .filter((r) => !r.foundBack)
      .slice(0, MAX_RECIPROCAL_SAMPLE)
      .map((r) => ({ hreflang: r.hreflang, sourceUrl: r.sourceUrl }));

    reciprocalCheck = {
      checkedCount: results.length,
      results,
      reciprocalMissing,
    };
  }

  const issues: string[] = [];
  const warnings: string[] = [];

  if (data.alternates.length > 0 && !selfReference) {
    issues.push("missingSelfReference");
  }
  if (data.alternates.length > 0 && !xDefault) {
    warnings.push("missingXDefault");
  }
  if (duplicateLangs.length > 0) {
    issues.push("duplicateHreflang");
  }
  if (invalidLangs.length > 0) {
    issues.push("invalidHreflang");
  }
  if (alternateChecks.some((c) => c.status === 0 || c.status >= 400)) {
    issues.push("alternateNon200");
  }
  if (alternateChecks.some((c) => c.redirects)) {
    warnings.push("alternateRedirects");
  }
  if (reciprocalCheck && reciprocalCheck.reciprocalMissing.length > 0) {
    issues.push("reciprocalMissing");
  }

  return {
    source: {
      url,
      finalUrl,
      status,
      htmlLang: data.htmlLang,
      canonical: data.canonical,
    },
    alternates: {
      count: data.alternates.length,
      xDefault,
      selfReference,
      duplicateLangs,
      invalidLangs,
      sample,
    },
    alternateChecks,
    reciprocalCheck,
    issues,
    warnings,
  };
}
