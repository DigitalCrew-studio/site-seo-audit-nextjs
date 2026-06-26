import { MAX_TEXT_LENGTH, MAX_HTML_LENGTH, truncate } from "../utils";
import type { BrowserToolContext } from "../types";

export async function visit(ctx: BrowserToolContext, url: string) {
  const start = Date.now();
  const response = await ctx.goto(url);
  const page = ctx.getPage();
  const responseTime = Date.now() - start;
  const status = response?.status() ?? 0;
  const finalUrl = page.url();

  const title = await page.title().catch(() => "");
  const metaDescription = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute("content") || "")
    .catch(() => "");
  const canonical = await page
    .$eval('link[rel="canonical"]', (el) => el.getAttribute("href") || "")
    .catch(() => "");
  const robots = await page
    .$eval('meta[name="robots"]', (el) => el.getAttribute("content") || "")
    .catch(() => "");
  const h1s = await page
    .$$eval("h1", (els) => els.map((e) => e.innerText.trim()))
    .catch(() => []);

  return {
    url,
    finalUrl,
    status,
    responseTime,
    title,
    metaDescription,
    canonical,
    robots,
    h1s,
  };
}

export async function getRenderedText(
  ctx: BrowserToolContext,
  url?: string
) {
  const page = ctx.getPage();
  if (url) await ctx.goto(url);
  const bodyText = await page
    .$eval("body", (el) => el.innerText)
    .catch(() => "");
  return { text: truncate(bodyText, MAX_TEXT_LENGTH) };
}

export async function getRenderedHtml(
  ctx: BrowserToolContext,
  url?: string
) {
  const page = ctx.getPage();
  if (url) await ctx.goto(url);
  const html = await page.content().catch(() => "");
  return { html: truncate(html, MAX_HTML_LENGTH) };
}

export async function fetchRawHtml(_ctx: BrowserToolContext, url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  const html = await response.text();
  return {
    url,
    status: response.status,
    finalUrl: response.url,
    html: truncate(html, MAX_HTML_LENGTH),
  };
}

export async function takeScreenshot(
  ctx: BrowserToolContext,
  url?: string
) {
  const page = ctx.getPage();
  if (url) await ctx.goto(url);
  const buffer = await page.screenshot({
    type: "jpeg",
    quality: 75,
    fullPage: false,
  });
  return {
    base64: buffer.toString("base64"),
    mimeType: "image/jpeg",
    bytes: buffer.byteLength,
  };
}

export async function internalLinks(
  ctx: BrowserToolContext,
  url: string
) {
  const page = ctx.getPage();
  await ctx.goto(url);
  const links = await page.$$eval("a[href]", (els, pageHost) => {
    return els
      .map((a) => {
        try {
          return new URL(a.getAttribute("href") || "", pageHost).href;
        } catch {
          return "";
        }
      })
      .filter(Boolean);
  }, url);
  const pageUrl = new URL(url);
  const internal = Array.from(
    new Set(
      links.filter((link) => {
        try {
          return new URL(link).hostname === pageUrl.hostname;
        } catch {
          return false;
        }
      })
    )
  );
  return {
    total: links.length,
    uniqueInternal: internal.length,
    sample: internal.slice(0, 30),
  };
}
