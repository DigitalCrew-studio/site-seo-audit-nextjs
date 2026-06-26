import type OpenAI from "openai";

/**
 * Function-calling tools exposed to the model during an audit. Each maps to a
 * BrowserSession method in `src/lib/audit.ts`.
 */
export const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "take_screenshot",
      description:
        "Take a viewport screenshot of the currently loaded page or a given URL and return it as a base64 JPEG. Use sparingly for visual/layout checks.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_page_seo",
      description:
        "Load a URL in a headless Chromium browser and return a compact bundle of SEO evidence from a single render: status, finalUrl, responseTime, title/description (with length), canonical, robots meta and x-robots-tag header, htmlLang/charset/viewport, headings (h1s, h1/h2/h3 counts and samples), word count of visible body text, image alt coverage, internal/external/nofollow link counts with samples, JSON-LD structured data (count, types, parse errors), Open Graph + Twitter Card meta, hreflang (count, x-default, sample), and analytics tag detection (GTM, GA4, Yandex Metrica).",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_http",
      description:
        "Trace the HTTP behavior of a URL with manual redirect handling: follow up to maxRedirects hops (default 10), collect per-hop status, Location, Content-Type, x-robots-tag and Link rel=canonical, and report final URL/status, redirect count, response headers (content-type, content-encoding, cache-control, server, HSTS, x-robots-tag, link, vary, cf-cache-status), inferred compression (gzip/br/deflate/none), security header presence (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), and issues/warnings (httpNotHttps, tooManyRedirects, redirectLoop, finalNotOk, noCompressionForText, noHstsOnHttps). Use this to verify redirect chains, HTTPS enforcement, and security header posture without rendering JavaScript.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          maxRedirects: { type: "number", description: "Maximum redirect hops to follow (default 10, max 20)." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "parse_sitemap",
      description:
        "Parse a sitemap (urlset or sitemap index) and return compact SEO evidence. Accepts a site URL, robots.txt URL, sitemap URL, or sitemap index URL. Discovers sitemap URLs from robots.txt when given a site URL (with /sitemap.xml fallback). Supports sitemap indexes by fetching up to 10 child sitemaps. Returns totalUrls, sampledUrls, lastmodStats { withLastmod, withoutLastmod, newest, oldest }, hreflangAlternates (xhtml:link count/sample), suspiciousUrls sample (private/admin/account/login/checkout, parameter URLs, non-HTTPS), and optionally a status check of up to 20 sampled URLs when checkSample is true.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          maxUrls: { type: "number", description: "Maximum number of URLs to parse (default 200, hard cap 1000)." },
          checkSample: { type: "boolean", description: "If true, perform a HEAD/GET status check on up to 20 sampled URLs." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_structured_data",
      description:
        "Load a URL in a headless Chromium browser and return a compact bundle of structured-data evidence from a single render. Returns JSON-LD (count, types, graphTypes, ids, contexts, parseErrors, truncated blocksSample up to 2 entries), microdata (itemScopeCount, itemTypes sample, itemProps sample), RDFa/basic (typeof/property/vocab counts and small samples), schemaSummary (detectedTypes + recommendedMissingHints derived from obvious page signals such as <article>, datePublished meta/time, author byline, price/add-to-cart/product path, breadcrumb nav, and homepage Organization/WebSite), validationHints (invalidJsonLd count and missingRequiredLikely fields for common types: Article headline/datePublished/author, Product name/image/offers, Organization name/logo/url, WebSite name/url, BreadcrumbList itemListElement), visibleConsistencyHints (lightweight comparison of schema headline vs <h1>/<title>), and image info (schemaImageUrls sample; if checkImages is true, status and contentType for up to 10 image URLs).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          checkImages: { type: "boolean", description: "If true, perform a HEAD/GET status and content-type check on up to 10 schema image URLs." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_social_preview",
      description:
        "Load a URL in a headless Chromium browser and return a compact bundle of social-share preview evidence from a single render: status/finalUrl, title and meta description (for comparison with social tags), canonical, htmlLang, Open Graph meta (title, description, url, type, siteName, image, imageAlt, locale, localeAlternates sample), Twitter Card meta (card, title, description, image, site, creator), optional imageChecks for up to 5 unique og:image / twitter:image URLs (status, contentType, content-length bytes, width/height via in-browser Image decode, tinyImage issue when smaller than the 1200x630 target), and issues/warnings (missingRequiredOgFields, ogUrlCanonicalMismatch, missingTwitterCard, missingImage, relativeImageUrl, tinyImage, localizedMismatch when html lang obviously differs from og:locale).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          checkImages: { type: "boolean", description: "If true, perform a HEAD/GET status and content-type check plus in-browser Image decode for up to 5 unique og:image / twitter:image URLs." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_hreflang",
      description:
        "Load a URL in a headless Chromium browser and inspect hreflang/canonical signals from a single render. Returns the source { url, finalUrl, status, htmlLang, canonical }, the alternates bundle { count, xDefault, selfReference, duplicateLangs, invalidLangs (simple BCP47 regex), sample }, an alternateChecks array for up to 20 hreflang URLs (each: hreflang, href, status, finalUrl, redirects, indexable-ish from status, error), an optional reciprocalCheck that fetches up to 8 alternate pages and reports whether they link back to the source finalUrl or normalized canonical (reciprocalMissing sample), and issues/warnings (missingSelfReference, missingXDefault, duplicateHreflang, invalidHreflang, alternateNon200, alternateRedirects, reciprocalMissing).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          checkReciprocal: { type: "boolean", description: "If true, fetch up to 8 alternate pages and verify that each links back to the source finalUrl or normalized canonical." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resource_inventory",
      description:
        "Load a URL in a headless Chromium browser with request/response/console listeners and performance entries, then return a compact performance/resource inventory from a single render: url/finalUrl/status/responseTime, requestCount/failedRequestCount/statusBuckets (2xx/3xx/4xx/5xx/other), totalTransferBytes/encodedBodyBytes/decodedBodyBytes (from performance entries when available), byType summary for document/script/stylesheet/image/font/fetch/xhr/media/other with count and transferBytes, top largestResources sample (capped 10) with url/type/transferBytes/encodedBodySize/duration/initiatorType, thirdPartyHosts { count, sample } (anything not matching finalUrl host), per-type totals for js/css/images/fonts (fileCount, totalBytes), consoleErrors sample (capped 10) and pageErrors sample (capped 5), renderBlockingCandidates (CSS and early scripts, capped), compression summary from response headers (gzip/br/deflate/none counts), and warnings (manyRequests, heavyPage, manyThirdParties, consoleErrors, failedRequests).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          waitMs: { type: "number", description: "Optional extra wait in milliseconds after load to capture late resources (default 0, max 5000)." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_lighthouse",
      description:
        "Run a Lighthouse lab audit against a URL using a fresh headless Chrome instance (Playwright Chromium or system Chrome via chrome-launcher) and return compact evidence. Returns url/finalUrl/formFactor/requestedFormFactor/configPreset/fetchTime, category scores for performance/accessibility/best-practices/seo (0-1 or null), core Web Vitals metrics (first-contentful-paint, largest-contentful-paint, total-blocking-time, cumulative-layout-shift, speed-index, interactive with displayValue/score/numericValue when available), a sample of up to 8 opportunities (id, title, displayValue, score, numericValue), a sample of up to 8 diagnostics, and errors if the run could not be completed (e.g. Chrome not found, navigation failure, runtime error). The `formFactor` parameter selects the Lighthouse preset: 'mobile' (default) or 'desktop' (uses lighthouseModule.desktopConfig when available, with an explicit desktop settings fallback so the run is still a real desktop audit). Mobile and desktop runs may be requested separately to compare. The deterministic preflight already includes both form factors. NOTE: This tool is slow (typically 30-90s per run) and uses its own Chrome instance.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          formFactor: {
            type: "string",
            enum: ["mobile", "desktop"],
            description: "Optional Lighthouse form factor preset (default 'mobile'). Use 'desktop' for a desktop-shaped audit.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_link_health",
      description:
        "Render a source URL once, extract every <a href> link with its anchor text and rel, normalize/resolve URLs, classify same-host internal vs external, de-dupe by URL, and run a parallel HEAD→GET status check (with redirect follow) on up to 50 unique internal links (hard cap 150) using a ~5s per-URL budget and a small concurrency cap. By default only internal links are checked; when includeExternal is true, a small sample of external links is also checked. Returns compact evidence: source { url, finalUrl, status }, discovered { totalAnchors, uniqueInternal, uniqueExternal, nofollowCount, externalNofollowCount, emptyAnchorCount }, checkedCount + internalCheckedCount + externalCheckedCount, statusBuckets { 2xx, 3xx, 4xx, 5xx, errors }, brokenLinks sample (capped), redirectedLinks sample (capped), nonCanonicalLike sample when finalUrl differs materially from the target URL (capped), externalSample, anchorSamples (up to 30 internal anchor previews), and issues/warnings (brokenInternalLinks, internalRedirects, emptyAnchors, manyExternalNofollow). No response bodies are downloaded.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          maxLinks: {
            type: "number",
            description:
              "Maximum number of unique internal links to status-check (default 50, hard cap 150).",
          },
          includeExternal: {
            type: "boolean",
            description:
              "If true, also include a small sample of external links in the status check (default false).",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "crawl_site_sample",
      description:
        "Same-host BFS crawl from a start URL using the existing headless Chromium page (sequential, no new contexts). Default maxPages is 20 (hard cap 50). Skips static-asset URLs, mailto/tel/javascript links, and hash-only duplicates. For each visited page returns a compact summary (url, finalUrl, status, title, metaDescription presence + length, canonical, robotsMeta, h1Count + h1Sample, wordCount, internalLinkCount, outgoingSample, jsonLdTypes) and aggregates visitedCount, queuedCount, skippedStaticCount, statusBuckets, duplicateTitles/duplicateMetaDescriptions/missingTitle/missingMetaDescription/missingH1/noindex/canonicalToOther samples, and crawlErrors. Output is intentionally compact. Use once per audit to get a quick coverage snapshot of the site.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          maxPages: {
            type: "number",
            description: "Maximum pages to visit (default 20, hard cap 50).",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_analytics_tags",
      description:
        "Load a URL in a headless Chromium browser and return a compact bundle of analytics/marketing tag evidence from a single render. Returns url/finalUrl/status, scripts summary (scriptCount, inlineScriptCount, externalScriptCount, thirdPartyScriptHosts sample), detection booleans + redacted identifier samples for GA4, Universal Analytics (UA), Google Tag Manager, Yandex Metrica, Meta Pixel, TikTok Pixel, LinkedIn Insight, VK pixel, Hotjar, Microsoft Clarity, and Segment, plus dataLayerPresent, consentSignals (cookie consent / CMP keywords or script hosts), duplicateSignals (same tag IDs repeated), and warnings (noAnalyticsDetected, duplicateTags, manyMarketingPixels, consentNotDetected if tags present but no consent keywords). Identifiers are truncated/redacted to a safe prefix (e.g. G-XXXX, GTM-XXXX).",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_mobile_rendering",
      description:
        "Load a URL in a temporary mobile-emulated Chromium context (default 390x844 viewport, deviceScaleFactor 2, isMobile, hasTouch, iPhone-style user agent) and return a compact bundle of mobile-friendliness evidence from a single render. Returns url/finalUrl/status/responseTime/viewport, viewport meta content, horizontalOverflow boolean with overflowAmountPx, documentElement/body/clientWidths, contentHeight, readableFontIssues sample (text elements with computed font-size < 12px, capped), tapTargetIssues sample (interactive controls smaller than 48x48 CSS px, capped), h1 sample and h1AboveFold boolean, primaryNavVisible guess, firstScreenText sample (visible text intersecting the first viewport), aboveFoldLinks count, and issues/warnings (missingViewportMeta, horizontalOverflow, smallReadableFonts, smallTapTargets, h1NotAboveFold, primaryNavMissing). When includeScreenshot is true, also captures a JPEG screenshot which is streamed to the client and omitted from model context. Kept for compatibility — prefer inspect_responsive_rendering for full cross-device coverage.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          width: { type: "number", description: "Optional mobile viewport width override in CSS px (default 390)." },
          height: { type: "number", description: "Optional mobile viewport height override in CSS px (default 844)." },
          includeScreenshot: { type: "boolean", description: "If true, also capture a mobile screenshot and stream it to the client (omitted from model context)." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_responsive_rendering",
      description:
        "Render a URL in a sequence of viewport profiles (default: desktop 1440x900, laptop 1366x768, tablet 768x1024, mobile 390x844 — each with its own user agent, deviceScaleFactor, isMobile and hasTouch) and return a compact per-profile bundle plus a cross-profile summary. For each profile: status/finalUrl/responseTime/viewport/userAgent, viewport meta content, horizontalOverflow boolean with overflowAmountPx, documentElement/body clientWidths, contentHeight, readableFontIssues sample (text elements with computed font-size < 12px, capped), tapTargetIssues sample (interactive controls smaller than 48x48 CSS px, capped), h1 sample + h1AboveFold, primaryNavVisible guess, firstScreenText sample, aboveFoldLinks count, and per-profile issues/warnings. Returns a summary with profilesWithOverflow, profilesWithSmallText, profilesWithTapIssues, profilesWithH1BelowFold, profilesWithoutPrimaryNav. When includeScreenshots is true, captures one JPEG per profile; screenshots are streamed to the client and omitted from model context. Use this to assess how a single page adapts across desktop, laptop, tablet and mobile in a single tool call.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          profiles: {
            type: "array",
            items: {
              type: "string",
              enum: ["desktop", "laptop", "tablet", "mobile"],
            },
            description:
              "Optional subset of viewport profiles to render, in the given order. Defaults to all four (desktop, laptop, tablet, mobile).",
          },
          includeScreenshots: {
            type: "boolean",
            description:
              "If true, capture a JPEG screenshot per profile and stream it to the client (omitted from model context).",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_llms_txt",
      description:
        "Fetch and analyze a site's /llms.txt file. Accepts either a site origin (normalizes to {origin}/llms.txt) or a direct /llms.txt URL. Fetches with a timeout, caps the body to 24000 chars, and returns inputUrl/llmsUrl/status/contentType/bytes/chars/exists. When present, performs a markdown-ish analysis: headingCount, firstHeading, linkCount, sampleLinks, hasSiteSummary heuristic, mentionsPolicy heuristic, privateUrlLeaks sample (admin/login/account/checkout/private and similar), canonicalLinksSample (same-origin sample), externalLinksSample, and internalLinkCount/externalLinkCount. Issues/warnings include missing, wrongContentType, emptyFile, tooLarge, privateUrlsListed, noLinks, noSummary.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_entity_trust",
      description:
        "Load a URL in a headless Chromium browser and return a compact bundle of entity/brand-trust evidence from a single render. Returns url/finalUrl/status, brandCandidates (title, og:site_name, Organization/WebSite schema name, logo alt, footer text sample), logo (img src/alt candidates, schema logo), contact (emails sample lightly redacted, phones sample, addressLike sample, contactPageLinks sample), socialLinks (LinkedIn, YouTube, Instagram, Facebook, X/Twitter, Telegram, VK, GitHub, Medium, TikTok, Pinterest, Reddit samples), schemaSameAs sample, legal/company links (terms/privacy/legal/about/contact samples), localSignals (openingHours text/schema sample, address schema sample, areaServed schema sample), consistencyHints (brand-name mismatches across candidates, sameAs/social mismatch), and warnings (noOrganizationSchema, noContactSignals, noSocialSignals, missingPrivacyLink, missingAboutContactLink).",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dns_and_security_check",
      description:
        "Inspect a site's DNS posture and HTTP security headers using Node built-ins (no new dependencies). Returns inputUrl/hostname/origin; DNS samples (A/AAAA/CNAME/NS/MX/TXT counts + small samples, with long TXT values redacted to ~200 chars); email auth summary (SPF and DMARC existence + record sample, mxExists boolean); httpSecurity from a single redirected GET on the origin (finalUrl, status, strict-transport-security, content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy); https/hsts booleans; warnings (noMx, noSpf, noDmarc, noHstsOnHttps, missingSecurityHeaders); and dnsErrors for any failed lookups. All DNS queries are parallel with timeouts and never throw.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "batch_check_urls",
      description:
        "Check a batch of URLs for migration/launch QA without rendering JavaScript. Performs HEAD with GET fallback, follows redirects, and returns compact evidence: checked/truncated counts, status buckets, redirect samples, broken/error samples, final URL mismatch samples, content-type samples, and warnings. Use for submitted URL lists, redirects, sitemap samples, or migrated URLs.",
      parameters: {
        type: "object",
        properties: {
          urls: {
            type: "array",
            items: { type: "string" },
            description: "URLs to check. Hard capped server-side.",
          },
          maxUrls: { type: "number", description: "Optional cap, default 50, hard cap 150." },
        },
        required: ["urls"],
      },
    },
  },
];
