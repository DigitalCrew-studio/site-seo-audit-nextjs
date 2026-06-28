import type { BrowserToolContext } from "../types";

/**
 * Render a URL once and return a compact bundle of analytics/marketing tag
 * evidence. Detects a fixed set of common tools (GA4, Universal Analytics,
 * GTM, Yandex Metrica, Meta Pixel, TikTok Pixel, LinkedIn Insight, VK pixel,
 * Hotjar, Microsoft Clarity, Segment), captures dataLayer presence, looks
 * for cookie consent / CMP signals, and flags duplicate tag IDs. All
 * identifier samples are truncated to a safe prefix before being returned
 * to the model. Intended to be called once per page; the renderer is shared.
 */
export async function inspectAnalyticsTags(
  ctx: BrowserToolContext,
  url: string
): Promise<Record<string, unknown>> {
  const MAX_INLINE_TEXT_INSPECTED = 4000;
  const MAX_THIRD_PARTY_HOSTS = 8;
  const MAX_IDENTIFIERS_PER_KIND = 4;
  const MAX_SCRIPTS_SCANNED = 200;
  const MAX_DUPLICATE_SIGNALS = 10;
  const MAX_CONSENT_HITS = 10;
  const DUPLICATE_MIN_COUNT = 2;
  const MANY_MARKETING_PIXELS_THRESHOLD = 3;

  const CONSENT_KEYWORDS = [
    "cookie consent",
    "cookieconsent",
    "cookielaw",
    "cookiebot",
    "cybot",
    "trustarc",
    "truste",
    "didomi",
    "iubenda",
    "termly",
    "usercentrics",
    "axeptio",
    "klaro",
    "consentmanager",
    "onetrust",
    "tcfapi",
    "quantcast",
    "cookiefirst",
    "osano",
    "gdpr",
    "ccpa",
    "consent",
  ];
  const CONSENT_HOST_PARTS = [
    "cookieconsent",
    "cookielaw",
    "cookiebot",
    "cybot",
    "trustarc",
    "truste",
    "didomi",
    "iubenda",
    "termly",
    "usercentrics",
    "axeptio",
    "klaro",
    "consentmanager",
    "onetrust",
    "tcfapi",
    "quantcast",
    "cookiefirst",
    "osano",
  ];

  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  type EvaluateResult = {
    scripts: {
      scriptCount: number;
      inlineScriptCount: number;
      externalScriptCount: number;
      thirdPartyHostCount: number;
      thirdPartyScriptHosts: string[];
      inlineBytesApprox: number;
    };
    detections: Record<string, boolean>;
    identifiers: Record<string, string[]>;
    dataLayerPresent: boolean;
    consentSignals: { detected: boolean; hits: string[] };
    duplicateSignals: { kind: string; id: string; count: number }[];
  };

  const raw = (await page.evaluate(
    (args: {
      MAX_INLINE_TEXT_INSPECTED: number;
      MAX_THIRD_PARTY_HOSTS: number;
      MAX_IDENTIFIERS_PER_KIND: number;
      MAX_SCRIPTS_SCANNED: number;
      MAX_CONSENT_HITS: number;
      MAX_DUPLICATE_SIGNALS: number;
      DUPLICATE_MIN_COUNT: number;
      CONSENT_KEYWORDS: string[];
      CONSENT_HOST_PARTS: string[];
    }): EvaluateResult => {
      const scripts = Array.from(document.querySelectorAll("script"));
      const scriptCount = scripts.length;
      let inlineScriptCount = 0;
      let externalScriptCount = 0;
      const thirdPartyHostSet = new Set<string>();
      const thirdPartyScriptHosts: string[] = [];
      let inlineBytesApprox = 0;

      const detections: Record<string, boolean> = {
        ga4: false,
        universalAnalytics: false,
        gtm: false,
        yandexMetrica: false,
        metaPixel: false,
        tiktokPixel: false,
        linkedinInsight: false,
        vkPixel: false,
        hotjar: false,
        microsoftClarity: false,
        segment: false,
      };
      const identifiers: Record<string, string[]> = {
        ga4: [],
        universalAnalytics: [],
        gtm: [],
        yandexMetrica: [],
        metaPixel: [],
        tiktokPixel: [],
        linkedinInsight: [],
        vkPixel: [],
        hotjar: [],
        microsoftClarity: [],
        segment: [],
      };
      const idKindById = new Map<string, string>();

      let dataLayerPresent = false;
      try {
        const w = window as unknown as { dataLayer?: unknown };
        dataLayerPresent = Array.isArray(w.dataLayer);
      } catch {
        /* window access must never throw */
      }

      const consentHits = new Set<string>();
      const lowerKeywords = args.CONSENT_KEYWORDS.map((k) => k.toLowerCase());

      const pushId = (kind: string, id: string): void => {
        if (!id) return;
        const arr = identifiers[kind];
        if (!arr) return;
        if (arr.length >= args.MAX_IDENTIFIERS_PER_KIND) return;
        if (arr.includes(id)) return;
        arr.push(id);
        if (!idKindById.has(id)) idKindById.set(id, kind);
      };

      const scanText = (text: string): void => {
        const lower = text.toLowerCase();
        for (let i = 0; i < lowerKeywords.length; i += 1) {
          if (lower.includes(lowerKeywords[i])) {
            consentHits.add(args.CONSENT_KEYWORDS[i]);
          }
        }
      };

      const scanHost = (host: string): void => {
        const h = host.toLowerCase();
        for (const part of args.CONSENT_HOST_PARTS) {
          if (h.includes(part)) consentHits.add(part);
        }
      };

      const scanLimit = Math.min(scripts.length, args.MAX_SCRIPTS_SCANNED);
      for (let i = 0; i < scanLimit; i += 1) {
        const s = scripts[i];
        const src = s.getAttribute("src") || "";
        const rawText = s.textContent || "";
        const text = rawText.slice(0, args.MAX_INLINE_TEXT_INSPECTED);

        if (src) {
          externalScriptCount += 1;
          try {
            const u = new URL(src, location.href);
            if (u.hostname && u.hostname !== location.hostname) {
              if (!thirdPartyHostSet.has(u.hostname)) {
                thirdPartyHostSet.add(u.hostname);
                if (thirdPartyScriptHosts.length < args.MAX_THIRD_PARTY_HOSTS) {
                  thirdPartyScriptHosts.push(u.hostname);
                }
              }
            }
            scanHost(u.hostname);
          } catch {
            /* malformed script src is non-fatal */
          }
        } else {
          inlineScriptCount += 1;
          inlineBytesApprox += rawText.length;
        }

        scanText(text);

        if (!detections.gtm) {
          if (/googletagmanager\.com\/gtm\.js/i.test(src)) {
            detections.gtm = true;
            const m = src.match(/[?&]id=(GTM-[A-Z0-9]+)/i);
            if (m && m[1]) pushId("gtm", m[1]);
          } else if (/\bGTM-[A-Z0-9]{4,}/i.test(text)) {
            detections.gtm = true;
            const m = text.match(/GTM-[A-Z0-9]{4,}/);
            if (m && m[0]) pushId("gtm", m[0]);
          }
        }

        if (!detections.ga4) {
          if (
            /googletagmanager\.com\/gtag\/js/i.test(src) &&
            /[?&]id=G-[A-Z0-9]+/i.test(src)
          ) {
            detections.ga4 = true;
            const m = src.match(/[?&]id=(G-[A-Z0-9]+)/i);
            if (m && m[1]) pushId("ga4", m[1]);
          } else if (
            /\bgtag\s*\(\s*['"]config['"]\s*,\s*['"]G-[A-Z0-9]+/i.test(text)
          ) {
            detections.ga4 = true;
            const m = text.match(/['"](G-[A-Z0-9]+)['"]/);
            if (m && m[1]) pushId("ga4", m[1]);
          } else if (/\bG-[A-Z0-9]{6,}/i.test(text)) {
            detections.ga4 = true;
            const m = text.match(/G-[A-Z0-9]{6,}/);
            if (m && m[0]) pushId("ga4", m[0]);
          }
        }

        if (!detections.universalAnalytics) {
          if (/google-analytics\.com\/analytics\.js/i.test(src)) {
            detections.universalAnalytics = true;
          } else if (
            /\bga\s*\(\s*['"]create['"]\s*,\s*['"]UA-\d+-\d+/i.test(text)
          ) {
            detections.universalAnalytics = true;
          } else if (/\bUA-\d{6,12}-\d{1,3}\b/.test(text)) {
            detections.universalAnalytics = true;
          }
          if (detections.universalAnalytics) {
            const m = text.match(/UA-\d{6,12}-\d{1,3}/);
            if (m && m[0]) pushId("universalAnalytics", m[0]);
          }
        }

        if (!detections.yandexMetrica) {
          if (/mc\.yandex\.ru\/metrika/i.test(src)) {
            detections.yandexMetrica = true;
            const m = src.match(/[?&]id=(\d{5,})/);
            if (m && m[1]) pushId("yandexMetrica", m[1]);
          } else if (
            /\bym\s*\(/.test(text) ||
            /Ya\.Metrika/i.test(text) ||
            /\byaCounter\d+/i.test(text)
          ) {
            detections.yandexMetrica = true;
          }
          if (detections.yandexMetrica && identifiers.yandexMetrica.length === 0) {
            const m =
              text.match(/yaCounter(\d+)/i) || text.match(/ym\s*\(\s*['"]?(\d+)/);
            if (m && m[1]) pushId("yandexMetrica", m[1]);
          }
        }

        if (!detections.metaPixel) {
          if (/connect\.facebook\.net\/.*\/fbevents\.js/i.test(src)) {
            detections.metaPixel = true;
          } else if (/\bfbq\s*\(/.test(text)) {
            detections.metaPixel = true;
          }
          if (detections.metaPixel && identifiers.metaPixel.length === 0) {
            const m = text.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/);
            if (m && m[1]) pushId("metaPixel", m[1]);
          }
        }

        if (!detections.tiktokPixel) {
          if (/analytics\.tiktok\.com\/i18n\/pixel/i.test(src)) {
            detections.tiktokPixel = true;
            const m = src.match(/\/pixel\/events\.js\/([^/?#]+)/i);
            if (m && m[1]) pushId("tiktokPixel", m[1]);
          } else if (/\bttq\s*\.\s*(?:load|track|page)\b/.test(text)) {
            detections.tiktokPixel = true;
          }
          if (detections.tiktokPixel && identifiers.tiktokPixel.length === 0) {
            const m = text.match(/ttq\s*\.\s*load\s*\(\s*['"]([A-Z0-9]+)['"]/i);
            if (m && m[1]) pushId("tiktokPixel", m[1]);
          }
        }

        if (!detections.linkedinInsight) {
          if (/snap\.licdn\.com\/li\.lms-analytics/i.test(src)) {
            detections.linkedinInsight = true;
          } else if (
            /\blintrk\s*\(\s*['"]track['"]/.test(text) ||
            /_linkedin_partner_id\b/i.test(text)
          ) {
            detections.linkedinInsight = true;
          }
          if (detections.linkedinInsight && identifiers.linkedinInsight.length === 0) {
            const m = text.match(/_linkedin_partner_id\s*[:=]\s*['"]?(\d+)/);
            if (m && m[1]) pushId("linkedinInsight", m[1]);
          }
        }

        if (!detections.vkPixel) {
          if (/vk\.com\/js\/api\/openapi\.js/i.test(src) || /vk\.com\/rtrg/i.test(src)) {
            detections.vkPixel = true;
          } else if (/\bVK\.Retargeting(?:\.Init)?\s*\(/.test(text)) {
            detections.vkPixel = true;
          }
          if (detections.vkPixel && identifiers.vkPixel.length === 0) {
            const m = text.match(/VK\.Retargeting(?:\.Init)?\s*\(\s*['"]?(\d+)/);
            if (m && m[1]) pushId("vkPixel", m[1]);
          }
        }

        if (!detections.hotjar) {
          if (/static\.hotjar\.com\/c\/hotjar-/i.test(src)) {
            detections.hotjar = true;
            const m = src.match(/hotjar-(\d+)/i);
            if (m && m[1]) pushId("hotjar", m[1]);
          } else if (/\bhj\s*\(\s*['"]identify['"]|hjid\s*:/i.test(text)) {
            detections.hotjar = true;
          }
          if (detections.hotjar && identifiers.hotjar.length === 0) {
            const m = text.match(/hjid\s*[:=]\s*['"]?(\d+)/);
            if (m && m[1]) pushId("hotjar", m[1]);
          }
        }

        if (!detections.microsoftClarity) {
          if (/clarity\.ms\/tag\//i.test(src)) {
            detections.microsoftClarity = true;
            const m = src.match(/\/tag\/([a-z0-9]+)/i);
            if (m && m[1]) pushId("microsoftClarity", m[1]);
          } else if (
            /\bclarity\s*\(\s*['"]set['"]/.test(text) ||
            /\bwindow\.clarity\b/.test(text)
          ) {
            detections.microsoftClarity = true;
          }
          if (detections.microsoftClarity && identifiers.microsoftClarity.length === 0) {
            const m = text.match(
              /clarity\s*\(\s*['"]set['"]\s*,\s*['"]([a-z0-9]+)/i
            );
            if (m && m[1]) pushId("microsoftClarity", m[1]);
          }
        }

        if (!detections.segment) {
          if (
            /cdn\.segment\.com\/analytics\.js/i.test(src) ||
            /cdn\.segment\.com\/snippet\.js/i.test(src)
          ) {
            detections.segment = true;
            const m = src.match(/\/analytics\.js\/v1\/([^/]+)\//);
            if (m && m[1]) pushId("segment", m[1]);
          } else if (/\banalytics\.load\s*\(/.test(text)) {
            detections.segment = true;
          }
          if (detections.segment && identifiers.segment.length === 0) {
            const m = text.match(/analytics\.load\s*\(\s*['"]([A-Za-z0-9]+)['"]/);
            if (m && m[1]) pushId("segment", m[1]);
          }
        }
      }

      const allScriptText = scripts
        .slice(0, scanLimit)
        .map((s) => (s.textContent || "").slice(0, args.MAX_INLINE_TEXT_INSPECTED))
        .join(" ");
      const duplicateCounts = new Map<string, { kind: string; count: number }>();
      const dupPatterns: { kind: string; re: RegExp }[] = [
        { kind: "gtm", re: /GTM-[A-Z0-9]{4,}/g },
        { kind: "ga4", re: /G-[A-Z0-9]{6,}/g },
        { kind: "universalAnalytics", re: /UA-\d{6,12}-\d{1,3}/g },
        { kind: "yandexMetrica", re: /yaCounter(\d+)/gi },
        { kind: "metaPixel", re: /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/g },
      ];
      for (const p of dupPatterns) {
        const matches = allScriptText.match(p.re) || [];
        for (const m of matches) {
          const key = `${p.kind}:${m}`;
          const cur = duplicateCounts.get(key);
          if (cur) {
            cur.count += 1;
          } else {
            duplicateCounts.set(key, { kind: p.kind, count: 1 });
          }
        }
      }
      const duplicateSignals: { kind: string; id: string; count: number }[] = [];
      for (const [key, v] of duplicateCounts) {
        if (v.count < args.DUPLICATE_MIN_COUNT) continue;
        const colon = key.indexOf(":");
        const id = colon >= 0 ? key.slice(colon + 1) : key;
        duplicateSignals.push({ kind: v.kind, id, count: v.count });
      }
      duplicateSignals.sort((a, b) => b.count - a.count);

      return {
        scripts: {
          scriptCount,
          inlineScriptCount,
          externalScriptCount,
          thirdPartyHostCount: thirdPartyHostSet.size,
          thirdPartyScriptHosts,
          inlineBytesApprox,
        },
        detections,
        identifiers,
        dataLayerPresent,
        consentSignals: {
          detected: consentHits.size > 0,
          hits: Array.from(consentHits).slice(0, args.MAX_CONSENT_HITS),
        },
        duplicateSignals: duplicateSignals.slice(0, args.MAX_DUPLICATE_SIGNALS),
      };
    },
    {
      MAX_INLINE_TEXT_INSPECTED,
      MAX_THIRD_PARTY_HOSTS,
      MAX_IDENTIFIERS_PER_KIND,
      MAX_SCRIPTS_SCANNED,
      MAX_CONSENT_HITS,
      MAX_DUPLICATE_SIGNALS,
      DUPLICATE_MIN_COUNT,
      CONSENT_KEYWORDS,
      CONSENT_HOST_PARTS,
    }
  )) as EvaluateResult;

  const redactId = (id: string): string => {
    if (!id) return "";
    if (id.length <= 6) return "***";
    return id.slice(0, 4) + "***";
  };
  const redactedIdentifiers: Record<string, string[]> = {};
  for (const [k, arr] of Object.entries(raw.identifiers)) {
    redactedIdentifiers[k] = (arr || []).map(redactId);
  }
  const redactedDuplicates = (raw.duplicateSignals || []).map((d) => ({
    kind: d.kind,
    id: redactId(d.id),
    count: d.count,
  }));

  const anyTag = Object.values(raw.detections).some(Boolean);
  const marketingPixelCount =
    (raw.detections.metaPixel ? 1 : 0) +
    (raw.detections.tiktokPixel ? 1 : 0) +
    (raw.detections.linkedinInsight ? 1 : 0) +
    (raw.detections.vkPixel ? 1 : 0);
  const warnings: string[] = [];
  if (!anyTag) warnings.push("noAnalyticsDetected");
  if (redactedDuplicates.length > 0) warnings.push("duplicateTags");
  if (marketingPixelCount >= MANY_MARKETING_PIXELS_THRESHOLD) {
    warnings.push("manyMarketingPixels");
  }
  if (anyTag && !raw.consentSignals.detected) {
    warnings.push("consentNotDetected");
  }

  ctx.log?.("debug", "inspect_analytics_tags done", {
    url: finalUrl,
    status,
    anyTag,
    marketingPixelCount,
    duplicateCount: redactedDuplicates.length,
    consentDetected: raw.consentSignals.detected,
  });

  return {
    url,
    finalUrl,
    status,
    scripts: raw.scripts,
    detections: raw.detections,
    identifiers: redactedIdentifiers,
    dataLayerPresent: raw.dataLayerPresent,
    consentSignals: raw.consentSignals,
    duplicateSignals: redactedDuplicates,
    warnings,
  };
}
