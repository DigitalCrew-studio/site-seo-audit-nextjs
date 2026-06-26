import type { BrowserToolContext } from "../types";

export async function inspectHttp(
  _ctx: BrowserToolContext,
  inputUrl: string,
  maxRedirects?: number
) {
  const cap = Math.max(1, Math.min(20, Number(maxRedirects) || 10));
  const userAgent =
    "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";

  let normalizedUrl = "";
  try {
    normalizedUrl = new URL(inputUrl).toString();
  } catch {
    return { inputUrl, error: `Invalid URL: ${inputUrl}` };
  }

  type ChainEntry = {
    url: string;
    status: number;
    location: string;
    contentType: string;
    xRobotsTag: string;
    canonicalHeader: string;
  };
  const chain: ChainEntry[] = [];

  const visited = new Set<string>();
  let current = normalizedUrl;
  let redirectCount = 0;
  let tooManyRedirects = false;
  let redirectLoop = false;
  let requestError: string | undefined;
  let finalResponse: Response | null = null;
  let finalUrlFromResponse = "";
  let finalStatusFromResponse = 0;

  for (let i = 0; i < cap; i += 1) {
    if (visited.has(current)) {
      redirectLoop = true;
      break;
    }
    visited.add(current);

    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": userAgent, Accept: "*/*" },
        signal: AbortSignal.timeout(12000),
      });
    } catch (err) {
      requestError = err instanceof Error ? err.message : String(err);
      break;
    }

    const headers = response.headers;
    const headerValue = (name: string): string => {
      const lower = name.toLowerCase();
      for (const key of headers.keys()) {
        if (key.toLowerCase() === lower) {
          return headers.get(key) || "";
        }
      }
      return "";
    };

    const status = response.status;
    const location = headerValue("location");
    const contentType = headerValue("content-type");
    const xRobotsTag = headerValue("x-robots-tag");
    const linkHeader = headerValue("link");
    let canonicalHeader = "";
    if (linkHeader) {
      const m = linkHeader.match(
        /<([^>]+)>\s*;\s*[^;]*rel\s*=\s*["']?canonical["']?/i
      );
      if (m && m[1]) canonicalHeader = m[1];
    }
    chain.push({
      url: current,
      status,
      location,
      contentType,
      xRobotsTag,
      canonicalHeader,
    });

    if (response.body) {
      try {
        await response.body.cancel();
      } catch {
        // Body drain is best-effort; do not fail the inspection on cancel errors.
      }
    }

    const isRedirect = status >= 300 && status < 400 && Boolean(location);
    if (isRedirect) {
      if (i >= cap - 1) {
        tooManyRedirects = true;
        break;
      }
      let nextUrl: URL;
      try {
        nextUrl = new URL(location, current);
      } catch {
        break;
      }
      current = nextUrl.toString();
      redirectCount += 1;
      continue;
    }

    finalResponse = response;
    finalUrlFromResponse = response.url || current;
    finalStatusFromResponse = response.status;
    break;
  }

  let finalUrl = current;
  let finalStatus = 0;
  if (chain.length > 0) {
    const last = chain[chain.length - 1];
    finalUrl = last.url;
    finalStatus = last.status;
  }
  if (finalResponse) {
    finalUrl = finalUrlFromResponse || finalUrl;
    finalStatus = finalStatusFromResponse || finalStatus;
  }

  const headerValue = (name: string): string => {
    if (!finalResponse) return "";
    const headers = finalResponse.headers;
    const lower = name.toLowerCase();
    for (const key of headers.keys()) {
      if (key.toLowerCase() === lower) {
        return headers.get(key) || "";
      }
    }
    return "";
  };

  const contentTypeHeader = headerValue("content-type");
  const contentEncoding = headerValue("content-encoding");
  const cacheControl = headerValue("cache-control");
  const server = headerValue("server");
  const strictTransportSecurity = headerValue("strict-transport-security");
  const xRobotsTag = headerValue("x-robots-tag");
  const link = headerValue("link");
  const vary = headerValue("vary");
  const cfCacheStatus = headerValue("cf-cache-status");
  const contentSecurityPolicy = headerValue("content-security-policy");
  const xFrameOptions = headerValue("x-frame-options");
  const xContentTypeOptions = headerValue("x-content-type-options");
  const referrerPolicy = headerValue("referrer-policy");
  const permissionsPolicy = headerValue("permissions-policy");

  const enc = contentEncoding.toLowerCase().split(",")[0].trim();
  let compression: "gzip" | "br" | "deflate" | "none" = "none";
  if (enc === "gzip") compression = "gzip";
  else if (enc === "br") compression = "br";
  else if (enc === "deflate") compression = "deflate";

  const securityHeaders = {
    hsts: Boolean(strictTransportSecurity),
    contentSecurityPolicy: Boolean(contentSecurityPolicy),
    xFrameOptions: Boolean(xFrameOptions),
    xContentTypeOptions: Boolean(xContentTypeOptions),
    referrerPolicy: Boolean(referrerPolicy),
    permissionsPolicy: Boolean(permissionsPolicy),
  };

  let https = false;
  let host = "";
  let protocol = "";
  try {
    const u = new URL(finalUrl);
    https = u.protocol === "https:";
    host = u.hostname;
    protocol = u.protocol.replace(/:$/, "");
  } catch {
    // URL parsing failure is non-fatal; emit empty host/protocol.
  }

  const issues: string[] = [];
  const warnings: string[] = [];
  if (requestError) issues.push("requestError");
  if (!https) issues.push("httpNotHttps");
  if (tooManyRedirects) issues.push("tooManyRedirects");
  if (redirectLoop) issues.push("redirectLoop");
  if (finalStatus >= 400) issues.push("finalNotOk");
  if (https && !securityHeaders.hsts) warnings.push("noHstsOnHttps");
  if (!contentEncoding && /^text\//i.test(contentTypeHeader)) {
    warnings.push("noCompressionForText");
  }

  return {
    inputUrl,
    normalizedUrl,
    chain,
    finalUrl,
    finalStatus,
    redirectCount,
    redirected: redirectCount > 0,
    https,
    host,
    protocol,
    headers: {
      contentType: contentTypeHeader,
      contentEncoding,
      cacheControl,
      server,
      strictTransportSecurity,
      xRobotsTag,
      link,
      vary,
      cfCacheStatus,
    },
    compression,
    securityHeaders,
    issues,
    warnings,
  };
}
