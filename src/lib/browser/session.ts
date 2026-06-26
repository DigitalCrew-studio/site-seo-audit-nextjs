import { chromium, Browser, BrowserContext, Page } from "playwright";
import { execSync } from "child_process";
import type { BrowserLogLevel, BrowserLogFn, BrowserToolContext } from "./types";
import * as basicTools from "./tools/basic";
import * as linkTools from "./tools/links";
import * as httpTools from "./tools/http";
import * as sitemapTools from "./tools/sitemap";
import * as structuredDataTools from "./tools/structured-data";
import * as socialPreviewTools from "./tools/social-preview";
import * as hreflangTools from "./tools/hreflang";
import * as resourceTools from "./tools/resources";
import * as crawlTools from "./tools/crawl";
import * as analyticsTools from "./tools/analytics";
import * as mobileTools from "./tools/mobile";
import * as lighthouseTools from "./tools/lighthouse";
import * as entityTrustTools from "./tools/entity-trust";
import * as dnsSecurityTools from "./tools/dns-security";
import * as onPageTools from "./tools/on-page";
import * as llmsTools from "./tools/llms";

export class BrowserSession {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private onLog?: BrowserLogFn;

  constructor(options: { onLog?: BrowserLogFn } = {}) {
    this.onLog = options.onLog;
  }

  private log(
    level: BrowserLogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    try {
      this.onLog?.(level, message, data);
    } catch {
      // Logging must never break the browser lifecycle.
    }
  }

  async start() {
    this.log("debug", "Preparing to launch headless Chromium", {
      stage: "launch",
    });
    this.log("status", "Launching headless Chromium...");
    this.browser = await this.launchWithInstall();
    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    this.page = await this.context.newPage();
    this.log("debug", "Headless Chromium is ready", { stage: "ready" });
    this.log("status", "Headless Chromium is ready.");
    return this;
  }

  private async launchWithInstall(): Promise<Browser> {
    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };
    try {
      return await chromium.launch(launchOptions);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const needsBrowser = message.includes("Executable doesn't exist");
      const needsDeps = message.includes("error while loading shared libraries");

      if (!needsBrowser && !needsDeps) {
        this.log("error", `Chromium launch failed: ${message}`);
        throw err;
      }

      if (process.env.PLAYWRIGHT_SKIP_RUNTIME_INSTALL === "1") {
        this.log(
          "error",
          "Chromium is not available and runtime install is disabled. Rebuild the Docker image with Playwright browsers installed.",
          { stage: "install:disabled" }
        );
        throw err;
      }

      this.log(
        "debug",
        "Chromium binary or system dependencies missing; installing",
        {
          stage: "install:start",
          reason: needsBrowser ? "missing-browser" : "missing-deps",
        }
      );
      const installCommand = needsDeps
        ? "npx playwright install --with-deps chromium"
        : "npx playwright install chromium";
      this.log("status", "Chromium not ready. Installing...");
      this.log("debug", "Running Playwright install command", {
        stage: "install:command",
        command: installCommand,
      });
      try {
        execSync(installCommand, {
          stdio: "pipe",
          timeout: 300000,
        });
      } catch (installErr) {
        const installMsg =
          installErr instanceof Error
            ? installErr.message
            : String(installErr);
        this.log("error", `Playwright install failed: ${installMsg}`, {
          stage: "install:failure",
        });
        throw installErr;
      }
      this.log("debug", "Chromium installed", { stage: "install:success" });
      this.log("status", "Chromium installed. Relaunching...");
      this.log("debug", "Relaunching headless Chromium", { stage: "relaunch" });
      return await chromium.launch(launchOptions);
    }
  }

  private async goto(url: string) {
    const page = this.getPage();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForLoadState("load", { timeout: 5000 }).catch(() => {});
    return response;
  }

  private getPage(): Page {
    if (!this.page) throw new Error("Browser session not started");
    return this.page;
  }

  private toolContext(): BrowserToolContext {
    return {
      getPage: () => this.getPage(),
      goto: (url) => this.goto(url),
      getBrowser: () => {
        if (!this.browser) throw new Error("Browser session not started");
        return this.browser;
      },
      log: this.onLog,
    };
  }

  async visit(url: string) {
    return basicTools.visit(this.toolContext(), url);
  }

  async getRenderedText(url?: string) {
    return basicTools.getRenderedText(this.toolContext(), url);
  }

  async getRenderedHtml(url?: string) {
    return basicTools.getRenderedHtml(this.toolContext(), url);
  }

  async fetchRawHtml(url: string) {
    return basicTools.fetchRawHtml(this.toolContext(), url);
  }

  async takeScreenshot(url?: string) {
    return basicTools.takeScreenshot(this.toolContext(), url);
  }

  async internalLinks(url: string) {
    return basicTools.internalLinks(this.toolContext(), url);
  }

  async checkLinkHealth(
    url: string,
    maxLinks?: number,
    includeExternal?: boolean
  ): Promise<Record<string, unknown>> {
    return linkTools.checkLinkHealth(
      this.toolContext(),
      url,
      maxLinks,
      includeExternal
    );
  }

  async inspectPageSeo(url: string) {
    return onPageTools.inspectPageSeo(this.toolContext(), url);
  }

  async inspectHttp(inputUrl: string, maxRedirects?: number) {
    return httpTools.inspectHttp(this.toolContext(), inputUrl, maxRedirects);
  }

  async fetchRobotsAndSitemap(baseUrl: string) {
    return sitemapTools.fetchRobotsAndSitemap(this.toolContext(), baseUrl);
  }

  /**
   * Fetch and analyze a site's /llms.txt file. Accepts either a site origin
   * (in which case the URL is normalized to `{origin}/llms.txt`) or a direct
   * `/llms.txt` URL. The body is read with a timeout and capped to 24k chars
   * before any analysis runs. When the file is reachable and non-empty, the
   * method returns a compact markdown-ish analysis (headings, link breakdown,
   * private-URL leak detection, summary/policy heuristics) suitable for the
   * model context.
   */
  async inspectLlmsTxt(inputUrl: string): Promise<Record<string, unknown>> {
    return llmsTools.inspectLlmsTxt(this.toolContext(), inputUrl);
  }

  async extractStructuredData(url: string, checkImages?: boolean) {
    return structuredDataTools.extractStructuredData(
      this.toolContext(),
      url,
      checkImages
    );
  }

  async parseSitemap(
    inputUrl: string,
    maxUrls?: number,
    checkSample?: boolean
  ) {
    return sitemapTools.parseSitemap(
      this.toolContext(),
      inputUrl,
      maxUrls,
      checkSample
    );
  }

  async inspectSocialPreview(url: string, checkImages?: boolean) {
    return socialPreviewTools.inspectSocialPreview(
      this.toolContext(),
      url,
      checkImages
    );
  }

  async inspectHreflang(url: string, checkReciprocal?: boolean) {
    return hreflangTools.inspectHreflang(
      this.toolContext(),
      url,
      checkReciprocal
    );
  }

  async resourceInventory(url: string, waitMs?: number) {
    return resourceTools.resourceInventory(
      this.toolContext(),
      url,
      waitMs
    );
  }

  async close() {
    this.log("debug", "Closing headless Chromium", { stage: "close" });
    this.log("status", "Closing headless Chromium...");
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
  }

  /**
   * Same-host BFS crawl from a start URL using the existing headless Chromium
   * page. Sequential by design (no new contexts) and per-page work is kept
   * compact via a single page.evaluate per visit. Intended as a quick coverage
   * snapshot, not a deep audit.
   */
  async crawlSiteSample(
    inputUrl: string,
    maxPages?: number
  ): Promise<Record<string, unknown>> {
    return crawlTools.crawlSiteSample(this.toolContext(), inputUrl, maxPages);
  }

  /**
   * Render a URL once and return a compact bundle of analytics/marketing tag
   * evidence. Detects a fixed set of common tools (GA4, Universal Analytics,
   * GTM, Yandex Metrica, Meta Pixel, TikTok Pixel, LinkedIn Insight, VK pixel,
   * Hotjar, Microsoft Clarity, Segment), captures dataLayer presence, looks
   * for cookie consent / CMP signals, and flags duplicate tag IDs. All
   * identifier samples are truncated to a safe prefix before being returned
   * to the model. Intended to be called once per page; the renderer is shared.
   */
  async inspectAnalyticsTags(url: string): Promise<Record<string, unknown>> {
    return analyticsTools.inspectAnalyticsTags(this.toolContext(), url);
  }

  /**
   * Render a URL in a temporary mobile-emulated browser context and gather
   * compact mobile-friendliness evidence in a single pass. Uses a separate
   * BrowserContext with a mobile viewport + user agent so the main audit
   * page state is never disturbed. The temporary context is always closed,
   * even on error.
   */
  async inspectMobileRendering(
    url: string,
    width?: number,
    height?: number,
    includeScreenshot?: boolean
  ): Promise<Record<string, unknown>> {
    return mobileTools.inspectMobileRendering(
      this.toolContext(),
      url,
      width,
      height,
      includeScreenshot
    );
  }

  /**
   * Aggregate responsive rendering check: renders the same URL across a
   * sequence of viewport profiles (desktop, laptop, tablet, mobile by
   * default) and returns compact per-profile evidence plus a cross-profile
   * summary. Each profile uses its own temporary BrowserContext so the main
   * audit page is never disturbed; contexts are always closed, even on
   * error. When `includeScreenshots` is true, one JPEG per profile is
   * streamed to the client and omitted from model context.
   */
  async inspectResponsiveRendering(
    url: string,
    profiles?: Array<"desktop" | "laptop" | "tablet" | "mobile">,
    includeScreenshots?: boolean
  ): Promise<Record<string, unknown>> {
    return mobileTools.inspectResponsiveRendering(
      this.toolContext(),
      url,
      profiles,
      includeScreenshots
    );
  }

  /**
   * Run a Lighthouse lab audit using a fresh headless Chrome instance and
   * return a compact, model-friendly summary. Uses dynamic imports so the
   * `lighthouse` and `chrome-launcher` packages are only loaded if this tool
   * is actually invoked (and so the module load never breaks if either is
   * missing at install time).
   *
   * The Chrome instance is launched separately from this session's own
   * Playwright page so the long-running Lighthouse audit does not starve
   * other tools. We prefer the Playwright Chromium executable (already
   * installed for the rest of the audit) and fall back to whatever
   * chrome-launcher can find on the host.
   */
  async runLighthouse(
    url: string,
    formFactor: "mobile" | "desktop" = "mobile"
  ): Promise<Record<string, unknown>> {
    return lighthouseTools.runLighthouse(this.toolContext(), url, formFactor);
  }

  /**
   * Render a URL once and return a compact bundle of entity/brand-trust
   * evidence: brand candidates, logo, contact signals, social links,
   * legal/company links, local business signals, schema sameAs, and a
   * few lightweight consistency checks. Intended to support E-E-A-T and
   * "is this a real entity" judgment calls in the final report.
   */
  async inspectEntityTrust(url: string): Promise<Record<string, unknown>> {
    return entityTrustTools.inspectEntityTrust(this.toolContext(), url);
  }

  /**
   * Inspect DNS posture and HTTP security headers for a site. Uses Node's
   * built-in `dns/promises` resolver and a single origin `fetch` — no new
   * dependencies. All DNS queries are issued in parallel with timeouts and
   * never throw; failures are captured as `dnsErrors` and per-record errors
   * on the affected bucket. Returns compact evidence suitable for model
   * context (counts + small samples + redacted/trimmed TXT).
   */
  async dnsAndSecurityCheck(inputUrl: string): Promise<Record<string, unknown>> {
    return dnsSecurityTools.dnsAndSecurityCheck(this.toolContext(), inputUrl);
  }
}
