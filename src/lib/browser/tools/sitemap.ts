import { truncate } from "../utils";
import type { BrowserToolContext } from "../types";

export async function fetchRobotsAndSitemap(
  _ctx: BrowserToolContext,
  baseUrl: string
) {
  const origin = new URL(baseUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;
  const sitemapUrl = `${origin}/sitemap.xml`;
  const fetchText = (url: string) =>
    fetch(url, { signal: AbortSignal.timeout(15000) })
      .then((r) => r.text())
      .catch((e) => `Error: ${e.message}`);
  const [robotsRes, sitemapRes] = await Promise.all([
    fetchText(robotsUrl),
    fetchText(sitemapUrl),
  ]);
  return {
    robotsUrl,
    robots: truncate(robotsRes, 12000),
    sitemapUrl,
    sitemap: truncate(sitemapRes, 12000),
  };
}

export async function parseSitemap(
  _ctx: BrowserToolContext,
  inputUrl: string,
  maxUrls?: number,
  checkSample?: boolean
) {
  const MAX_URLS_LIMIT = 1000;
  const DEFAULT_MAX_URLS = 200;
  const MAX_CHILD_SITEMAPS = 10;
  const MAX_SAMPLE_URLS = 30;
  const MAX_FETCHED_SITEMAPS = 12;
  const MAX_SAMPLE_CHECK = 20;
  const SAMPLE_CHECK_TIMEOUT_MS = 4000;
  const SITEMAP_FETCH_TIMEOUT_MS = 12000;
  const ROBOTS_FETCH_TIMEOUT_MS = 10000;
  const SAMPLE_HREFLANG = 10;
  const SAMPLE_SUSPICIOUS = 20;

  const userAgent =
    "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";
  const errors: string[] = [];

  let normalizedInput = "";
  try {
    normalizedInput = new URL(inputUrl).toString();
  } catch {
    return {
      inputUrl,
      error: `Invalid URL: ${inputUrl}`,
      discoveredFromRobots: false,
      sitemapUrls: [] as string[],
      fetchedSitemaps: [] as {
        url: string;
        status: number;
        contentType: string;
        urlCount: number;
        sitemapIndexCount: number;
        error?: string;
      }[],
      totalUrls: 0,
      discoveredTotalUrls: 0,
      truncated: false,
      sampledUrls: [] as {
        loc: string;
        lastmod?: string;
        changefreq?: string;
        hreflangCount: number;
      }[],
      lastmodStats: { withLastmod: 0, withoutLastmod: 0, newest: "", oldest: "" },
      hreflangAlternates: { count: 0, sample: [] as { hreflang: string; href: string; source: string }[] },
      suspiciousUrls: [] as { url: string; reasons: string[] }[],
      sampleCheck: undefined as
        | undefined
        | {
            checkedCount: number;
            results: { url: string; status: number; finalUrl: string; error?: string }[];
          },
      errors: [`Invalid URL: ${inputUrl}`],
    };
  }

  let pathLower = "";
  let origin = "";
  try {
    const u = new URL(normalizedInput);
    pathLower = u.pathname.toLowerCase();
    origin = u.origin;
  } catch {
    /* unreachable */
  }

  const isRobotsTxt = /\/robots\.txt(?:[?#].*)?$/i.test(pathLower);
  const isSitemapLike =
    /\.xml(?:[?#].*)?$/i.test(pathLower) || /sitemap/i.test(pathLower);

  let sitemapUrls: string[] = [];
  let discoveredFromRobots = false;

  const fetchRobotsSitemaps = async (robotsUrl: string): Promise<string[]> => {
    try {
      const res = await fetch(robotsUrl, {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(ROBOTS_FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        errors.push(`robots.txt fetch returned ${res.status}`);
        return [];
      }
      const text = await res.text();
      const out: string[] = [];
      for (const m of text.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)) {
        if (m[1]) out.push(m[1].trim());
      }
      return out;
    } catch (err) {
      errors.push(
        `robots.txt fetch failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return [];
    }
  };

  if (isRobotsTxt) {
    const found = await fetchRobotsSitemaps(normalizedInput);
    if (found.length > 0) {
      sitemapUrls = found;
      discoveredFromRobots = true;
    } else if (origin) {
      sitemapUrls.push(`${origin}/sitemap.xml`);
    }
  } else if (isSitemapLike) {
    sitemapUrls.push(normalizedInput);
  } else if (origin) {
    const found = await fetchRobotsSitemaps(`${origin}/robots.txt`);
    if (found.length > 0) {
      sitemapUrls = found;
      discoveredFromRobots = true;
    } else {
      sitemapUrls.push(`${origin}/sitemap.xml`);
    }
  }

  const urlCap = Math.max(
    1,
    Math.min(MAX_URLS_LIMIT, Number(maxUrls) || DEFAULT_MAX_URLS)
  );

  const stripCdata = (s: string): string =>
    s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  const decodeXml = (s: string): string => {
    if (s.indexOf("&") === -1) return s;
    return s
      .replace(/&#(\d+);/g, (_, code) => {
        try {
          return String.fromCodePoint(parseInt(code, 10));
        } catch {
          return "";
        }
      })
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  };

  type ParsedEntry = {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: number;
    hreflangAlts: { hreflang: string; href: string }[];
  };

  const entries: ParsedEntry[] = [];
  const fetchedSitemaps: {
    url: string;
    status: number;
    contentType: string;
    urlCount: number;
    sitemapIndexCount: number;
    error?: string;
  }[] = [];

  const queue: string[] = [...sitemapUrls];
  const seenSitemapUrls = new Set<string>();
  let discoveredTotalUrls = 0;
  let childSitemapsFetched = 0;
  let truncatedByMaxUrls = false;

  const isSitemapIndex = (xml: string) => /<\s*sitemapindex\b/i.test(xml);
  const isUrlSet = (xml: string) => /<\s*urlset\b/i.test(xml);

  const extractSitemapIndexLocs = (rawXml: string): string[] => {
    const xml = stripCdata(rawXml);
    const out: string[] = [];
    const tagRe = /<\s*sitemap\b[^>]*>([\s\S]*?)<\/\s*sitemap\s*>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(xml)) !== null) {
      const block = m[1] || "";
      const locMatch = block.match(/<\s*loc\s*>([^<]*)<\/\s*loc\s*>/i);
      if (locMatch && locMatch[1]) {
        out.push(decodeXml(locMatch[1].trim()));
      }
    }
    return out;
  };

  const extractUrlEntries = (rawXml: string): ParsedEntry[] => {
    const xml = stripCdata(rawXml);
    const out: ParsedEntry[] = [];
    const urlRe = /<\s*url\b[^>]*>([\s\S]*?)<\/\s*url\s*>/gi;
    let m: RegExpExecArray | null;
    while ((m = urlRe.exec(xml)) !== null) {
      const block = m[1] || "";
      const locMatch = block.match(/<\s*loc\s*>([^<]*)<\/\s*loc\s*>/i);
      if (!locMatch || !locMatch[1]) continue;
      const loc = decodeXml(locMatch[1].trim());
      const lastmodMatch = block.match(
        /<\s*lastmod\s*>([^<]*)<\/\s*lastmod\s*>/i
      );
      const changefreqMatch = block.match(
        /<\s*changefreq\s*>([^<]*)<\/\s*changefreq\s*>/i
      );
      const priorityMatch = block.match(
        /<\s*priority\s*>([^<]*)<\/\s*priority\s*>/i
      );
      const lastmod =
        lastmodMatch && lastmodMatch[1] ? decodeXml(lastmodMatch[1].trim()) : "";
      const changefreq =
        changefreqMatch && changefreqMatch[1]
          ? decodeXml(changefreqMatch[1].trim())
          : "";
      const priority =
        priorityMatch && priorityMatch[1]
          ? Number(priorityMatch[1].trim())
          : Number.NaN;
      const hreflangAlts: { hreflang: string; href: string }[] = [];
      const linkRe = /<\s*xhtml:link\b[^>]*\/?\s*>/gi;
      let lm: RegExpExecArray | null;
      while ((lm = linkRe.exec(block)) !== null) {
        const tagStr = lm[0] || "";
        const hreflangMatch = tagStr.match(
          /hreflang\s*=\s*["']([^"']*)["']/i
        );
        const hrefMatch = tagStr.match(/\bhref\s*=\s*["']([^"']*)["']/i);
        if (
          hreflangMatch &&
          hreflangMatch[1] &&
          hrefMatch &&
          hrefMatch[1]
        ) {
          hreflangAlts.push({
            hreflang: decodeXml(hreflangMatch[1]),
            href: decodeXml(hrefMatch[1]),
          });
        }
      }
      out.push({ loc, lastmod, changefreq, priority, hreflangAlts });
    }
    return out;
  };

  while (
    queue.length > 0 &&
    entries.length < urlCap &&
    fetchedSitemaps.length < MAX_FETCHED_SITEMAPS
  ) {
    const smUrl = queue.shift() as string;
    if (seenSitemapUrls.has(smUrl)) continue;
    seenSitemapUrls.add(smUrl);

    const record: {
      url: string;
      status: number;
      contentType: string;
      urlCount: number;
      sitemapIndexCount: number;
      error?: string;
    } = {
      url: smUrl,
      status: 0,
      contentType: "",
      urlCount: 0,
      sitemapIndexCount: 0,
    };

    let response: Response;
    try {
      response = await fetch(smUrl, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/xml,text/xml,*/*",
        },
        signal: AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS),
        redirect: "follow",
      });
      record.status = response.status;
      record.contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        record.error = `HTTP ${response.status}`;
        fetchedSitemaps.push(record);
        continue;
      }
      const xml = await response.text();
      if (isSitemapIndex(xml)) {
        const childLocs = extractSitemapIndexLocs(xml);
        record.sitemapIndexCount = childLocs.length;
        fetchedSitemaps.push(record);
        for (const child of childLocs) {
          if (childSitemapsFetched >= MAX_CHILD_SITEMAPS) break;
          let resolved: string;
          try {
            resolved = new URL(child, smUrl).toString();
          } catch {
            continue;
          }
          queue.push(resolved);
          childSitemapsFetched += 1;
        }
      } else if (isUrlSet(xml)) {
        const parsed = extractUrlEntries(xml);
        record.urlCount = parsed.length;
        discoveredTotalUrls += parsed.length;
        fetchedSitemaps.push(record);
        for (const e of parsed) {
          if (entries.length >= urlCap) {
            truncatedByMaxUrls = true;
            continue;
          }
          entries.push(e);
        }
      } else {
        record.error = "Unrecognized XML structure";
        fetchedSitemaps.push(record);
      }
    } catch (err) {
      record.error = err instanceof Error ? err.message : String(err);
      fetchedSitemaps.push(record);
    }
  }

  let withLastmod = 0;
  let withoutLastmod = 0;
  let newest = "";
  let oldest = "";
  for (const e of entries) {
    if (e.lastmod) {
      withLastmod += 1;
      if (!newest || e.lastmod > newest) newest = e.lastmod;
      if (!oldest || e.lastmod < oldest) oldest = e.lastmod;
    } else {
      withoutLastmod += 1;
    }
  }

  const sampledUrls: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    hreflangCount: number;
  }[] = [];
  for (const e of entries.slice(0, MAX_SAMPLE_URLS)) {
    const sample: {
      loc: string;
      lastmod?: string;
      changefreq?: string;
      hreflangCount: number;
    } = { loc: e.loc, hreflangCount: e.hreflangAlts.length };
    if (e.lastmod) sample.lastmod = e.lastmod;
    if (e.changefreq) sample.changefreq = e.changefreq;
    sampledUrls.push(sample);
  }

  const allAlts: { hreflang: string; href: string; source: string }[] = [];
  for (const e of entries) {
    for (const alt of e.hreflangAlts) {
      allAlts.push({ hreflang: alt.hreflang, href: alt.href, source: e.loc });
    }
  }
  const hreflangAlternates = {
    count: allAlts.length,
    sample: allAlts.slice(0, SAMPLE_HREFLANG),
  };

  const SUSPICIOUS_PATH_RE =
    /\/(?:admin|administrator|login|signin|sign[_-]?in|sign[_-]?up|signup|account|accounts|user|users|private|internal|checkout|cart|order|orders|wp-admin|wp-login|register|password|backend|dashboard|secret)(?:\/|\?|#|\.|$)/i;
  const suspiciousUrls: { url: string; reasons: string[] }[] = [];
  for (const e of entries) {
    if (suspiciousUrls.length >= SAMPLE_SUSPICIOUS) break;
    const reasons: string[] = [];
    try {
      const u = new URL(e.loc);
      if (u.protocol !== "https:") reasons.push("nonHttps");
      if (u.search && u.search.length > 1) reasons.push("hasParams");
      if (SUSPICIOUS_PATH_RE.test(u.pathname)) reasons.push("privateArea");
    } catch {
      reasons.push("invalidUrl");
    }
    if (reasons.length > 0) {
      suspiciousUrls.push({ url: e.loc, reasons });
    }
  }

  let sampleCheck:
    | undefined
    | {
        checkedCount: number;
        results: { url: string; status: number; finalUrl: string; error?: string }[];
      };

  if (checkSample && entries.length > 0) {
    const toCheck = entries.slice(0, MAX_SAMPLE_CHECK);
    const results: {
      url: string;
      status: number;
      finalUrl: string;
      error?: string;
    }[] = [];

    const checkOne = async (e: ParsedEntry) => {
      let status = 0;
      let finalUrl = e.loc;
      let error: string | undefined;
      try {
        const headRes = await fetch(e.loc, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": userAgent },
          signal: AbortSignal.timeout(SAMPLE_CHECK_TIMEOUT_MS),
        });
        status = headRes.status;
        finalUrl = headRes.url || e.loc;
      } catch {
        try {
          const getRes = await fetch(e.loc, {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": userAgent },
            signal: AbortSignal.timeout(SAMPLE_CHECK_TIMEOUT_MS),
          });
          status = getRes.status;
          finalUrl = getRes.url || e.loc;
          if (getRes.body) {
            try {
              await getRes.body.cancel();
            } catch {
              /* best effort */
            }
          }
        } catch (getErr) {
          error = getErr instanceof Error ? getErr.message : String(getErr);
        }
      }
      results.push({ url: e.loc, status, finalUrl, error });
    };

    await Promise.all(toCheck.map(checkOne));

    sampleCheck = { checkedCount: toCheck.length, results };
  }

  return {
    inputUrl,
    normalizedUrl: normalizedInput,
    discoveredFromRobots,
    sitemapUrls,
    fetchedSitemaps,
    totalUrls: entries.length,
    discoveredTotalUrls,
    truncated: truncatedByMaxUrls,
    sampledUrls,
    lastmodStats: { withLastmod, withoutLastmod, newest, oldest },
    hreflangAlternates,
    suspiciousUrls,
    sampleCheck,
    errors,
  };
}
