import type { BrowserToolContext } from "../types";

/**
 * Fetch and analyze a site's /llms.txt file. Accepts either a site origin
 * (in which case the URL is normalized to `{origin}/llms.txt`) or a direct
 * `/llms.txt` URL. The body is read with a timeout and capped to 24k chars
 * before any analysis runs. When the file is reachable and non-empty, the
 * method returns a compact markdown-ish analysis (headings, link breakdown,
 * private-URL leak detection, summary/policy heuristics) suitable for the
 * model context.
 */
export async function inspectLlmsTxt(
  _ctx: BrowserToolContext,
  inputUrl: string
): Promise<Record<string, unknown>> {
  const MAX_CHARS = 24000;
  const MAX_LINKS = 1000;
  const SAMPLE_LINKS = 30;
  const CANONICAL_SAMPLE = 10;
  const EXTERNAL_SAMPLE = 10;
  const PRIVATE_SAMPLE = 10;
  const PRIVATE_PATH_RE =
    /\/(?:admin|administrator|login|signin|sign[_-]?in|sign[_-]?up|signup|account|accounts|user|users|private|internal|checkout|cart|order|orders|wp-admin|wp-login|register|password|backend|dashboard|secret)(?:\/|\?|#|\.|$)/i;
  const POLICY_RE =
    /\b(?:polic(?:y|ies)|terms(?:\s+of\s+(?:service|use))?|privacy|disclosure|acceptable[\s-]?use|ai[\s-]?(?:usage|policy)|llms?\.txt)\b/i;

  const userAgent =
    "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";

  let inputNorm = "";
  try {
    inputNorm = new URL(inputUrl).toString();
  } catch {
    return { inputUrl, error: `Invalid URL: ${inputUrl}` };
  }

  const inputPath = (() => {
    try {
      return new URL(inputNorm).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const isDirectLlmsTxt = /\/llms\.txt(?:[?#].*)?$/i.test(inputPath);

  let llmsUrl = "";
  try {
    llmsUrl = isDirectLlmsTxt
      ? inputNorm
      : new URL("/llms.txt", inputNorm).toString();
  } catch {
    return { inputUrl, error: `Invalid URL: ${inputUrl}` };
  }

  let status = 0;
  let contentType = "";
  let text = "";
  let bytes = 0;
  let fetchError: string | undefined;
  let truncated = false;

  try {
    const response = await fetch(llmsUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/plain,text/markdown,*/*",
      },
      signal: AbortSignal.timeout(12000),
    });
    status = response.status;
    contentType = response.headers.get("content-type") || "";
    if (response.ok) {
      const raw = await response.text();
      if (raw.length > MAX_CHARS) {
        text = raw.slice(0, MAX_CHARS);
        truncated = true;
      } else {
        text = raw;
      }
      bytes = text.length;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  const exists = status >= 200 && status < 300 && text.length > 0;
  const siteHost = (() => {
    try {
      return new URL(llmsUrl).hostname;
    } catch {
      return "";
    }
  })();

  const issues: string[] = [];
  const warnings: string[] = [];

  if (!exists) {
    if (status === 0 || status >= 400) {
      issues.push("missing");
    } else if (status >= 200 && status < 300 && text.length === 0) {
      warnings.push("emptyFile");
    }
  } else {
    if (text.trim().length === 0) {
      warnings.push("emptyFile");
    }
    if (contentType) {
      const ctLower = contentType.toLowerCase();
      if (!/text\/(?:plain|markdown|html)\b|application\/octet-stream/.test(ctLower)) {
        warnings.push("wrongContentType");
      }
    }
    if (truncated) {
      warnings.push("tooLarge");
    }
  }

  let headingCount = 0;
  let firstHeading = "";
  let linkCount = 0;
  let internalLinkCount = 0;
  let externalLinkCount = 0;
  let hasSiteSummary = false;
  let mentionsPolicy = false;
  const sampleLinks: { text: string; href: string }[] = [];
  const canonicalLinksSample: { href: string }[] = [];
  const externalLinksSample: { href: string }[] = [];
  const privateUrlLeaks: { href: string }[] = [];
  const seenSample = new Set<string>();
  const seenCanonical = new Set<string>();
  const seenExternal = new Set<string>();
  const seenPrivate = new Set<string>();

  if (exists) {
    const lines = text.split(/\r?\n/);
    const headSlice = lines.slice(0, 80).join("\n");
    const headLower = headSlice.toLowerCase();
    hasSiteSummary =
      /^#{1,6}\s+\S/m.test(headSlice) &&
      (/^\s*>\s+\S/m.test(headSlice) ||
        /\b(?:is a|provides|is an|offers|is the|summary|overview|about)\b/i.test(
          headLower
        ));
    mentionsPolicy = POLICY_RE.test(text);

    const linkRe = /\[([^\]]*)\]\(([^)\s]+)\)/g;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^#{1,6}\s+\S/.test(trimmed)) {
        headingCount += 1;
        if (!firstHeading) {
          firstHeading = trimmed.replace(/^#+\s+/, "").slice(0, 200);
        }
      }
      let m: RegExpExecArray | null;
      linkRe.lastIndex = 0;
      while ((m = linkRe.exec(line)) !== null) {
        const href = (m[2] || "").trim();
        const linkText = (m[1] || "").slice(0, 100);
        if (!href) continue;
        if (linkCount < MAX_LINKS) linkCount += 1;
        if (sampleLinks.length < SAMPLE_LINKS && !seenSample.has(href)) {
          seenSample.add(href);
          sampleLinks.push({ text: linkText, href });
        }
        let resolved = "";
        try {
          resolved = new URL(href, llmsUrl).toString();
        } catch {
          continue;
        }
        let host = "";
        let path = "";
        try {
          const u = new URL(resolved);
          host = u.hostname;
          path = u.pathname;
        } catch {
          continue;
        }
        if (siteHost && host === siteHost) {
          internalLinkCount += 1;
          if (
            canonicalLinksSample.length < CANONICAL_SAMPLE &&
            !seenCanonical.has(href)
          ) {
            seenCanonical.add(href);
            canonicalLinksSample.push({ href: resolved });
          }
        } else if (host) {
          externalLinkCount += 1;
          if (
            externalLinksSample.length < EXTERNAL_SAMPLE &&
            !seenExternal.has(href)
          ) {
            seenExternal.add(href);
            externalLinksSample.push({ href: resolved });
          }
        }
        if (PRIVATE_PATH_RE.test(path) && !seenPrivate.has(href)) {
          seenPrivate.add(href);
          if (privateUrlLeaks.length < PRIVATE_SAMPLE) {
            privateUrlLeaks.push({ href: resolved });
          }
        }
      }
    }

    if (linkCount === 0) warnings.push("noLinks");
    if (!hasSiteSummary) warnings.push("noSummary");
    if (privateUrlLeaks.length > 0) issues.push("privateUrlsListed");
  }

  const result: Record<string, unknown> = {
    inputUrl,
    llmsUrl,
    status,
    contentType,
    bytes,
    chars: text.length,
    exists,
    truncated,
    headingCount,
    firstHeading,
    linkCount,
    internalLinkCount,
    externalLinkCount,
    sampleLinks,
    canonicalLinksSample,
    externalLinksSample,
    privateUrlLeaks,
    hasSiteSummary,
    mentionsPolicy,
    issues,
    warnings,
  };
  if (fetchError) result.fetchError = fetchError;
  return result;
}
