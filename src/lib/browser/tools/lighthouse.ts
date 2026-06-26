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
  const MAX_OPPORTUNITIES = 8;
  const MAX_DIAGNOSTICS = 8;
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

    type SampleEntry = {
      id: string;
      title: string;
      displayValue?: string;
      score: number | null;
      numericValue?: number;
      detailsType?: string;
    };

    const opportunities: SampleEntry[] = [];
    const diagnostics: SampleEntry[] = [];
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
        displayValue: audit.displayValue,
        score: typeof audit.score === "number" ? audit.score : null,
        numericValue:
          typeof audit.numericValue === "number" ? audit.numericValue : undefined,
      };
      if (detailsType) entry.detailsType = detailsType;
      if (isOpportunity) {
        if (opportunities.length < MAX_OPPORTUNITIES) opportunities.push(entry);
      } else if (isInformative) {
        if (diagnostics.length < MAX_DIAGNOSTICS) diagnostics.push(entry);
      }
    }

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
      opportunities,
      diagnostics,
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
