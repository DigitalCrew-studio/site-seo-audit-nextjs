import { chromium, Browser, BrowserContext, Page } from "playwright";
import { execSync } from "child_process";

const MAX_TEXT_LENGTH = 24000;
const MAX_HTML_LENGTH = 32000;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n\n... [truncated from ${text.length} chars]`;
}

export type BrowserLogLevel = "status" | "debug" | "error";
export type BrowserLogFn = (
  level: BrowserLogLevel,
  message: string,
  data?: Record<string, unknown>
) => void;

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

  async visit(url: string) {
    const start = Date.now();
    const response = await this.goto(url);
    const page = this.getPage();
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

  async getRenderedText(url?: string) {
    const page = this.getPage();
    if (url) await this.goto(url);
    const bodyText = await page
      .$eval("body", (el) => el.innerText)
      .catch(() => "");
    return { text: truncate(bodyText, MAX_TEXT_LENGTH) };
  }

  async getRenderedHtml(url?: string) {
    const page = this.getPage();
    if (url) await this.goto(url);
    const html = await page.content().catch(() => "");
    return { html: truncate(html, MAX_HTML_LENGTH) };
  }

  async fetchRawHtml(url: string) {
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

  async takeScreenshot(url?: string) {
    const page = this.getPage();
    if (url) await this.goto(url);
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

  async internalLinks(url: string) {
    const page = this.getPage();
    await this.goto(url);
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

  async fetchRobotsAndSitemap(baseUrl: string) {
    const origin = new URL(baseUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;
    const sitemapUrl = `${origin}/sitemap.xml`;
    const fetchText = (url: string) =>
      fetch(url, { signal: AbortSignal.timeout(15000) })
        .then((r) => r.text())
        .catch((e) => `Error: ${e.message}`);
    const [robotsRes, sitemapRes] = await Promise.all([
      fetchText(robotsUrl),
      fetchText(sitemapUrl),
    ]);
    return {
      robotsUrl,
      robots: truncate(robotsRes, 12000),
      sitemapUrl,
      sitemap: truncate(sitemapRes, 12000),
    };
  }

  async close() {
    this.log("debug", "Closing headless Chromium", { stage: "close" });
    this.log("status", "Closing headless Chromium...");
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
  }
}
