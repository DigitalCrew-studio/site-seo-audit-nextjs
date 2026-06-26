import type {
  ConsoleMessage as PWConsoleMessage,
  Request as PWRequest,
  Response as PWResponse,
} from "playwright";
import type { BrowserToolContext } from "../types";

export async function resourceInventory(
  ctx: BrowserToolContext,
  url: string,
  waitMs?: number
) {
  const MAX_BIG_RESOURCES = 10;
  const MAX_CONSOLE_ERRORS = 10;
  const MAX_PAGE_ERRORS = 5;
  const MAX_RENDER_BLOCKING = 10;
  const MAX_THIRD_PARTY_SAMPLE = 10;
  const MAX_LARGE_ERROR_LEN = 500;
  const MAX_WAIT_MS = 5000;
  const MANY_REQUESTS_THRESHOLD = 50;
  const HEAVY_PAGE_BYTES = 2_000_000;
  const MANY_THIRD_PARTIES_THRESHOLD = 15;
  const RENDER_BLOCKING_SCRIPT_WINDOW_MS = 1000;

  const wait = Math.max(0, Math.min(MAX_WAIT_MS, Math.floor(Number(waitMs) || 0)));
  const page = ctx.getPage();

  type RequestEntry = { url: string; method: string; resourceType: string };
  type ResponseEntry = {
    url: string;
    status: number;
    contentType: string;
    contentEncoding: string;
    resourceType: string;
  };
  type FailedEntry = {
    url: string;
    method: string;
    resourceType: string;
    failure: string;
  };
  type PerfEntry = {
    name: string;
    initiatorType: string;
    startTime: number;
    duration: number;
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
    responseStatus?: number;
    renderBlockingStatus?: string;
  };

  const requestMap = new Map<string, RequestEntry>();
  const responseMap = new Map<string, ResponseEntry>();
  const failedList: FailedEntry[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const capText = (s: string, max: number): string =>
    s.length > max ? s.slice(0, max) + "..." : s;

  const onRequest = (req: PWRequest) => {
    try {
      const u = req.url();
      requestMap.set(u, {
        url: u,
        method: req.method(),
        resourceType: req.resourceType(),
      });
    } catch {
      /* listener must never throw */
    }
  };
  const onResponse = (res: PWResponse) => {
    try {
      const u = res.url();
      const headers = res.headers();
      responseMap.set(u, {
        url: u,
        status: res.status(),
        contentType: headers["content-type"] || "",
        contentEncoding: headers["content-encoding"] || "",
        resourceType: res.request().resourceType(),
      });
    } catch {
      /* listener must never throw */
    }
  };
  const onFailed = (req: PWRequest) => {
    try {
      const failure = req.failure();
      failedList.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        failure: failure?.errorText || "unknown",
      });
    } catch {
      /* listener must never throw */
    }
  };
  const onConsole = (msg: PWConsoleMessage) => {
    try {
      if (msg.type() !== "error") return;
      if (consoleErrors.length >= MAX_CONSOLE_ERRORS) return;
      consoleErrors.push(capText(msg.text(), MAX_LARGE_ERROR_LEN));
    } catch {
      /* listener must never throw */
    }
  };
  const onPageError = (err: Error) => {
    try {
      if (pageErrors.length >= MAX_PAGE_ERRORS) return;
      pageErrors.push(capText(err.message || String(err), MAX_LARGE_ERROR_LEN));
    } catch {
      /* listener must never throw */
    }
  };

  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("requestfailed", onFailed);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const TYPES = [
    "document",
    "script",
    "stylesheet",
    "image",
    "font",
    "fetch",
    "xhr",
    "media",
    "other",
  ] as const;
  const classifyType = (rt: string): (typeof TYPES)[number] => {
    if (
      rt === "document" ||
      rt === "script" ||
      rt === "stylesheet" ||
      rt === "image" ||
      rt === "font" ||
      rt === "fetch" ||
      rt === "xhr" ||
      rt === "media"
    ) {
      return rt;
    }
    return "other";
  };
  const classifyFromInitiator = (
    init: string
  ): (typeof TYPES)[number] => {
    switch (init) {
      case "img":
      case "image":
        return "image";
      case "link":
      case "css":
      case "style":
        return "stylesheet";
      case "script":
        return "script";
      case "fetch":
        return "fetch";
      case "xmlhttprequest":
        return "xhr";
      case "video":
      case "audio":
      case "media":
        return "media";
      case "font":
        return "font";
      case "document":
      case "iframe":
        return "document";
      default:
        return "other";
    }
  };

  try {
    const start = Date.now();
    const response = await ctx.goto(url);
    const responseTime = Date.now() - start;
    const status = response?.status() ?? 0;

    if (wait > 0) {
      await page.waitForTimeout(wait).catch(() => {});
    }

    const perfEntries = await page
      .evaluate(() => {
        const list = performance.getEntriesByType(
          "resource"
        ) as unknown as Array<{
          name: string;
          initiatorType: string;
          startTime: number;
          duration: number;
          transferSize: number;
          encodedBodySize: number;
          decodedBodySize: number;
          responseStatus?: number;
          renderBlockingStatus?: string;
        }>;
        return list.map((e) => ({
          name: e.name,
          initiatorType: e.initiatorType || "",
          startTime: typeof e.startTime === "number" ? e.startTime : 0,
          duration: typeof e.duration === "number" ? e.duration : 0,
          transferSize:
            typeof e.transferSize === "number" ? e.transferSize : 0,
          encodedBodySize:
            typeof e.encodedBodySize === "number" ? e.encodedBodySize : 0,
          decodedBodySize:
            typeof e.decodedBodySize === "number" ? e.decodedBodySize : 0,
          responseStatus:
            typeof e.responseStatus === "number"
              ? e.responseStatus
              : undefined,
          renderBlockingStatus:
            typeof e.renderBlockingStatus === "string"
              ? e.renderBlockingStatus
              : undefined,
        }));
      })
      .catch(() => [] as PerfEntry[]);

    const finalUrl = page.url();
    let origin = "";
    try {
      origin = new URL(finalUrl).hostname;
    } catch {
      /* non-fatal */
    }

    const statusBuckets = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, other: 0 };
    for (const r of responseMap.values()) {
      if (r.status >= 200 && r.status < 300) statusBuckets["2xx"] += 1;
      else if (r.status >= 300 && r.status < 400) statusBuckets["3xx"] += 1;
      else if (r.status >= 400 && r.status < 500) statusBuckets["4xx"] += 1;
      else if (r.status >= 500 && r.status < 600) statusBuckets["5xx"] += 1;
      else statusBuckets.other += 1;
    }

    const allUrls = new Set<string>();
    for (const u of requestMap.keys()) allUrls.add(u);
    for (const u of responseMap.keys()) allUrls.add(u);
    for (const f of failedList) allUrls.add(f.url);

    const urlType = new Map<string, (typeof TYPES)[number]>();
    for (const [u, r] of requestMap) urlType.set(u, classifyType(r.resourceType));
    for (const [u, r] of responseMap) {
      if (!urlType.has(u)) urlType.set(u, classifyType(r.resourceType));
    }
    for (const f of failedList) {
      if (!urlType.has(f.url)) urlType.set(f.url, classifyType(f.resourceType));
    }

    const perfByUrl = new Map<string, PerfEntry>();
    for (const e of perfEntries) {
      perfByUrl.set(e.name, e);
      if (!urlType.has(e.name)) {
        urlType.set(e.name, classifyFromInitiator(e.initiatorType));
      }
    }

    const byType: Record<(typeof TYPES)[number], { count: number; transferBytes: number }> = {
      document: { count: 0, transferBytes: 0 },
      script: { count: 0, transferBytes: 0 },
      stylesheet: { count: 0, transferBytes: 0 },
      image: { count: 0, transferBytes: 0 },
      font: { count: 0, transferBytes: 0 },
      fetch: { count: 0, transferBytes: 0 },
      xhr: { count: 0, transferBytes: 0 },
      media: { count: 0, transferBytes: 0 },
      other: { count: 0, transferBytes: 0 },
    };

    let totalTransfer = 0;
    let encodedBodySum = 0;
    let decodedBodySum = 0;

    for (const u of allUrls) {
      const t = urlType.get(u) || "other";
      const p = perfByUrl.get(u);
      byType[t].count += 1;
      if (p) {
        byType[t].transferBytes += p.transferSize;
        totalTransfer += p.transferSize;
        encodedBodySum += p.encodedBodySize;
        decodedBodySum += p.decodedBodySize;
      }
    }

    type Ranked = {
      url: string;
      type: string;
      transferBytes: number;
      encodedBodySize: number;
      decodedBodySize?: number;
      duration: number;
      initiatorType: string;
      renderBlockingStatus?: string;
    };
    const ranked: Ranked[] = Array.from(perfByUrl.entries())
      .map(([u, p]) => {
        const transferBytes = p.transferSize || p.encodedBodySize || 0;
        const r: Ranked = {
          url: u,
          type: urlType.get(u) || classifyFromInitiator(p.initiatorType),
          transferBytes,
          encodedBodySize: p.encodedBodySize,
          decodedBodySize: p.decodedBodySize,
          duration: p.duration,
          initiatorType: p.initiatorType,
        };
        if (p.renderBlockingStatus) r.renderBlockingStatus = p.renderBlockingStatus;
        return r;
      })
      .sort((a, b) => b.transferBytes - a.transferBytes)
      .slice(0, MAX_BIG_RESOURCES)
      .map((r) => ({
        url: r.url,
        type: r.type,
        transferBytes: r.transferBytes,
        encodedBodySize: r.encodedBodySize,
        duration: Math.round(r.duration),
        initiatorType: r.initiatorType,
        ...(r.decodedBodySize ? { decodedBodySize: r.decodedBodySize } : {}),
        ...(r.renderBlockingStatus ? { renderBlockingStatus: r.renderBlockingStatus } : {}),
      }));

    const thirdPartyMap = new Map<string, { count: number; bytes: number }>();
    for (const [u, p] of perfByUrl) {
      let host = "";
      try {
        host = new URL(u).hostname;
      } catch {
        continue;
      }
      if (!host || host === origin) continue;
      const cur = thirdPartyMap.get(host) || { count: 0, bytes: 0 };
      cur.count += 1;
      cur.bytes += p.transferSize;
      thirdPartyMap.set(host, cur);
    }
    const thirdPartyArr = Array.from(thirdPartyMap.entries())
      .map(([host, v]) => ({ host, count: v.count, bytes: v.bytes }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_THIRD_PARTY_SAMPLE);

    const renderBlocking: Array<{
      url: string;
      type: string;
      transferBytes: number;
      startTime: number;
      renderBlockingStatus?: string;
    }> = [];
    for (const [u, p] of perfByUrl) {
      const t = urlType.get(u);
      if (t !== "stylesheet" && t !== "script") continue;
      const explicitBlocking = p.renderBlockingStatus === "blocking";
      const heuristicBlocking =
        t === "stylesheet" ||
        (t === "script" && p.startTime < RENDER_BLOCKING_SCRIPT_WINDOW_MS);
      if (!explicitBlocking && !heuristicBlocking) continue;
      const entry: {
        url: string;
        type: string;
        transferBytes: number;
        startTime: number;
        renderBlockingStatus?: string;
      } = {
        url: u,
        type: t,
        transferBytes: p.transferSize,
        startTime: Math.round(p.startTime),
      };
      if (p.renderBlockingStatus) entry.renderBlockingStatus = p.renderBlockingStatus;
      renderBlocking.push(entry);
    }
    renderBlocking.sort((a, b) => a.startTime - b.startTime);
    renderBlocking.length = Math.min(renderBlocking.length, MAX_RENDER_BLOCKING);

    const compression = { gzip: 0, br: 0, deflate: 0, none: 0 };
    for (const r of responseMap.values()) {
      const enc = (r.contentEncoding || "").toLowerCase().split(",")[0].trim();
      if (enc === "gzip") compression.gzip += 1;
      else if (enc === "br") compression.br += 1;
      else if (enc === "deflate") compression.deflate += 1;
      else compression.none += 1;
    }

    const warnings: string[] = [];
    const requestCount = requestMap.size;
    if (requestCount > MANY_REQUESTS_THRESHOLD) warnings.push("manyRequests");
    if (totalTransfer > HEAVY_PAGE_BYTES) warnings.push("heavyPage");
    if (thirdPartyMap.size > MANY_THIRD_PARTIES_THRESHOLD) warnings.push("manyThirdParties");
    if (consoleErrors.length > 0) warnings.push("consoleErrors");
    if (failedList.length > 0) warnings.push("failedRequests");

    return {
      url,
      finalUrl,
      status,
      responseTime,
      requestCount,
      failedRequestCount: failedList.length,
      statusBuckets,
      totalTransferBytes: totalTransfer,
      encodedBodyBytes: encodedBodySum,
      decodedBodyBytes: decodedBodySum,
      byType,
      largestResources: ranked,
      thirdPartyHosts: {
        count: thirdPartyMap.size,
        sample: thirdPartyArr,
      },
      js: { fileCount: byType.script.count, totalBytes: byType.script.transferBytes },
      css: { fileCount: byType.stylesheet.count, totalBytes: byType.stylesheet.transferBytes },
      images: { fileCount: byType.image.count, totalBytes: byType.image.transferBytes },
      fonts: { fileCount: byType.font.count, totalBytes: byType.font.transferBytes },
      consoleErrors,
      pageErrors,
      renderBlockingCandidates: renderBlocking,
      compression,
      warnings,
      _truncated: {
        consoleErrors: consoleErrors.length === MAX_CONSOLE_ERRORS,
        pageErrors: pageErrors.length === MAX_PAGE_ERRORS,
        largestResources: perfByUrl.size > MAX_BIG_RESOURCES,
        thirdPartySample: thirdPartyMap.size > MAX_THIRD_PARTY_SAMPLE,
      },
    };
  } finally {
    page.off("request", onRequest);
    page.off("response", onResponse);
    page.off("requestfailed", onFailed);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}
