import type { BrowserToolContext } from "../types";

export async function extractStructuredData(
  ctx: BrowserToolContext,
  url: string,
  checkImages?: boolean
) {
  const MAX_BLOCK_SAMPLE = 2;
  const MAX_BLOCKS_SUMMARY = 5;
  const MAX_TYPES = 30;
  const MAX_IDS = 10;
  const MAX_CONTEXTS = 5;
  const MAX_ITEM_TYPES = 10;
  const MAX_ITEM_PROPS = 15;
  const MAX_PROPERTY_SAMPLE = 10;
  const MAX_VOCAB_SAMPLE = 5;
  const MAX_SCHEMA_IMAGES = 10;
  const MAX_IMAGE_CHECK = 10;
  const BLOCK_TRUNCATE = 800;
  const IMAGE_CHECK_TIMEOUT_MS = 4000;

  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  type SummaryFieldValue = string | number | boolean | "_array" | "_object";
  type BlockSummary = {
    types: string[];
    id?: string;
    fields: Record<string, SummaryFieldValue>;
  };

  const data = await page.evaluate(() => {
    // page.evaluate runs in the browser context, so it has no access to
    // the outer MAX_* consts. Re-declare the same values here. Keep these
    // in sync with the outer consts above.
    const MAX_BLOCK_SAMPLE = 2;
    const MAX_BLOCKS_SUMMARY = 5;
    const MAX_TYPES = 30;
    const MAX_IDS = 10;
    const MAX_CONTEXTS = 5;
    const MAX_ITEM_TYPES = 10;
    const MAX_ITEM_PROPS = 15;
    const MAX_PROPERTY_SAMPLE = 10;
    const MAX_VOCAB_SAMPLE = 5;
    const MAX_SCHEMA_IMAGES = 10;
    const BLOCK_TRUNCATE = 800;

    const title = document.title || "";
    const h1 = (document.querySelector("h1")?.textContent || "").trim();
    const path = window.location.pathname.toLowerCase();
    const isHomepage = path === "/" || path === "";
    const bodyText = (document.body && document.body.innerText
      ? document.body.innerText
      : ""
    ).slice(0, 50000);

    const ldScripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    let jsonLdCount = 0;
    let parseErrors = 0;
    const blocksSample: string[] = [];
    const typesSet = new Set<string>();
    const graphTypesSet = new Set<string>();
    const idsArr: string[] = [];
    const contextsArr: string[] = [];
    const blocksSummary: BlockSummary[] = [];

    const cap = (s: string, n: number) =>
      s.length > n ? s.slice(0, n) + "..." : s;

    const summarizeBlock = (b: Record<string, unknown>) => {
      if (blocksSummary.length >= MAX_BLOCKS_SUMMARY) return;
      const t = b["@type"];
      const types: string[] = [];
      if (typeof t === "string") types.push(t);
      else if (Array.isArray(t)) {
        for (const x of t) {
          if (typeof x === "string") types.push(x);
        }
      }
      if (types.length === 0) return;
      const sum: BlockSummary = { types, fields: {} };
      const id = b["@id"];
      if (typeof id === "string") sum.id = id;
      const fieldNames = [
        "name",
        "headline",
        "datePublished",
        "dateModified",
        "author",
        "image",
        "logo",
        "url",
        "offers",
        "itemListElement",
        "description",
        "price",
        "priceCurrency",
        "sku",
        "telephone",
        "email",
        "address",
        "sameAs",
      ];
      for (const f of fieldNames) {
        const v = b[f];
        if (v === undefined || v === null) continue;
        if (typeof v === "string") sum.fields[f] = cap(v, 200);
        else if (typeof v === "number" || typeof v === "boolean")
          sum.fields[f] = v;
        else if (Array.isArray(v)) sum.fields[f] = "_array";
        else if (typeof v === "object") sum.fields[f] = "_object";
      }
      blocksSummary.push(sum);
    };

    const walk = (node: unknown, inGraph: boolean): void => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach((n) => walk(n, inGraph));
        return;
      }
      if (typeof node !== "object") return;
      const obj = node as Record<string, unknown>;
      const t = obj["@type"];
      if (typeof t === "string") {
        typesSet.add(t);
        if (inGraph) graphTypesSet.add(t);
      } else if (Array.isArray(t)) {
        for (const x of t) {
          if (typeof x === "string") {
            typesSet.add(x);
            if (inGraph) graphTypesSet.add(x);
          }
        }
      }
      const id = obj["@id"];
      if (typeof id === "string" && idsArr.length < MAX_IDS) {
        idsArr.push(id);
      }
      const ctx = obj["@context"];
      if (typeof ctx === "string" && contextsArr.length < MAX_CONTEXTS) {
        contextsArr.push(ctx);
      } else if (Array.isArray(ctx)) {
        for (const it of ctx) {
          if (typeof it === "string" && contextsArr.length < MAX_CONTEXTS) {
            contextsArr.push(it);
          }
        }
      }
      summarizeBlock(obj);
      if (Array.isArray(obj["@graph"])) {
        obj["@graph"].forEach((n) => walk(n, true));
      }
    };

    for (const s of ldScripts) {
      const text = s.textContent || "";
      if (!text.trim()) continue;
      try {
        const parsed: unknown = JSON.parse(text);
        jsonLdCount += 1;
        walk(parsed, false);
        if (blocksSample.length < MAX_BLOCK_SAMPLE) {
          let snippet = text;
          if (snippet.length > BLOCK_TRUNCATE) {
            snippet =
              snippet.slice(0, BLOCK_TRUNCATE) +
              `... [truncated from ${text.length} chars]`;
          }
          blocksSample.push(snippet);
        }
      } catch {
        parseErrors += 1;
      }
    }

    const itemScopes = Array.from(
      document.querySelectorAll("[itemscope]")
    );
    const itemTypes = new Set<string>();
    const itemProps = new Set<string>();
    for (const el of itemScopes) {
      const it = el.getAttribute("itemtype");
      if (it) itemTypes.add(it);
      const all = el.querySelectorAll("[itemprop]");
      for (const p of all) {
        const pn = p.getAttribute("itemprop");
        if (pn) itemProps.add(pn);
      }
    }

    const typeOfEls = Array.from(document.querySelectorAll("[typeof]"));
    const propertyEls = Array.from(document.querySelectorAll("[property]"));
    const vocabEls = Array.from(document.querySelectorAll("[vocab]"));
    const propertySample: string[] = [];
    for (const el of propertyEls) {
      if (propertySample.length >= MAX_PROPERTY_SAMPLE) break;
      const p = el.getAttribute("property");
      if (p) propertySample.push(p);
    }
    const vocabSample: string[] = [];
    for (const el of vocabEls) {
      if (vocabSample.length >= MAX_VOCAB_SAMPLE) break;
      const v = el.getAttribute("vocab");
      if (v) vocabSample.push(v);
    }

    const hasArticle = !!document.querySelector("article");
    const hasDatePublished = !!document.querySelector(
      'meta[property="article:published_time"], meta[property="og:article:published_time"], time[datetime]'
    );
    const hasAuthorByline = !!document.querySelector(
      'meta[name="author"], [rel="author"], [itemprop="author"]'
    );
    const hasPrice =
      !!document.querySelector('[itemprop="price"], [class*="price" i]') ||
      /[$€₽]\s?\d|\d+\s?(?:usd|eur|rub|руб)\b/i.test(bodyText);
    const hasAddToCart = /add\s*to\s*cart|add\s*to\s*bag|купить|в\s*корзину/i.test(
      bodyText
    );
    const hasProductPath = /\/(product|products|item|goods|товар|catalog|shop)\b/i.test(
      path
    );
    const hasBreadcrumb = !!document.querySelector(
      '[itemtype*="BreadcrumbList"], nav[aria-label*="breadcrumb" i], [class*="breadcrumb" i]'
    );

    const imageUrls = new Set<string>();
    const collectImageFromObj = (obj: Record<string, unknown>): void => {
      if (imageUrls.size >= MAX_SCHEMA_IMAGES) return;
      const img = obj["image"];
      if (typeof img === "string") {
        imageUrls.add(img);
      } else if (Array.isArray(img)) {
        for (const it of img) {
          if (imageUrls.size >= MAX_SCHEMA_IMAGES) break;
          if (typeof it === "string") imageUrls.add(it);
          else if (it && typeof it === "object") {
            const o = it as Record<string, unknown>;
            if (typeof o.url === "string") imageUrls.add(o.url);
          }
        }
      } else if (img && typeof img === "object") {
        const o = img as Record<string, unknown>;
        if (typeof o.url === "string") imageUrls.add(o.url);
      }
    };

    for (const s of ldScripts) {
      const text = s.textContent || "";
      if (!text.trim()) continue;
      try {
        const parsed: unknown = JSON.parse(text);
        const walkImg = (node: unknown): void => {
          if (!node) return;
          if (Array.isArray(node)) {
            node.forEach(walkImg);
            return;
          }
          if (typeof node !== "object") return;
          const obj = node as Record<string, unknown>;
          collectImageFromObj(obj);
          if (Array.isArray(obj["@graph"])) {
            obj["@graph"].forEach(walkImg);
          }
        };
        walkImg(parsed);
      } catch {
        /* ignore */
      }
    }

    return {
      title,
      h1,
      pagePath: path,
      isHomepage,
      jsonLd: {
        count: jsonLdCount,
        parseErrors,
        blocksSample,
        types: Array.from(typesSet).slice(0, MAX_TYPES),
        graphTypes: Array.from(graphTypesSet).slice(0, MAX_TYPES),
        ids: idsArr.slice(0, MAX_IDS),
        contexts: contextsArr,
        blocksSummary,
      },
      microdata: {
        itemScopeCount: itemScopes.length,
        itemTypes: Array.from(itemTypes).slice(0, MAX_ITEM_TYPES),
        itemProps: Array.from(itemProps).slice(0, MAX_ITEM_PROPS),
      },
      rdfa: {
        typeofCount: typeOfEls.length,
        propertyCount: propertyEls.length,
        vocabCount: vocabEls.length,
        propertySample,
        vocabSample,
      },
      pageSignals: {
        hasArticle,
        hasDatePublished,
        hasAuthorByline,
        hasPrice,
        hasAddToCart,
        hasProductPath,
        hasBreadcrumb,
      },
      schemaImages: Array.from(imageUrls),
    };
  });

  const detectedTypes: string[] = data.jsonLd.types;
  const pageSignals = data.pageSignals;
  const recommendedMissingHints: Array<{ type: string; reason: string }> = [];
  const validationHints: Array<{
    type?: string;
    issue?: string;
    missingRequiredLikely?: string[];
    count?: number;
  }> = [];
  const visibleConsistencyHints: Array<{
    type: string;
    issue: string;
    schemaHeadline?: string;
    h1: string;
    title: string;
  }> = [];

  if (
    pageSignals.hasArticle &&
    !detectedTypes.some((t) => /Article|NewsArticle|BlogPosting|Report/i.test(t))
  ) {
    recommendedMissingHints.push({
      type: "Article/NewsArticle",
      reason: "page contains <article> element but no Article schema detected",
    });
  }
  if (
    pageSignals.hasDatePublished &&
    !detectedTypes.some((t) => /Article|NewsArticle|BlogPosting/i.test(t))
  ) {
    recommendedMissingHints.push({
      type: "Article",
      reason:
        "datePublished signal (meta or <time>) found without matching Article schema",
    });
  }
  if (
    pageSignals.hasAuthorByline &&
    !detectedTypes.some((t) => /Article|Person/i.test(t))
  ) {
    recommendedMissingHints.push({
      type: "Article/Person",
      reason: "author byline detected without matching Article/Person schema",
    });
  }
  if (
    (pageSignals.hasPrice ||
      pageSignals.hasAddToCart ||
      pageSignals.hasProductPath) &&
    !detectedTypes.some((t) => /Product/i.test(t))
  ) {
    recommendedMissingHints.push({
      type: "Product",
      reason:
        "product page signals detected (price/add-to-cart/product path) but no Product schema",
    });
  }
  if (
    pageSignals.hasBreadcrumb &&
    !detectedTypes.some((t) => /BreadcrumbList/i.test(t))
  ) {
    recommendedMissingHints.push({
      type: "BreadcrumbList",
      reason:
        "breadcrumb navigation detected without BreadcrumbList schema",
    });
  }
  if (
    data.isHomepage &&
    !detectedTypes.some((t) => /Organization|WebSite/i.test(t))
  ) {
    recommendedMissingHints.push({
      type: "Organization/WebSite",
      reason: "homepage has no Organization or WebSite schema",
    });
  }

  if (data.jsonLd.parseErrors > 0) {
    validationHints.push({
      issue: "invalidJsonLd",
      count: data.jsonLd.parseErrors,
    });
  }

  const requiredByType: Record<string, string[]> = {
    Article: ["headline", "datePublished", "author"],
    NewsArticle: ["headline", "datePublished", "author"],
    BlogPosting: ["headline", "datePublished", "author"],
    Product: ["name", "image", "offers"],
    Organization: ["name", "logo", "url"],
    WebSite: ["name", "url"],
    BreadcrumbList: ["itemListElement"],
  };

  const seenMissing = new Set<string>();
  for (const b of data.jsonLd.blocksSummary) {
    for (const t of b.types) {
      const required = requiredByType[t];
      if (!required) continue;
      const missing = required.filter((r) => b.fields[r] === undefined);
      if (missing.length === 0) continue;
      const key = `${t}:${missing.join(",")}`;
      if (seenMissing.has(key)) continue;
      seenMissing.add(key);
      validationHints.push({ type: t, missingRequiredLikely: missing });
    }
  }

  const titleLower = data.title.toLowerCase().trim();
  const h1Lower = data.h1.toLowerCase().trim();
  for (const b of data.jsonLd.blocksSummary) {
    if (!b.types.some((t) => /Article|NewsArticle|BlogPosting/i.test(t))) {
      continue;
    }
    const headline = b.fields.headline;
    if (typeof headline !== "string" || !headline) continue;
    const headlineLower = headline.toLowerCase().trim();
    const h1Match =
      h1Lower &&
      (h1Lower.includes(headlineLower) || headlineLower.includes(h1Lower));
    const titleMatch =
      titleLower &&
      (titleLower.includes(headlineLower) ||
        headlineLower.includes(titleLower));
    if (!h1Match && !titleMatch) {
      visibleConsistencyHints.push({
        type: b.types[0] ?? "Article",
        issue: "headlineMismatch",
        schemaHeadline: headline,
        h1: data.h1,
        title: data.title,
      });
    }
  }

  type ImageCheckResult = {
    url: string;
    status: number;
    contentType: string;
    finalUrl?: string;
    error?: string;
  };
  let imageCheck:
    | { checkedCount: number; results: ImageCheckResult[] }
    | undefined;

  if (checkImages && data.schemaImages.length > 0) {
    const urls = data.schemaImages.slice(0, MAX_IMAGE_CHECK);
    const results: ImageCheckResult[] = [];
    const userAgent =
      "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";
    for (const u of urls) {
      let resolved = u;
      try {
        resolved = new URL(u, finalUrl).toString();
      } catch {
        results.push({
          url: u,
          status: 0,
          contentType: "",
          error: "invalidUrl",
        });
        continue;
      }
      try {
        const head = await fetch(resolved, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": userAgent },
          signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS),
        });
        results.push({
          url: resolved,
          status: head.status,
          contentType: head.headers.get("content-type") || "",
          finalUrl: head.url || resolved,
        });
      } catch {
        try {
          const getRes = await fetch(resolved, {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": userAgent },
            signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS),
          });
          if (getRes.body) {
            try {
              await getRes.body.cancel();
            } catch {
              /* best effort */
            }
          }
          results.push({
            url: resolved,
            status: getRes.status,
            contentType: getRes.headers.get("content-type") || "",
            finalUrl: getRes.url || resolved,
          });
        } catch (e) {
          results.push({
            url: resolved,
            status: 0,
            contentType: "",
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
    imageCheck = { checkedCount: urls.length, results };
  }

  return {
    url,
    finalUrl,
    status,
    jsonLd: {
      count: data.jsonLd.count,
      parseErrors: data.jsonLd.parseErrors,
      blocksSample: data.jsonLd.blocksSample,
      types: data.jsonLd.types,
      graphTypes: data.jsonLd.graphTypes,
      ids: data.jsonLd.ids,
      contexts: data.jsonLd.contexts,
    },
    microdata: data.microdata,
    rdfa: data.rdfa,
    schemaSummary: {
      detectedTypes,
      recommendedMissingHints,
    },
    validationHints,
    visibleConsistencyHints,
    images: {
      schemaImageUrls: data.schemaImages,
      imageCheck,
    },
  };
}
