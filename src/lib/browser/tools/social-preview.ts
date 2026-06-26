import type { BrowserToolContext } from "../types";

export async function inspectSocialPreview(
  ctx: BrowserToolContext,
  url: string,
  checkImages?: boolean
) {
  const MAX_IMAGE_CHECK = 5;
  const MAX_LOCALE_ALTERNATES = 5;
  const IMAGE_FETCH_TIMEOUT_MS = 5000;
  const IMAGE_DECODE_TIMEOUT_MS = 5000;
  const TARGET_WIDTH = 1200;
  const TARGET_HEIGHT = 630;

  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  const data = await page.evaluate(() => {
    const getMeta = (sel: string): string => {
      const el = document.querySelector(sel);
      return el ? el.getAttribute("content") || "" : "";
    };
    const getAll = (sel: string, cap: number): string[] => {
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll(sel))) {
        if (out.length >= cap) break;
        const c = el.getAttribute("content") || "";
        if (c) out.push(c);
      }
      return out;
    };
    return {
      title: document.title || "",
      metaDescription: getMeta('meta[name="description"]'),
      canonical: getMeta('link[rel="canonical"]'),
      htmlLang: document.documentElement.getAttribute("lang") || "",
      og: {
        title: getMeta('meta[property="og:title"]'),
        description: getMeta('meta[property="og:description"]'),
        url: getMeta('meta[property="og:url"]'),
        type: getMeta('meta[property="og:type"]'),
        siteName: getMeta('meta[property="og:site_name"]'),
        image: getMeta('meta[property="og:image"]'),
        imageAlt: getMeta('meta[property="og:image:alt"]'),
        locale: getMeta('meta[property="og:locale"]'),
      },
      localeAlternates: getAll(
        'meta[property="og:locale:alternate"]',
        MAX_LOCALE_ALTERNATES * 2
      ),
      twitter: {
        card: getMeta('meta[name="twitter:card"]'),
        title: getMeta('meta[name="twitter:title"]'),
        description: getMeta('meta[name="twitter:description"]'),
        image: getMeta('meta[name="twitter:image"]'),
        site: getMeta('meta[name="twitter:site"]'),
        creator: getMeta('meta[name="twitter:creator"]'),
      },
    };
  });

  type ImageSource = { url: string; source: string };
  const imageSources: ImageSource[] = [];
  const seen = new Set<string>();
  const addImage = (raw: string, source: string) => {
    if (!raw) return;
    let resolved = "";
    try {
      resolved = new URL(raw, finalUrl).toString();
    } catch {
      return;
    }
    if (seen.has(resolved)) return;
    seen.add(resolved);
    imageSources.push({ url: resolved, source });
  };
  addImage(data.og.image, "og:image");
  addImage(data.twitter.image, "twitter:image");

  type ImageCheck = {
    url: string;
    source: string;
    status: number;
    contentType: string;
    bytes?: number;
    width?: number;
    height?: number;
    issue?: string;
    error?: string;
  };

  let imageChecks: ImageCheck[] | undefined;
  if (checkImages && imageSources.length > 0) {
    const targets = imageSources.slice(0, MAX_IMAGE_CHECK);
    const userAgent =
      "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";

    const headerResults = await Promise.all(
      targets.map(async (t) => {
        const tryHead = async (): Promise<{
          status: number;
          contentType: string;
          bytes?: number;
          error?: string;
        }> => {
          const head = await fetch(t.url, {
            method: "HEAD",
            redirect: "follow",
            headers: { "User-Agent": userAgent },
            signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
          });
          if (head.body) {
            try {
              await head.body.cancel();
            } catch {
              /* best effort */
            }
          }
          const cl = head.headers.get("content-length");
          return {
            status: head.status,
            contentType: head.headers.get("content-type") || "",
            bytes: cl ? Number(cl) : undefined,
          };
        };
        const tryGet = async (): Promise<{
          status: number;
          contentType: string;
          bytes?: number;
          error?: string;
        }> => {
          const get = await fetch(t.url, {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": userAgent },
            signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
          });
          if (get.body) {
            try {
              await get.body.cancel();
            } catch {
              /* best effort */
            }
          }
          const cl = get.headers.get("content-length");
          return {
            status: get.status,
            contentType: get.headers.get("content-type") || "",
            bytes: cl ? Number(cl) : undefined,
          };
        };
        try {
          return await tryHead();
        } catch {
          try {
            return await tryGet();
          } catch (e) {
            return {
              status: 0,
              contentType: "",
              bytes: undefined,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        }
      })
    );

    let dims: Record<string, { width: number; height: number } | null> = {};
    try {
      dims = await page.evaluate(
        async (urls: string[]) => {
          const loadOne = (
            u: string
          ): Promise<{ width: number; height: number } | null> =>
            new Promise((resolve) => {
              const img = new Image();
              const timer = setTimeout(
                () => resolve(null),
                IMAGE_DECODE_TIMEOUT_MS
              );
              img.onload = () => {
                clearTimeout(timer);
                resolve({
                  width: img.naturalWidth || 0,
                  height: img.naturalHeight || 0,
                });
              };
              img.onerror = () => {
                clearTimeout(timer);
                resolve(null);
              };
              img.src = u;
            });
          const entries = await Promise.all(
            urls.map(async (u) => [u, await loadOne(u)] as const)
          );
          return Object.fromEntries(entries);
        },
        targets.map((t) => t.url)
      );
    } catch {
      dims = {};
    }

    imageChecks = targets.map((t, i) => {
      const h = headerResults[i];
      const d = dims[t.url];
      const w = d?.width;
      const hh = d?.height;
      let issue: string | undefined;
      if (
        typeof w === "number" &&
        typeof hh === "number" &&
        w > 0 &&
        hh > 0 &&
        (w < TARGET_WIDTH || hh < TARGET_HEIGHT)
      ) {
        issue = "tinyImage";
      }
      const result: ImageCheck = {
        url: t.url,
        source: t.source,
        status: h.status,
        contentType: h.contentType,
      };
      if (h.bytes !== undefined) result.bytes = h.bytes;
      if (typeof w === "number") result.width = w;
      if (typeof hh === "number") result.height = hh;
      if (issue) result.issue = issue;
      if (h.error) result.error = h.error;
      return result;
    });
  }

  const issues: string[] = [];
  const warnings: string[] = [];

  const requiredOgKeys: (keyof typeof data.og)[] = [
    "title",
    "description",
    "type",
    "url",
    "image",
  ];
  const missingOg = requiredOgKeys.filter((k) => !data.og[k]);
  if (missingOg.length > 0) issues.push("missingRequiredOgFields");

  if (!data.twitter.card) issues.push("missingTwitterCard");

  if (!data.og.image && !data.twitter.image) issues.push("missingImage");

  const isHttpish = (raw: string): boolean => {
    if (!raw) return true;
    try {
      const u = new URL(raw);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };
  if (!isHttpish(data.og.image) || !isHttpish(data.twitter.image)) {
    warnings.push("relativeImageUrl");
  }

  if (data.og.url && data.canonical) {
    try {
      const o = new URL(data.og.url, finalUrl)
        .toString()
        .replace(/\/$/, "");
      const c = new URL(data.canonical, finalUrl)
        .toString()
        .replace(/\/$/, "");
      if (o !== c) issues.push("ogUrlCanonicalMismatch");
    } catch {
      /* ignore URL parse errors */
    }
  }

  if (imageChecks && imageChecks.some((c) => c.issue === "tinyImage")) {
    warnings.push("tinyImage");
  }

  if (data.htmlLang && data.og.locale) {
    const html = data.htmlLang.toLowerCase().split("-")[0];
    const og = data.og.locale.toLowerCase().split(/[_-]/)[0];
    if (html && og && html !== og) warnings.push("localizedMismatch");
  }

  return {
    url,
    finalUrl,
    status,
    title: data.title,
    metaDescription: data.metaDescription,
    canonical: data.canonical,
    htmlLang: data.htmlLang,
    openGraph: {
      title: data.og.title,
      description: data.og.description,
      url: data.og.url,
      type: data.og.type,
      siteName: data.og.siteName,
      image: data.og.image,
      imageAlt: data.og.imageAlt,
      locale: data.og.locale,
      localeAlternates: data.localeAlternates.slice(0, MAX_LOCALE_ALTERNATES),
    },
    twitter: data.twitter,
    imageChecks,
    issues,
    warnings,
  };
}
