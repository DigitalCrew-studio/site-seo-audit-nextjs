import type { BrowserToolContext } from "../types";

/**
 * Render a URL once and return a compact bundle of entity/brand-trust
 * evidence: brand candidates, logo, contact signals, social links,
 * legal/company links, local business signals, schema sameAs, and a
 * few lightweight consistency checks. Intended to support E-E-A-T and
 * "is this a real entity" judgment calls in the final report.
 */
export async function inspectEntityTrust(
  ctx: BrowserToolContext,
  url: string
): Promise<Record<string, unknown>> {
  const MAX_SAMPLE = 8;
  const MAX_FOOTER_CHARS = 1200;
  const MAX_LOGO_CANDIDATES = 6;
  const MAX_BRAND_SAMPLES = 6;
  const MAX_EMAILS = 4;
  const MAX_PHONES = 4;
  const MAX_ADDRESS = 4;
  const MAX_LEGAL = 6;
  const MAX_SOCIAL_PER_NETWORK = 2;
  const MAX_SAMEAS = 12;
  const MAX_OPENING_HOURS = 4;
  const MAX_AREA_SERVED = 4;
  const REDACT_DOMAIN_KEEP = 1;

  const SOCIAL_HOSTS: { key: string; hosts: RegExp[] }[] = [
    {
      key: "linkedin",
      hosts: [/(?:^|\.)linkedin\.com$/i, /(?:^|\.)lnkd\.in$/i],
    },
    {
      key: "youtube",
      hosts: [/(?:^|\.)youtube\.com$/i, /(?:^|\.)youtu\.be$/i],
    },
    {
      key: "instagram",
      hosts: [/(?:^|\.)instagram\.com$/i, /(?:^|\.)instagr\.am$/i],
    },
    {
      key: "facebook",
      hosts: [/(?:^|\.)facebook\.com$/i, /(?:^|\.)fb\.com$/i, /(?:^|\.)fb\.me$/i],
    },
    {
      key: "x",
      hosts: [/(?:^|\.)twitter\.com$/i, /(?:^|\.)x\.com$/i, /(?:^|\.)t\.co$/i],
    },
    {
      key: "telegram",
      hosts: [/(?:^|\.)t\.me$/i, /(?:^|\.)telegram\.me$/i, /(?:^|\.)telegram\.org$/i],
    },
    {
      key: "vk",
      hosts: [/(?:^|\.)vk\.com$/i, /(?:^|\.)vkontakte\.ru$/i],
    },
    {
      key: "github",
      hosts: [/(?:^|\.)github\.com$/i, /(?:^|\.)githubusercontent\.com$/i],
    },
    {
      key: "medium",
      hosts: [/(?:^|\.)medium\.com$/i, /(?:^|\.)substack\.com$/i],
    },
    {
      key: "tiktok",
      hosts: [/(?:^|\.)tiktok\.com$/i, /(?:^|\.)vm\.tiktok\.com$/i],
    },
    {
      key: "pinterest",
      hosts: [/(?:^|\.)pinterest\.com$/i, /(?:^|\.)pin\.it$/i],
    },
    {
      key: "reddit",
      hosts: [/(?:^|\.)reddit\.com$/i, /(?:^|\.)redd\.it$/i],
    },
  ];

  const LEGAL_PATH_RE =
    /\/(terms|terms-of-(?:service|use)|tos|legal|privacy|privacy-policy|cookie|cookies|cookie-policy|imprint|impressum|legal-notice)\b/i;
  const ABOUT_PATH_RE =
    /\/(about|about-us|company|our-(?:company|story|team)|contact|contact-us|get-in-touch|support)\b/i;
  const PRIVATE_PATH_RE =
    /\/(admin|login|signin|sign-?in|sign-?up|signup|account|accounts|user|users|private|internal|checkout|cart|order|orders|wp-admin|wp-login|register|password|backend|dashboard|secret)(?:\/|\?|#|\.|$)/i;
  const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const PHONE_RE = /(?:(?:\+?\d{1,3}[\s.\-]?)?(?:\(?\d{2,4}\)?[\s.\-]?)?\d{3,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4})/g;
  const ADDRESS_HINT_RE =
    /\b(?:suite|ste|floor|fl|unit|building|bldg|street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd|lane|ln\.|drive|dr\.|plaza|str\.|ul\.|ул\.|пр\.|prospect|pr\.|prospekt|пр-?т|naberezhnaya|набережная|пер\.|переулок|dom|д\.)\b/i;

  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  const cap = (s: string, n: number): string =>
    s.length > n ? s.slice(0, n) + "..." : s;

  const redactEmail = (raw: string): string => {
    const at = raw.indexOf("@");
    if (at <= 0) return raw;
    const local = raw.slice(0, at);
    const domain = raw.slice(at + 1);
    const dot = domain.indexOf(".");
    if (dot <= 0) return local.slice(0, 1) + "***@" + domain;
    const tld = domain.slice(dot);
    const head = domain.slice(0, REDACT_DOMAIN_KEEP);
    return `${local.slice(0, 1)}***@${head}***${tld}`;
  };

  const normalizeKey = (s: string): string =>
    s
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s&.+-]/gu, "")
      .trim();

  type EvaluateResult = {
    title: string;
    ogSiteName: string;
    jsonLd: {
      organizationNames: string[];
      organizationLogos: string[];
      websiteName: string;
      sameAs: string[];
      emails: string[];
      phones: string[];
      addresses: string[];
      openingHours: string[];
      areaServed: string[];
    };
    logoCandidates: { src: string; alt: string }[];
    footerText: string;
    bodySampleText: string;
    anchors: { href: string; text: string; isExternal: boolean }[];
  };

  const raw = (await page.evaluate(
    (args: {
      MAX_SAMPLE: number;
      MAX_FOOTER_CHARS: number;
      MAX_LOGO_CANDIDATES: number;
      MAX_BRAND_SAMPLES: number;
      MAX_SAMEAS: number;
      MAX_OPENING_HOURS: number;
      MAX_AREA_SERVED: number;
      LEGAL_PATH_RE_SRC: string;
      ABOUT_PATH_RE_SRC: string;
      EMAIL_RE_SRC: string;
      PHONE_RE_SRC: string;
      ADDRESS_HINT_RE_SRC: string;
    }): EvaluateResult => {
      const loc = window.location;

      const getMeta = (sel: string): string => {
        const el = document.querySelector(sel);
        return el ? el.getAttribute("content") || "" : "";
      };

      const title = document.title || "";
      const ogSiteName = getMeta('meta[property="og:site_name"]');

      const cap = (s: string, n: number): string =>
        s.length > n ? s.slice(0, n) + "..." : s;

      const ldScripts = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      );
      const organizationNames: string[] = [];
      const organizationLogos: string[] = [];
      let websiteName = "";
      const sameAs: string[] = [];
      const emails: string[] = [];
      const phones: string[] = [];
      const addresses: string[] = [];
      const openingHours: string[] = [];
      const areaServed: string[] = [];

      const seenString = (
        arr: string[],
        v: string
      ): boolean => {
        if (!v) return true;
        if (arr.includes(v)) return true;
        if (arr.length >= args.MAX_SAMEAS) return true;
        arr.push(v);
        return false;
      };

      const pushName = (v: unknown): void => {
        if (typeof v !== "string" || !v.trim()) return;
        if (organizationNames.length >= args.MAX_SAMEAS) return;
        const trimmed = v.trim();
        if (!organizationNames.includes(trimmed)) {
          organizationNames.push(trimmed);
        }
      };

      const pushLogo = (v: unknown): void => {
        if (typeof v !== "string" || !v) return;
        if (organizationLogos.length >= args.MAX_SAMEAS) return;
        if (!organizationLogos.includes(v)) organizationLogos.push(v);
      };

      const walk = (node: unknown): void => {
        if (!node) return;
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node !== "object") return;
        const obj = node as Record<string, unknown>;
        const t = obj["@type"];
        const types: string[] = [];
        if (typeof t === "string") types.push(t);
        else if (Array.isArray(t)) {
          for (const x of t) {
            if (typeof x === "string") types.push(x);
          }
        }
        const isOrg =
          types.includes("Organization") ||
          types.includes("LocalBusiness") ||
          types.includes("Corporation") ||
          types.includes("NGO");
        const isWebSite = types.includes("WebSite");

        if (isOrg) {
          pushName(obj["name"]);
          pushName(obj["legalName"]);
          pushName(obj["alternateName"]);
          const logo = obj["logo"];
          if (typeof logo === "string") pushLogo(logo);
          else if (logo && typeof logo === "object") {
            const o = logo as Record<string, unknown>;
            if (typeof o.url === "string") pushLogo(o.url);
          }
          if (Array.isArray(obj["sameAs"])) {
            for (const s of obj["sameAs"]) {
              if (typeof s === "string") seenString(sameAs, s);
            }
          }
          if (Array.isArray(obj["email"])) {
            for (const e of obj["email"]) {
              if (typeof e === "string") seenString(emails, e);
            }
          } else if (typeof obj["email"] === "string") {
            seenString(emails, obj["email"]);
          }
          if (Array.isArray(obj["telephone"])) {
            for (const e of obj["telephone"]) {
              if (typeof e === "string") seenString(phones, e);
            }
          } else if (typeof obj["telephone"] === "string") {
            seenString(phones, obj["telephone"]);
          }
          const addr = obj["address"];
          if (addr && typeof addr === "object") {
            const a = addr as Record<string, unknown>;
            const street = typeof a.streetAddress === "string" ? a.streetAddress : "";
            const locality = typeof a.addressLocality === "string" ? a.addressLocality : "";
            const region = typeof a.addressRegion === "string" ? a.addressRegion : "";
            const postal = typeof a.postalCode === "string" ? a.postalCode : "";
            const country = typeof a.addressCountry === "string" ? a.addressCountry : "";
            const composed = [street, locality, region, postal, country]
              .filter(Boolean)
              .join(", ");
            if (composed) seenString(addresses, composed);
          }
          const oh = obj["openingHours"];
          if (Array.isArray(oh)) {
            for (const h of oh) {
              if (typeof h === "string") seenString(openingHours, h);
            }
          } else if (typeof oh === "string") {
            seenString(openingHours, oh);
          }
          const as = obj["areaServed"];
          if (Array.isArray(as)) {
            for (const a of as) {
              if (typeof a === "string") seenString(areaServed, a);
              else if (a && typeof a === "object") {
                const o = a as Record<string, unknown>;
                if (typeof o.name === "string") seenString(areaServed, o.name);
              }
            }
          } else if (typeof as === "string") {
            seenString(areaServed, as);
          } else if (as && typeof as === "object") {
            const o = as as Record<string, unknown>;
            if (typeof o.name === "string") seenString(areaServed, o.name);
          }
        }

        if (isWebSite) {
          if (typeof obj["name"] === "string" && !websiteName) {
            websiteName = (obj["name"] as string).trim();
          }
          if (Array.isArray(obj["sameAs"])) {
            for (const s of obj["sameAs"]) {
              if (typeof s === "string") seenString(sameAs, s);
            }
          }
        }

        if (Array.isArray(obj["@graph"])) {
          obj["@graph"].forEach(walk);
        }
      };

      for (const s of ldScripts) {
        const text = s.textContent || "";
        if (!text.trim()) continue;
        try {
          walk(JSON.parse(text));
        } catch {
          /* ignore parse errors */
        }
      }

      const logoCandidates: { src: string; alt: string }[] = [];
      const imgs = Array.from(document.querySelectorAll("img"));
      const LOGO_HINT = /(logo|brand|site-?logo|header-?logo|company-?logo)/i;
      const isInHeader =
        (el: Element): boolean => {
          let p: Element | null = el;
          for (let i = 0; i < 4 && p; i += 1) {
            const tag = p.tagName ? p.tagName.toLowerCase() : "";
            if (tag === "header" || tag === "nav") return true;
            const role = p.getAttribute && p.getAttribute("role");
            if (role && /banner|navigation/i.test(role)) return true;
            p = p.parentElement;
          }
          return false;
        };
      for (const img of imgs) {
        if (logoCandidates.length >= args.MAX_LOGO_CANDIDATES) break;
        const src = img.getAttribute("src") || "";
        if (!src) continue;
        const alt = img.getAttribute("alt") || "";
        const cls = (img.getAttribute("class") || "") + " " +
          (img.getAttribute("id") || "");
        const isLogo =
          LOGO_HINT.test(alt) ||
          LOGO_HINT.test(cls) ||
          (isInHeader(img) && (alt.length > 0 || LOGO_HINT.test(src)));
        if (isLogo) {
          logoCandidates.push({ src, alt: alt.slice(0, 200) });
        }
      }
      if (logoCandidates.length === 0) {
        for (const img of imgs) {
          if (logoCandidates.length >= 2) break;
          const src = img.getAttribute("src") || "";
          if (!src) continue;
          const alt = img.getAttribute("alt") || "";
          if (alt && isInHeader(img)) {
            logoCandidates.push({ src, alt: alt.slice(0, 200) });
          }
        }
      }

      const footerEl = document.querySelector("footer");
      const footerText = footerEl
        ? (footerEl.innerText || "").replace(/\s+/g, " ").trim().slice(0, args.MAX_FOOTER_CHARS)
        : "";

      const bodyText = (document.body && document.body.innerText
        ? document.body.innerText
        : "").replace(/\s+/g, " ").trim();
      const bodySampleText = bodyText.slice(0, 4000);

      const anchors: { href: string; text: string; isExternal: boolean }[] = [];
      const seenHrefs = new Set<string>();
      for (const a of Array.from(document.querySelectorAll("a[href]"))) {
        if (anchors.length >= args.MAX_SAMPLE * 6) break;
        const href = a.getAttribute("href") || "";
        if (!href) continue;
        let resolved = "";
        let isExternal = false;
        try {
          const u = new URL(href, loc.href);
          if (u.protocol !== "http:" && u.protocol !== "https:") continue;
          resolved = u.href;
          isExternal = u.hostname !== loc.hostname;
        } catch {
          continue;
        }
        if (seenHrefs.has(resolved)) continue;
        seenHrefs.add(resolved);
        anchors.push({
          href: resolved,
          text: ((a.textContent || "").replace(/\s+/g, " ").trim()).slice(0, 100),
          isExternal,
        });
      }

      return {
        title,
        ogSiteName,
        jsonLd: {
          organizationNames: organizationNames.slice(0, args.MAX_SAMEAS),
          organizationLogos: organizationLogos.slice(0, args.MAX_SAMEAS),
          websiteName: websiteName.slice(0, 200),
          sameAs: sameAs.slice(0, args.MAX_SAMEAS),
          emails: emails.slice(0, args.MAX_SAMEAS),
          phones: phones.slice(0, args.MAX_SAMEAS),
          addresses: addresses.slice(0, args.MAX_SAMEAS),
          openingHours: openingHours.slice(0, args.MAX_OPENING_HOURS),
          areaServed: areaServed.slice(0, args.MAX_AREA_SERVED),
        },
        logoCandidates: logoCandidates.slice(0, args.MAX_LOGO_CANDIDATES),
        footerText,
        bodySampleText,
        anchors,
      };
    },
    {
      MAX_SAMPLE,
      MAX_FOOTER_CHARS,
      MAX_LOGO_CANDIDATES,
      MAX_BRAND_SAMPLES,
      MAX_SAMEAS,
      MAX_OPENING_HOURS,
      MAX_AREA_SERVED,
      LEGAL_PATH_RE_SRC: LEGAL_PATH_RE.source,
      ABOUT_PATH_RE_SRC: ABOUT_PATH_RE.source,
      EMAIL_RE_SRC: EMAIL_RE.source,
      PHONE_RE_SRC: PHONE_RE.source,
      ADDRESS_HINT_RE_SRC: ADDRESS_HINT_RE.source,
    }
  )) as EvaluateResult;

  const finalHost = (() => {
    try {
      return new URL(finalUrl).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const brandCandidatesRaw: { source: string; value: string }[] = [];
  if (raw.title) {
    const cleaned = raw.title
      .replace(/\s+[|·•\-–—:]\s+.*$/g, "")
      .trim();
    brandCandidatesRaw.push({ source: "title", value: cap(cleaned, 200) });
  }
  if (raw.ogSiteName) {
    brandCandidatesRaw.push({ source: "og:site_name", value: cap(raw.ogSiteName, 200) });
  }
  for (const n of raw.jsonLd.organizationNames) {
    brandCandidatesRaw.push({ source: "schema:Organization.name", value: cap(n, 200) });
  }
  if (raw.jsonLd.websiteName) {
    brandCandidatesRaw.push({ source: "schema:WebSite.name", value: cap(raw.jsonLd.websiteName, 200) });
  }
  for (const lc of raw.logoCandidates) {
    if (lc.alt) {
      brandCandidatesRaw.push({ source: "logo.alt", value: cap(lc.alt, 200) });
      break;
    }
  }
  if (raw.footerText) {
    const ftext = raw.footerText;
    const m =
      ftext.match(/(?:©|copyright)\s*(?:\d{2,4}\s*)?([A-Z][A-Za-z0-9\u0400-\u04FF&.+'\- ]{1,80})/i) ||
      ftext.match(/([A-Z][A-Za-z0-9\u0400-\u04FF&.+'\- ]{1,80})\s+(?:all rights reserved|llc|ltd|gmbh|inc|ooo|ооо|ип)\b/i);
    if (m && m[1]) {
      brandCandidatesRaw.push({ source: "footer", value: cap(m[1].trim(), 200) });
    }
  }
  const seenBrand = new Set<string>();
  const brandCandidates: { source: string; value: string }[] = [];
  for (const c of brandCandidatesRaw) {
    const k = `${c.source}::${c.value.toLowerCase()}`;
    if (seenBrand.has(k)) continue;
    seenBrand.add(k);
    brandCandidates.push(c);
    if (brandCandidates.length >= MAX_BRAND_SAMPLES) break;
  }

  const logoCandidates = raw.logoCandidates.slice(0, MAX_LOGO_CANDIDATES).map((l) => ({
    src: l.src,
    alt: cap(l.alt, 200),
  }));
  const schemaLogo = raw.jsonLd.organizationLogos.slice(0, 2);

  const emailSet = new Set<string>();
  const collectEmails = (text: string): void => {
    if (!text) return;
    EMAIL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = EMAIL_RE.exec(text)) !== null) {
      const v = m[0].toLowerCase();
      if (emailSet.size >= MAX_EMAILS * 2) break;
      emailSet.add(v);
    }
  };
  collectEmails(raw.bodySampleText);
  collectEmails(raw.footerText);
  for (const e of raw.jsonLd.emails) {
    emailSet.add(e.toLowerCase());
  }
  const emailsSample = Array.from(emailSet)
    .filter((e) => !/(?:example|yourname|email\.com|domain\.com|test\.com|xxx)/i.test(e))
    .slice(0, MAX_EMAILS)
    .map(redactEmail);

  const phoneSet = new Set<string>();
  const collectPhones = (text: string): void => {
    if (!text) return;
    PHONE_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PHONE_RE.exec(text)) !== null) {
      const v = m[0].trim();
      if (v.replace(/\D/g, "").length < 7) continue;
      if (phoneSet.size >= MAX_PHONES * 2) break;
      phoneSet.add(v);
    }
  };
  collectPhones(raw.bodySampleText);
  collectPhones(raw.footerText);
  for (const p of raw.jsonLd.phones) phoneSet.add(p);
  const phonesSample = Array.from(phoneSet)
    .slice(0, MAX_PHONES)
    .map((p) => p.slice(0, 40));

  const addressSet = new Set<string>();
  for (const a of raw.jsonLd.addresses) addressSet.add(a);
  const collectAddresses = (text: string): void => {
    if (!text) return;
    const lines = text
      .split(/[\n.;]/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 12 && l.length <= 240);
    for (const l of lines) {
      if (ADDRESS_HINT_RE.test(l) && addressSet.size < MAX_ADDRESS * 2) {
        addressSet.add(l);
      }
    }
  };
  collectAddresses(raw.bodySampleText);
  collectAddresses(raw.footerText);
  const addressLikeSample = Array.from(addressSet)
    .slice(0, MAX_ADDRESS)
    .map((a) => cap(a, 200));

  const socialByNetwork: Record<string, { href: string; text: string }[]> = {};
  for (const a of raw.anchors) {
    if (!a.isExternal) continue;
    if (PRIVATE_PATH_RE.test(a.href)) continue;
    let host = "";
    try {
      host = new URL(a.href).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (!host) continue;
    let matched: string | null = null;
    for (const s of SOCIAL_HOSTS) {
      if (s.hosts.some((re) => re.test(host))) {
        matched = s.key;
        break;
      }
    }
    if (!matched) continue;
    const list = socialByNetwork[matched] || [];
    if (list.length >= MAX_SOCIAL_PER_NETWORK) continue;
    list.push({ href: a.href, text: cap(a.text, 80) });
    socialByNetwork[matched] = list;
  }
  const socialLinks: Record<string, { href: string; text: string }[]> = {};
  for (const [k, v] of Object.entries(socialByNetwork)) {
    socialLinks[k] = v.slice(0, MAX_SOCIAL_PER_NETWORK);
  }
  const socialNetworkCount = Object.keys(socialLinks).length;

  const sameAsSample = raw.jsonLd.sameAs.slice(0, MAX_SAMEAS);

  const legalLinkMatches: { href: string; text: string }[] = [];
  const aboutContactLinkMatches: { href: string; text: string }[] = [];
  for (const a of raw.anchors) {
    if (a.isExternal) continue;
    let path = "";
    try {
      path = new URL(a.href).pathname;
    } catch {
      continue;
    }
    if (LEGAL_PATH_RE.test(path)) {
      if (legalLinkMatches.length < MAX_LEGAL) {
        legalLinkMatches.push({ href: a.href, text: cap(a.text, 80) });
      }
    } else if (ABOUT_PATH_RE.test(path)) {
      if (aboutContactLinkMatches.length < MAX_LEGAL) {
        aboutContactLinkMatches.push({ href: a.href, text: cap(a.text, 80) });
      }
    }
  }

  const openingHours = raw.jsonLd.openingHours.slice(0, MAX_OPENING_HOURS);
  const addressSchema = raw.jsonLd.addresses.slice(0, 2);
  const areaServed = raw.jsonLd.areaServed.slice(0, MAX_AREA_SERVED);

  const consistencyHints: { kind: string; detail: string }[] = [];
  const brandValueCounts = new Map<string, { value: string; sources: string[] }>();
  for (const c of brandCandidates) {
    const k = normalizeKey(c.value);
    if (k.length < 3) continue;
    const cur = brandValueCounts.get(k);
    if (cur) {
      cur.sources.push(c.source);
    } else {
      brandValueCounts.set(k, { value: c.value, sources: [c.source] });
    }
  }
  if (brandValueCounts.size > 1) {
    const entries = Array.from(brandValueCounts.values());
    const dominant = entries
      .map((e) => ({ e, weight: e.sources.length }))
      .sort((a, b) => b.weight - a.weight)[0];
    if (dominant) {
      for (const other of entries) {
        if (other.value === dominant.e.value) continue;
        if (
          !normalizeKey(other.value).includes(normalizeKey(dominant.e.value)) &&
          !normalizeKey(dominant.e.value).includes(normalizeKey(other.value))
        ) {
          consistencyHints.push({
            kind: "brandNameMismatch",
            detail: `"${dominant.e.value}" (${dominant.e.sources.join(", ")}) vs "${other.value}" (${other.sources.join(", ")})`,
          });
          break;
        }
      }
    }
  }

  const sameAsHosts = new Set<string>();
  for (const u of sameAsSample) {
    try {
      sameAsHosts.add(new URL(u).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  const socialHosts = new Set<string>();
  for (const list of Object.values(socialLinks)) {
    for (const e of list) {
      try {
        socialHosts.add(new URL(e.href).hostname.toLowerCase());
      } catch {
        /* ignore */
      }
    }
  }
  const schemaHasSocial = Array.from(sameAsHosts).some((h) =>
    SOCIAL_HOSTS.some((s) => s.hosts.some((re) => re.test(h)))
  );
  const pageHasSocial = socialHosts.size > 0;
  if (schemaHasSocial && !pageHasSocial) {
    consistencyHints.push({
      kind: "schemaSocialNoOnpageLinks",
      detail: `schema sameAs lists social hosts (${Array.from(sameAsHosts).filter((h) =>
        SOCIAL_HOSTS.some((s) => s.hosts.some((re) => re.test(h)))
      ).slice(0, 3).join(", ")}) but no on-page social links were found`,
    });
  }
  if (pageHasSocial && !schemaHasSocial && sameAsSample.length > 0) {
    consistencyHints.push({
      kind: "pageSocialNotInSchema",
      detail: `on-page social links (${Array.from(socialHosts).filter((h) =>
        SOCIAL_HOSTS.some((s) => s.hosts.some((re) => re.test(h)))
      ).slice(0, 3).join(", ")}) are not present in schema sameAs`,
    });
  }

  const warnings: string[] = [];
  const hasOrganizationSchema =
    raw.jsonLd.organizationNames.length > 0 || raw.jsonLd.websiteName.length > 0;
  if (!hasOrganizationSchema) warnings.push("noOrganizationSchema");
  const hasContactSignals =
    emailsSample.length > 0 ||
    phonesSample.length > 0 ||
    addressLikeSample.length > 0 ||
    addressSchema.length > 0;
  if (!hasContactSignals) warnings.push("noContactSignals");
  if (socialNetworkCount === 0) warnings.push("noSocialSignals");
  const hasPrivacy =
    legalLinkMatches.some((l) => /privac/i.test(l.href) || /privac/i.test(l.text)) ||
    raw.bodySampleText.toLowerCase().includes("privacy");
  if (!hasPrivacy) warnings.push("missingPrivacyLink");
  if (aboutContactLinkMatches.length === 0) warnings.push("missingAboutContactLink");

  const result: Record<string, unknown> = {
    url,
    finalUrl,
    status,
    finalHost,
    brandCandidates,
    logo: {
      candidates: logoCandidates,
      schemaLogo,
    },
    contact: {
      emailsSample,
      phonesSample,
      addressLikeSample,
      contactPageLinks: aboutContactLinkMatches,
    },
    socialLinks,
    socialNetworkCount,
    schemaSameAs: sameAsSample,
    legalLinks: legalLinkMatches,
    localSignals: {
      openingHours,
      addressSchema,
      areaServed,
    },
    footerTextSample: cap(raw.footerText, 400),
    consistencyHints,
    warnings,
  };

  ctx.log?.("debug", "inspect_entity_trust done", {
    url: finalUrl,
    status,
    brandCandidateCount: brandCandidates.length,
    hasOrganizationSchema,
    hasContactSignals,
    socialNetworkCount,
    warningCount: warnings.length,
  });

  return result;
}
