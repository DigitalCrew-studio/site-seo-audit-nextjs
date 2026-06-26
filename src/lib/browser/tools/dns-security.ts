import dns from "node:dns/promises";
import type { BrowserToolContext } from "../types";

/**
 * Inspect DNS posture and HTTP security headers for a site. Uses Node's
 * built-in `dns/promises` resolver and a single origin `fetch` — no new
 * dependencies. All DNS queries are issued in parallel with timeouts and
 * never throw; failures are captured as `dnsErrors` and per-record errors
 * on the affected bucket. Returns compact evidence suitable for model
 * context (counts + small samples + redacted/trimmed TXT).
 */
export async function dnsAndSecurityCheck(
  ctx: BrowserToolContext,
  inputUrl: string
): Promise<Record<string, unknown>> {
  const DNS_TIMEOUT_MS = 3500;
  const FETCH_TIMEOUT_MS = 10000;
  const TXT_MAX_LEN = 200;
  const TXT_SAMPLE = 2;
  const ADDR_SAMPLE = 2;
  const userAgent =
    "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com)";

  const result: Record<string, unknown> = {
    inputUrl,
    hostname: "",
    origin: "",
  };

  let hostname = "";
  let origin = "";
  try {
    const u = new URL(inputUrl);
    hostname = u.hostname;
    origin = u.origin;
  } catch {
    result.error = `Invalid URL: ${inputUrl}`;
    return result;
  }
  if (!hostname) {
    result.error = `Invalid URL (no hostname): ${inputUrl}`;
    return result;
  }
  result.hostname = hostname;
  result.origin = origin;

  const dnsErrors: { query: string; code?: string; error: string }[] = [];
  const warnings: string[] = [];

  const withTimeout = async <T,>(
    label: string,
    p: Promise<T>
  ): Promise<T | null> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        p,
        new Promise<null>((resolve) => {
          timer = setTimeout(() => {
            dnsErrors.push({ query: label, error: `timeout after ${DNS_TIMEOUT_MS}ms` });
            resolve(null);
          }, DNS_TIMEOUT_MS);
        }),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code ?? "")
        : undefined;
      dnsErrors.push({ query: label, code: code || undefined, error: msg });
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const compactTxtRecord = (chunks: string[]) => {
    const joined = chunks.join("");
    if (joined.length <= TXT_MAX_LEN) {
      return { value: joined, length: joined.length, truncated: false };
    }
    return {
      value: joined.slice(0, TXT_MAX_LEN),
      length: joined.length,
      truncated: true,
    };
  };

  const dnsResults = await Promise.allSettled([
    withTimeout("a", dns.resolve4(hostname)),
    withTimeout("aaaa", dns.resolve6(hostname)),
    withTimeout("cname", dns.resolveCname(hostname)),
    withTimeout("ns", dns.resolveNs(hostname)),
    withTimeout("mx", dns.resolveMx(hostname)),
    withTimeout("txt", dns.resolveTxt(hostname)),
    withTimeout("dmarc", dns.resolveTxt(`_dmarc.${hostname}`)),
  ]);

  const [aRes, aaaaRes, cnameRes, nsRes, mxRes, txtRes, dmarcRes] = dnsResults;

  const dnsSummary: Record<string, unknown> = {};

  if (aRes.status === "fulfilled" && Array.isArray(aRes.value)) {
    const list = aRes.value as string[];
    dnsSummary.a = { count: list.length, sample: list.slice(0, ADDR_SAMPLE) };
  } else {
    dnsSummary.a = { count: 0, sample: [] };
  }

  if (aaaaRes.status === "fulfilled" && Array.isArray(aaaaRes.value)) {
    const list = aaaaRes.value as string[];
    dnsSummary.aaaa = { count: list.length, sample: list.slice(0, ADDR_SAMPLE) };
  } else {
    dnsSummary.aaaa = { count: 0, sample: [] };
  }

  if (cnameRes.status === "fulfilled" && Array.isArray(cnameRes.value)) {
    const list = cnameRes.value as string[];
    dnsSummary.cname = { count: list.length, sample: list.slice(0, ADDR_SAMPLE) };
  } else {
    const reason =
      cnameRes.status === "rejected"
        ? (cnameRes.reason as { code?: string; message?: string } | undefined)
        : undefined;
    dnsSummary.cname = {
      count: 0,
      sample: [],
      error: reason?.code || reason?.message || "no CNAME",
    };
  }

  if (nsRes.status === "fulfilled" && Array.isArray(nsRes.value)) {
    const list = nsRes.value as string[];
    dnsSummary.ns = { count: list.length, sample: list.slice(0, ADDR_SAMPLE) };
  } else {
    dnsSummary.ns = { count: 0, sample: [] };
  }

  if (mxRes.status === "fulfilled" && Array.isArray(mxRes.value)) {
    const list = mxRes.value as { exchange: string; priority: number }[];
    dnsSummary.mx = {
      count: list.length,
      sample: list
        .slice(0, ADDR_SAMPLE)
        .map((m) => ({ exchange: m.exchange, priority: m.priority })),
    };
  } else {
    dnsSummary.mx = { count: 0, sample: [] };
  }

  let rootTxtJoined: string[] = [];
  if (txtRes.status === "fulfilled" && Array.isArray(txtRes.value)) {
    const list = txtRes.value as string[][];
    rootTxtJoined = list.map((chunks) => chunks.join(""));
    dnsSummary.txt = {
      count: list.length,
      sample: list.slice(0, TXT_SAMPLE).map(compactTxtRecord),
    };
  } else {
    dnsSummary.txt = { count: 0, sample: [] };
  }

  let dmarcRecord = "";
  if (dmarcRes.status === "fulfilled" && Array.isArray(dmarcRes.value)) {
    const list = dmarcRes.value as string[][];
    for (const chunks of list) {
      const joined = chunks.join("");
      if (/^"?v=dmarc1/i.test(joined)) {
        dmarcRecord = joined;
        break;
      }
    }
  }

  const spfRecord = rootTxtJoined.find((r) => /^"?v=spf1/i.test(r)) || "";
  const mxExists =
    mxRes.status === "fulfilled" &&
    Array.isArray(mxRes.value) &&
    mxRes.value.length > 0;

  const emailAuth = {
    spf: {
      exists: Boolean(spfRecord),
      record: spfRecord
        ? spfRecord.length <= TXT_MAX_LEN
          ? spfRecord
          : `${spfRecord.slice(0, TXT_MAX_LEN)}...`
        : "",
    },
    dmarc: {
      exists: Boolean(dmarcRecord),
      record: dmarcRecord
        ? dmarcRecord.length <= TXT_MAX_LEN
          ? dmarcRecord
          : `${dmarcRecord.slice(0, TXT_MAX_LEN)}...`
        : "",
    },
    mxExists,
  };

  let finalUrl = origin;
  let status = 0;
  let fetchError: string | undefined;
  const headerValue = (headers: Headers, name: string): string => {
    const lower = name.toLowerCase();
    for (const key of headers.keys()) {
      if (key.toLowerCase() === lower) {
        return headers.get(key) || "";
      }
    }
    return "";
  };

  const httpSecurityHeaders = {
    strictTransportSecurity: "",
    contentSecurityPolicy: "",
    xFrameOptions: "",
    xContentTypeOptions: "",
    referrerPolicy: "",
    permissionsPolicy: "",
  };

  try {
    const response = await fetch(origin, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": userAgent, Accept: "*/*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    status = response.status;
    finalUrl = response.url || origin;
    httpSecurityHeaders.strictTransportSecurity = headerValue(
      response.headers,
      "strict-transport-security"
    );
    httpSecurityHeaders.contentSecurityPolicy = headerValue(
      response.headers,
      "content-security-policy"
    );
    httpSecurityHeaders.xFrameOptions = headerValue(response.headers, "x-frame-options");
    httpSecurityHeaders.xContentTypeOptions = headerValue(
      response.headers,
      "x-content-type-options"
    );
    httpSecurityHeaders.referrerPolicy = headerValue(response.headers, "referrer-policy");
    httpSecurityHeaders.permissionsPolicy = headerValue(
      response.headers,
      "permissions-policy"
    );
    if (response.body) {
      try {
        await response.body.cancel();
      } catch {
        // Body drain is best-effort; cancel errors must not fail the check.
      }
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  let https = false;
  try {
    https = new URL(finalUrl).protocol === "https:";
  } catch {
    https = false;
  }
  const hsts = Boolean(httpSecurityHeaders.strictTransportSecurity);

  if (!mxExists) warnings.push("noMx");
  if (!spfRecord) warnings.push("noSpf");
  if (!dmarcRecord) warnings.push("noDmarc");
  if (https && !hsts) warnings.push("noHstsOnHttps");
  const missing: string[] = [];
  if (!httpSecurityHeaders.contentSecurityPolicy) missing.push("content-security-policy");
  if (!httpSecurityHeaders.xFrameOptions) missing.push("x-frame-options");
  if (!httpSecurityHeaders.xContentTypeOptions) missing.push("x-content-type-options");
  if (!httpSecurityHeaders.referrerPolicy) missing.push("referrer-policy");
  if (!httpSecurityHeaders.permissionsPolicy) missing.push("permissions-policy");
  if (missing.length > 0) warnings.push("missingSecurityHeaders");
  if (fetchError) warnings.push(`fetchError:${fetchError.slice(0, 160)}`);

  result.dns = dnsSummary;
  result.emailAuth = emailAuth;
  result.httpSecurity = {
    finalUrl,
    status,
    headers: httpSecurityHeaders,
    ...(fetchError ? { error: fetchError } : {}),
  };
  result.https = https;
  result.hsts = hsts;
  result.warnings = warnings;
  if (dnsErrors.length > 0) {
    result.dnsErrors = dnsErrors;
  }

  ctx.log?.("debug", "dns_and_security_check done", {
    hostname,
    origin,
    https,
    hsts,
    warningCount: warnings.length,
    dnsErrorCount: dnsErrors.length,
    mxCount: (dnsSummary.mx as { count?: number } | undefined)?.count ?? 0,
  });

  return result;
}
