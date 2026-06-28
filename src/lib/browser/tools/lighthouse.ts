import { chromium } from "playwright";
import type { BrowserToolContext, BrowserLogFn } from "../types";

export type LighthouseFormFactor = "mobile" | "desktop";

/**
 * Run a Lighthouse lab audit using a fresh headless Chrome instance and
 * return a compact, model-friendly summary. Uses dynamic imports so the
 * `lighthouse` and `chrome-launcher` packages are only loaded if this tool
 * is actually invoked (and so the module load never breaks if either is
 * missing at install time).
 *
 * The Chrome instance is launched separately from the main session's
 * Playwright page so the long-running Lighthouse audit does not starve
 * other tools. We prefer the Playwright Chromium executable (already
 * installed for the rest of the audit) and fall back to whatever
 * chrome-launcher can find on the host.
 */
export async function runLighthouse(
  ctx: BrowserToolContext,
  url: string,
  formFactor: LighthouseFormFactor = "mobile"
): Promise<Record<string, unknown>> {
  const MAX_OPPORTUNITIES = 20;
  const MAX_DIAGNOSTICS = 20;
  const MAX_FAILED_AUDITS = 35;
  const MAX_DETAIL_ITEMS = 5;
  const METRIC_IDS = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
    "interactive",
  ] as const;
  const CATEGORY_IDS = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
  ] as const;

  const log: BrowserLogFn | undefined = ctx.log;
  log?.("status", `Running Lighthouse (${formFactor}) for ${url}...`);
  log?.("debug", "Lighthouse run starting", { url, formFactor });

  let lighthouseModule: typeof import("lighthouse") | null = null;
  let chromeLauncher: typeof import("chrome-launcher") | null = null;
  try {
    [lighthouseModule, chromeLauncher] = await Promise.all([
      import("lighthouse"),
      import("chrome-launcher"),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log?.("error", `Failed to load Lighthouse modules: ${msg}`);
    return {
      url,
      formFactor,
      requestedFormFactor: formFactor,
      error:
        "lighthouse_or_chrome_launcher_not_installed: install the `lighthouse` and `chrome-launcher` npm packages to enable run_lighthouse.",
      details: msg,
    };
  }

  let chromePath: string | undefined;
  try {
    const pwPath = chromium.executablePath();
    if (pwPath) chromePath = pwPath;
  } catch (err) {
    log?.("debug", "Playwright Chromium path unavailable", {
      reason: err instanceof Error ? err.message : String(err),
    });
  }
  if (!chromePath) {
    try {
      chromePath = chromeLauncher.getChromePath() || undefined;
    } catch (err) {
      log?.("debug", "chrome-launcher getChromePath failed", {
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!chromePath) {
    log?.("error", "No Chrome/Chromium executable available for Lighthouse");
    return {
      url,
      formFactor,
      error:
        "chrome_not_found: install Playwright Chromium (`npx playwright install chromium`) or a system Chrome/Chromium that chrome-launcher can detect.",
      details:
        "Lighthouse requires a Chrome or Chromium binary. None was found in PLAYWRIGHT_BROWSERS_PATH or in standard system install locations.",
    };
  }

  log?.("debug", "Launching headless Chrome for Lighthouse", {
    chromePath,
    formFactor,
  });

  let chrome: import("chrome-launcher").LaunchedChrome | null = null;
  try {
    chrome = await chromeLauncher.launch({
      chromePath,
      chromeFlags: [
        "--headless=new",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-default-browser-check",
      ],
      logLevel: "error",
    });

    const lighthouseFn = lighthouseModule.default;
    const desktopConfig = lighthouseModule.desktopConfig;
    const hasDesktopConfig = Boolean(desktopConfig && typeof desktopConfig === "object");
    log?.("debug", "Lighthouse desktopConfig availability", {
      formFactor,
      hasDesktopConfig,
    });

    let config: unknown = undefined;
    let configPreset: "desktopConfig" | "fallbackDesktop" | "defaultMobile" = "defaultMobile";
    if (formFactor === "desktop") {
      if (hasDesktopConfig) {
        config = desktopConfig;
        configPreset = "desktopConfig";
      } else {
        // Fallback: build an explicit desktop preset if the package didn't
        // expose one. This still produces a desktop-shaped Lighthouse run.
        const presetModule = await import("lighthouse/core/config/desktop-config.js").catch(
          () => null
        );
        const fallback = (presetModule as { default?: unknown } | null)?.default ?? presetModule;
        if (fallback && typeof fallback === "object") {
          config = fallback;
          configPreset = "fallbackDesktop";
        } else {
          configPreset = "fallbackDesktop";
        }
      }
    }

    const desktopSettings =
      formFactor === "desktop"
        ? {
            formFactor: "desktop" as const,
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
            },
            throttlingMethod: "simulate" as const,
            emulatedUserAgent:
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          }
        : undefined;

    const runnerSettings: Record<string, unknown> = {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      formFactor,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    };
    if (desktopSettings) {
      Object.assign(runnerSettings, desktopSettings);
    }

    log?.("debug", "Invoking Lighthouse runner", {
      port: chrome.port,
      formFactor,
      configPreset,
    });

    const runnerResult = await lighthouseFn(
      url,
      runnerSettings,
      config as Parameters<typeof lighthouseFn>[2]
    );

    if (!runnerResult) {
      return {
        url,
        formFactor,
        requestedFormFactor: formFactor,
        configPreset,
        error: "lighthouse_returned_no_result: Lighthouse runner did not return a result.",
      };
    }

    const lhr = runnerResult.lhr;
    if (!lhr) {
      return {
        url,
        formFactor,
        requestedFormFactor: formFactor,
        configPreset,
        error: "lighthouse_returned_no_lhr: Lighthouse result was empty.",
      };
    }

    if (lhr.runtimeError) {
      log?.("error", `Lighthouse runtimeError: ${lhr.runtimeError.message}`);
      return {
        url,
        finalUrl: lhr.finalDisplayedUrl || lhr.finalUrl || undefined,
        formFactor,
        requestedFormFactor: formFactor,
        configPreset,
        fetchTime: lhr.fetchTime,
        runtimeError: {
          code: lhr.runtimeError.code,
          message: lhr.runtimeError.message,
        },
        error: `lighthouse_runtime_error: ${lhr.runtimeError.code} - ${lhr.runtimeError.message}`,
      };
    }

    const categories: Record<string, number | null> = {};
    for (const id of CATEGORY_IDS) {
      const cat = lhr.categories?.[id];
      categories[id] = cat && typeof cat.score === "number" ? cat.score : null;
    }

    const metrics: Record<string, { score: number | null; displayValue?: string; numericValue?: number }> = {};
    for (const id of METRIC_IDS) {
      const audit = lhr.audits?.[id];
      if (!audit) continue;
      metrics[id] = {
        score: typeof audit.score === "number" ? audit.score : null,
        displayValue: audit.displayValue,
        numericValue: typeof audit.numericValue === "number" ? audit.numericValue : undefined,
      };
    }

    type DetailItem = Record<string, string | number | boolean | null>;
    type SampleEntry = {
      id: string;
      title: string;
      description?: string;
      displayValue?: string;
      score: number | null;
      scoreDisplayMode?: string;
      numericValue?: number;
      numericUnit?: string;
      detailsType?: string;
      savings?: {
        wastedMs?: number;
        wastedBytes?: number;
      };
      items?: DetailItem[];
    };

    const isPrimitiveDetailValue = (
      value: unknown
    ): value is string | number | boolean | null =>
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean";

    const normalizeDetailValue = (value: unknown): string | number | boolean | null | undefined => {
      if (isPrimitiveDetailValue(value)) return value;
      if (!value || typeof value !== "object") return undefined;
      const record = value as Record<string, unknown>;
      const candidate =
        record.url ??
        record.value ??
        record.text ??
        record.label ??
        record.nodeLabel ??
        record.selector ??
        record.snippet;
      return isPrimitiveDetailValue(candidate) ? candidate : undefined;
    };

    const summarizeDetailsItems = (details: unknown): DetailItem[] | undefined => {
      if (!details || typeof details !== "object") return undefined;
      const record = details as Record<string, unknown>;
      if (!Array.isArray(record.items)) return undefined;
      const items: DetailItem[] = [];
      for (const rawItem of record.items.slice(0, MAX_DETAIL_ITEMS)) {
        if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) continue;
        const item: DetailItem = {};
        for (const [key, value] of Object.entries(rawItem as Record<string, unknown>)) {
          const normalized = normalizeDetailValue(value);
          if (normalized !== undefined) item[key] = normalized;
        }
        if (Object.keys(item).length > 0) items.push(item);
      }
      return items.length > 0 ? items : undefined;
    };

    const opportunities: SampleEntry[] = [];
    const diagnostics: SampleEntry[] = [];
    const failedAudits: SampleEntry[] = [];
    const manualAudits: SampleEntry[] = [];
    const notApplicableAudits: SampleEntry[] = [];
    let passedAuditCount = 0;
    const audits = lhr.audits || {};
    for (const [id, audit] of Object.entries(audits)) {
      const detailsType =
        audit.details && typeof audit.details === "object" && "type" in audit.details
          ? String((audit.details as { type?: unknown }).type)
          : undefined;
      const isMetric = (METRIC_IDS as readonly string[]).includes(id);
      const isOpportunity = detailsType === "opportunity";
      const isInformative =
        audit.scoreDisplayMode === "informative" ||
        audit.scoreDisplayMode === "metricSavings";
      if (isMetric) continue;
      const entry: SampleEntry = {
        id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue,
        score: typeof audit.score === "number" ? audit.score : null,
        scoreDisplayMode: audit.scoreDisplayMode,
        numericValue:
          typeof audit.numericValue === "number" ? audit.numericValue : undefined,
        numericUnit: audit.numericUnit,
      };
      if (detailsType) entry.detailsType = detailsType;
      const savings: SampleEntry["savings"] = {};
      if (typeof audit.details === "object" && audit.details) {
        const details = audit.details as { overallSavingsMs?: unknown; overallSavingsBytes?: unknown };
        if (typeof details.overallSavingsMs === "number") savings.wastedMs = details.overallSavingsMs;
        if (typeof details.overallSavingsBytes === "number") savings.wastedBytes = details.overallSavingsBytes;
        const items = summarizeDetailsItems(audit.details);
        if (items) entry.items = items;
      }
      if (Object.keys(savings).length > 0) entry.savings = savings;
      if (isOpportunity) {
        if (opportunities.length < MAX_OPPORTUNITIES) opportunities.push(entry);
      } else if (isInformative) {
        if (diagnostics.length < MAX_DIAGNOSTICS) diagnostics.push(entry);
      }
      if (audit.scoreDisplayMode === "manual") {
        if (manualAudits.length < MAX_FAILED_AUDITS) manualAudits.push(entry);
      } else if (audit.scoreDisplayMode === "notApplicable") {
        if (notApplicableAudits.length < MAX_FAILED_AUDITS) notApplicableAudits.push(entry);
      } else if (typeof audit.score === "number" && audit.score >= 0.9) {
        passedAuditCount += 1;
      } else if (
        typeof audit.score === "number" &&
        audit.score < 0.9 &&
        failedAudits.length < MAX_FAILED_AUDITS
      ) {
        failedAudits.push(entry);
      }
    }

    const categoryAuditRefs = Object.fromEntries(
      Object.entries(lhr.categories || {}).map(([id, category]) => [
        id,
        (category.auditRefs || []).slice(0, 60).map((ref) => ({
          id: ref.id,
          weight: ref.weight,
          group: ref.group,
        })),
      ])
    );

    const result: Record<string, unknown> = {
      url,
      finalUrl: lhr.finalDisplayedUrl || lhr.finalUrl || undefined,
      formFactor,
      requestedFormFactor: formFactor,
      configPreset,
      fetchTime: lhr.fetchTime,
      lighthouseVersion: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
      categories,
      metrics,
      categoryAuditRefs,
      opportunities,
      diagnostics,
      failedAudits,
      manualAudits,
      notApplicableAudits,
      passedAuditCount,
      runWarnings: lhr.runWarnings || [],
    };
    log?.("debug", "Lighthouse run finished", {
      url: result.finalUrl,
      formFactor,
      requestedFormFactor: formFactor,
      configPreset,
      fetchTime: result.fetchTime,
      opportunities: opportunities.length,
      diagnostics: diagnostics.length,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log?.("error", `Lighthouse run failed: ${msg}`);
    return {
      url,
      formFactor,
      requestedFormFactor: formFactor,
      configPreset: formFactor === "desktop" ? "fallbackDesktop" : "defaultMobile",
      error: `lighthouse_run_failed: ${msg}`,
      hint:
        "If Chrome cannot be launched, install Playwright Chromium (`npx playwright install chromium`) or set CHROME_PATH to a system Chrome binary.",
    };
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        /* best-effort cleanup */
      }
    }
  }
}
