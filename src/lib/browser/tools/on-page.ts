import type { BrowserToolContext } from "../types";

export async function inspectPageSeo(ctx: BrowserToolContext, url: string) {
  const start = Date.now();
  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const responseTime = Date.now() - start;
  const status = response?.status() ?? 0;
  const headers = response?.headers() ?? {};
  let xRobotsTag = "";
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "x-robots-tag") {
      xRobotsTag = headers[key] ?? "";
      break;
    }
  }
  const finalUrl = page.url();

  const data = await page.evaluate(() => {
    const root = document.documentElement;
    const htmlLang = root.getAttribute("lang") || "";

    let charset = "";
    const charsetEl = document.querySelector("meta[charset]");
    if (charsetEl) {
      charset = charsetEl.getAttribute("charset") || "";
    } else {
      const csp = document.querySelector('meta[http-equiv="content-type"]');
      if (csp) {
        const content = (csp.getAttribute("content") || "").toLowerCase();
        const m = content.match(/charset\s*=\s*([^;\s]+)/);
        if (m && m[1]) charset = m[1];
      }
    }

    const viewportEl = document.querySelector('meta[name="viewport"]');
    const viewport = viewportEl ? viewportEl.getAttribute("content") || "" : "";

    const title = document.title || "";

    const descEl = document.querySelector('meta[name="description"]');
    const metaDescription = descEl ? descEl.getAttribute("content") || "" : "";

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalEl ? canonicalEl.getAttribute("href") || "" : "";

    const robotsEl = document.querySelector('meta[name="robots"]');
    const robotsMeta = robotsEl ? robotsEl.getAttribute("content") || "" : "";

    const h1Els = Array.from(document.querySelectorAll("h1"));
    const h1s = h1Els.map((h) => h.innerText.trim()).filter(Boolean);
    const h2Els = Array.from(document.querySelectorAll("h2"));
    const h3Els = Array.from(document.querySelectorAll("h3"));
    const h2Sample = h2Els
      .map((h) => h.innerText.trim())
      .filter(Boolean)
      .slice(0, 10);
    const h3Sample = h3Els
      .map((h) => h.innerText.trim())
      .filter(Boolean)
      .slice(0, 10);

    const bodyText = (
      document.body && document.body.innerText ? document.body.innerText : ""
    )
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

    const imgEls = Array.from(document.querySelectorAll("img"));
    let missingAlt = 0;
    let emptyAlt = 0;
    const sampleMissingAlt: string[] = [];
    for (const img of imgEls) {
      if (!img.hasAttribute("alt")) {
        missingAlt += 1;
        if (sampleMissingAlt.length < 10) {
          const src = img.getAttribute("src") || "";
          sampleMissingAlt.push(src.slice(0, 200));
        }
      } else if ((img.getAttribute("alt") || "").trim() === "") {
        emptyAlt += 1;
      }
    }

    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const loc = window.location;
    let internalCount = 0;
    let externalCount = 0;
    let nofollowCount = 0;
    const sampleInternal: string[] = [];
    const sampleExternal: string[] = [];
    for (const a of anchors) {
      const href = a.getAttribute("href") || "";
      const rel = (a.getAttribute("rel") || "").toLowerCase();
      if (rel.split(/\s+/).includes("nofollow")) nofollowCount += 1;
      let resolved: URL;
      try {
        resolved = new URL(href, loc.href);
      } catch {
        continue;
      }
      if (resolved.hostname === loc.hostname) {
        internalCount += 1;
        if (sampleInternal.length < 10) sampleInternal.push(resolved.href);
      } else {
        externalCount += 1;
        if (sampleExternal.length < 10) sampleExternal.push(resolved.href);
      }
    }

    const ldScripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    let jsonLdCount = 0;
    let parseErrors = 0;
    const typesSet = new Set<string>();
    for (const s of ldScripts) {
      const text = s.textContent || "";
      if (!text.trim()) continue;
      try {
        const parsed: unknown = JSON.parse(text);
        jsonLdCount += 1;
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
        parseErrors += 1;
      }
    }
    const types = Array.from(typesSet).slice(0, 20);

    const getMeta = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? el.getAttribute("content") || "" : "";
    };
    const ogTitle = getMeta('meta[property="og:title"]');
    const ogDescription = getMeta('meta[property="og:description"]');
    const ogUrl = getMeta('meta[property="og:url"]');
    const ogType = getMeta('meta[property="og:type"]');
    const ogSiteName = getMeta('meta[property="og:site_name"]');
    const ogImage = getMeta('meta[property="og:image"]');

    const twCard = getMeta('meta[name="twitter:card"]');
    const twTitle = getMeta('meta[name="twitter:title"]');
    const twDescription = getMeta('meta[name="twitter:description"]');
    const twImage = getMeta('meta[name="twitter:image"]');

    const altLinks = Array.from(
      document.querySelectorAll('link[rel="alternate"][hreflang]')
    );
    const hreflang: { hreflang: string; href: string }[] = [];
    let xDefault = false;
    for (const link of altLinks) {
      const hl = link.getAttribute("hreflang") || "";
      const href = link.getAttribute("href") || "";
      if (hl.toLowerCase() === "x-default") xDefault = true;
      if (hreflang.length < 20) hreflang.push({ hreflang: hl, href });
    }

    const scripts = Array.from(document.querySelectorAll("script"));
    let gtm = false;
    let ga4 = false;
    let yandexMetrica = false;
    for (const s of scripts) {
      const src = s.getAttribute("src") || "";
      const text = (s.textContent || "").slice(0, 2000);
      if (
        !gtm &&
        (/googletagmanager\.com\/(?:gtm\.js|gtag\/js)/i.test(src) ||
          /\bdataLayer\b/.test(text) ||
          /\bGTM-[A-Z0-9]+\b/.test(text))
      ) {
        gtm = true;
      }
      if (
        !ga4 &&
        (/googletagmanager\.com\/gtag\/js/i.test(src) ||
          /\bgtag\s*\(/.test(text) ||
          /\bG-[A-Z0-9]+\b/.test(text))
      ) {
        ga4 = true;
      }
      if (
        !yandexMetrica &&
        (/mc\.yandex\.ru\/metrika/i.test(src) ||
          /\bym\s*\(/.test(text) ||
          /\byaCounter\d+/i.test(text))
      ) {
        yandexMetrica = true;
      }
      if (gtm && ga4 && yandexMetrica) break;
    }

    return {
      htmlLang,
      charset,
      viewport,
      title,
      metaDescription,
      canonical,
      robotsMeta,
      h1s: h1s.slice(0, 20),
      h1Count: h1Els.length,
      h2Count: h2Els.length,
      h2Sample,
      h3Count: h3Els.length,
      h3Sample,
      wordCount,
      images: { total: imgEls.length, missingAlt, emptyAlt, sampleMissingAlt },
      links: { internalCount, externalCount, nofollowCount, sampleInternal, sampleExternal },
      structuredData: { jsonLdCount, types, parseErrors },
      openGraph: { ogTitle, ogDescription, ogUrl, ogType, ogSiteName, ogImage },
      twitter: { card: twCard, title: twTitle, description: twDescription, image: twImage },
      hreflang: { count: altLinks.length, xDefault, sample: hreflang },
      analytics: { gtm, ga4, yandexMetrica },
    };
  });

  return {
    url,
    finalUrl,
    status,
    responseTime,
    title: data.title,
    titleLength: data.title.length,
    metaDescription: data.metaDescription,
    metaDescriptionLength: data.metaDescription.length,
    canonical: data.canonical,
    robotsMeta: data.robotsMeta,
    xRobotsTag,
    htmlLang: data.htmlLang,
    charset: data.charset,
    viewport: data.viewport,
    headings: {
      h1s: data.h1s,
      h1Count: data.h1Count,
      h2Count: data.h2Count,
      h2Sample: data.h2Sample,
      h3Count: data.h3Count,
      h3Sample: data.h3Sample,
    },
    wordCount: data.wordCount,
    images: data.images,
    links: data.links,
    structuredData: data.structuredData,
    openGraph: data.openGraph,
    twitter: data.twitter,
    hreflang: data.hreflang,
    analytics: data.analytics,
  };
}
