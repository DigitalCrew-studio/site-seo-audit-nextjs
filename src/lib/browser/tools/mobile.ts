import type { BrowserToolContext } from "../types";

/**
 * Render a URL in a temporary mobile-emulated browser context and gather
 * compact mobile-friendliness evidence in a single pass. Uses a separate
 * BrowserContext with a mobile viewport + user agent so the main audit
 * page state is never disturbed. The temporary context is always closed,
 * even on error.
 */
export async function inspectMobileRendering(
  ctx: BrowserToolContext,
  url: string,
  width?: number,
  height?: number,
  includeScreenshot?: boolean
): Promise<Record<string, unknown>> {
  const MAX_WIDTH = 2000;
  const MAX_HEIGHT = 4000;
  const MIN_WIDTH = 240;
  const MIN_HEIGHT = 320;
  const MAX_FONT_SAMPLES = 10;
  const MAX_TAP_SAMPLES = 10;
  const MAX_ITERATE = 2000;
  const MAX_FIRST_SCREEN_CHARS = 600;
  const MIN_FONT_PX = 12;
  const MIN_TAP_PX = 48;

  const mobileUA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

  const w = Math.max(
    MIN_WIDTH,
    Math.min(MAX_WIDTH, Math.floor(Number(width) || 390))
  );
  const h = Math.max(
    MIN_HEIGHT,
    Math.min(MAX_HEIGHT, Math.floor(Number(height) || 844))
  );
  const wantScreenshot = Boolean(includeScreenshot);

  if (!ctx.getBrowser) {
    throw new Error("Browser session not started");
  }
  const browser = ctx.getBrowser();

  ctx.log?.("status", `Inspecting mobile rendering for ${url} (${w}x${h})...`);
  ctx.log?.("debug", "Mobile render context start", {
    url,
    width: w,
    height: h,
    includeScreenshot: wantScreenshot,
  });

  const mobileContext = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: mobileUA,
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.setDefaultTimeout(15000);

  let responseTime = 0;
  let status = 0;
  let finalUrl = "";
  let evaluateData: Record<string, unknown> | null = null;
  let evaluateError: string | undefined;
  let screenshotBuffer: Buffer | undefined;
  let screenshotError: string | undefined;
  let navigationError: string | undefined;

  try {
    const start = Date.now();
    let response: import("playwright").Response | null = null;
    try {
      response = await mobilePage.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch (navErr) {
      navigationError = navErr instanceof Error ? navErr.message : String(navErr);
      ctx.log?.("debug", "Mobile goto failed", { error: navigationError });
    }
    responseTime = Date.now() - start;
    status = response?.status() ?? 0;
    finalUrl = mobilePage.url();

    await mobilePage
      .waitForLoadState("load", { timeout: 5000 })
      .catch(() => {});

    try {
      evaluateData = (await mobilePage.evaluate(
        (args: {
          MAX_FONT_SAMPLES: number;
          MAX_TAP_SAMPLES: number;
          MAX_ITERATE: number;
          MAX_FIRST_SCREEN_CHARS: number;
          MIN_FONT_PX: number;
          MIN_TAP_PX: number;
        }) => {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const docEl = document.documentElement;
          const docW = docEl.clientWidth;
          const scrollW = docEl.scrollWidth;
          const bodyEl = document.body;
          const bodyW = bodyEl ? bodyEl.clientWidth : 0;
          const bodyScrollW = bodyEl ? bodyEl.scrollWidth : 0;
          const contentHeight = Math.max(
            docEl.scrollHeight,
            bodyEl ? bodyEl.scrollHeight : 0
          );
          const overflow =
            Math.max(scrollW, bodyScrollW) - viewportWidth;

          const viewportMeta = document.querySelector(
            'meta[name="viewport"]'
          );
          const viewportContent = viewportMeta
            ? viewportMeta.getAttribute("content") || ""
            : "";

          const fontSelectors =
            "p, li, span, a, h1, h2, h3, h4, h5, h6, td, th, blockquote, label, button, dt, dd, small, strong, em, b, i, figcaption";
          const fontEls = Array.from(
            document.querySelectorAll(fontSelectors)
          );
          const fontIssues: Array<{
            tag: string;
            text: string;
            fontSize: number;
          }> = [];
          let fontIssueCount = 0;
          const seenFont = new Set<string>();
          const iterateFont = Math.min(fontEls.length, args.MAX_ITERATE);
          for (let i = 0; i < iterateFont; i += 1) {
            const el = fontEls[i];
            const text = (el.textContent || "").trim();
            if (!text) continue;
            const cs = window.getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const px = parseFloat(cs.fontSize);
            if (!isFinite(px) || px >= args.MIN_FONT_PX) continue;
            fontIssueCount += 1;
            if (fontIssues.length < args.MAX_FONT_SAMPLES) {
              const key = `${el.tagName}|${Math.round(px * 10)}|${text.slice(0, 40)}`;
              if (!seenFont.has(key)) {
                seenFont.add(key);
                fontIssues.push({
                  tag: el.tagName.toLowerCase(),
                  text: text.slice(0, 80),
                  fontSize: Math.round(px * 100) / 100,
                });
              }
            }
          }

          const tapEls = Array.from(
            document.querySelectorAll(
              'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"]'
            )
          );
          const tapIssues: Array<{
            tag: string;
            text: string;
            width: number;
            height: number;
          }> = [];
          let tapIssueCount = 0;
          const iterateTap = Math.min(tapEls.length, args.MAX_ITERATE);
          for (let i = 0; i < iterateTap; i += 1) {
            const el = tapEls[i];
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (
              rect.width >= args.MIN_TAP_PX &&
              rect.height >= args.MIN_TAP_PX
            ) {
              continue;
            }
            const cs = window.getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") continue;
            tapIssueCount += 1;
            if (tapIssues.length < args.MAX_TAP_SAMPLES) {
              const text = (
                (el.textContent || "").trim() ||
                el.getAttribute("aria-label") ||
                el.getAttribute("title") ||
                el.getAttribute("placeholder") ||
                ""
              ).slice(0, 60);
              tapIssues.push({
                tag: el.tagName.toLowerCase(),
                text,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              });
            }
          }

          const h1El = document.querySelector("h1");
          const h1Text = h1El
            ? (h1El.textContent || "").trim().slice(0, 200)
            : "";
          let h1Visible = false;
          let h1AboveFold = false;
          if (h1El) {
            const cs = window.getComputedStyle(h1El);
            const r = h1El.getBoundingClientRect();
            h1Visible =
              r.width > 0 &&
              r.height > 0 &&
              cs.display !== "none" &&
              cs.visibility !== "hidden";
            h1AboveFold = h1Visible && r.bottom > 0 && r.top < viewportHeight;
          }

          const navCandidates: Element[] = [];
          const navEl = document.querySelector("nav");
          if (navEl) navCandidates.push(navEl);
          const roleNav = document.querySelector('[role="navigation"]');
          if (roleNav) navCandidates.push(roleNav);
          const headerEl = document.querySelector("header");
          if (headerEl) navCandidates.push(headerEl);
          let primaryNavVisible = false;
          let primaryNavTag = "";
          for (const el of navCandidates) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            const cs = window.getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") continue;
            if (r.bottom > 0 && r.top < viewportHeight) {
              primaryNavVisible = true;
              primaryNavTag = el.tagName.toLowerCase();
              break;
            }
          }

          const firstScreenChunks: string[] = [];
          let totalFirstScreen = 0;
          const walker = document.createTreeWalker(
            bodyEl || docEl,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode(node: Node) {
                if (!node.nodeValue || !node.nodeValue.trim())
                  return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const cs = window.getComputedStyle(parent);
                if (cs.display === "none" || cs.visibility === "hidden")
                  return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
              },
            }
          );
          let tn: Node | null = walker.nextNode();
          while (tn) {
            const parent = (tn as Text).parentElement;
            if (parent) {
              const r = parent.getBoundingClientRect();
              if (r.bottom > 0 && r.top < viewportHeight) {
                const t = (tn.nodeValue || "")
                  .replace(/\s+/g, " ")
                  .trim();
                if (t) {
                  const remaining =
                    args.MAX_FIRST_SCREEN_CHARS - totalFirstScreen;
                  if (remaining <= 0) break;
                  if (t.length > remaining) {
                    firstScreenChunks.push(t.slice(0, remaining));
                    totalFirstScreen = args.MAX_FIRST_SCREEN_CHARS;
                    break;
                  }
                  firstScreenChunks.push(t);
                  totalFirstScreen += t.length;
                }
              }
            }
            tn = walker.nextNode();
          }
          const firstScreenText = firstScreenChunks
            .join(" ")
            .slice(0, args.MAX_FIRST_SCREEN_CHARS);

          const anchors = Array.from(
            document.querySelectorAll("a[href]")
          );
          let aboveFoldLinks = 0;
          for (let i = 0; i < anchors.length; i += 1) {
            const a = anchors[i];
            const r = a.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.top < viewportHeight && r.bottom > 0) aboveFoldLinks += 1;
          }

          return {
            viewportWidth,
            viewportHeight,
            docWidth: docW,
            bodyWidth: bodyW,
            scrollWidth: Math.max(scrollW, bodyScrollW),
            contentHeight: Math.round(contentHeight),
            horizontalOverflow: overflow > 0,
            overflowAmount: Math.max(0, Math.round(overflow)),
            viewportContent,
            fontIssueCount,
            fontIssues,
            tapIssueCount,
            tapIssues,
            h1Text,
            h1Visible,
            h1AboveFold,
            primaryNavVisible,
            primaryNavTag,
            firstScreenText,
            aboveFoldLinks,
          };
        },
        {
          MAX_FONT_SAMPLES,
          MAX_TAP_SAMPLES,
          MAX_ITERATE,
          MAX_FIRST_SCREEN_CHARS,
          MIN_FONT_PX,
          MIN_TAP_PX,
        }
      )) as Record<string, unknown>;
    } catch (evErr) {
      evaluateError =
        evErr instanceof Error ? evErr.message : String(evErr);
      ctx.log?.("debug", "Mobile evaluate failed", { error: evaluateError });
    }

    if (wantScreenshot && !navigationError && !evaluateError) {
      try {
        screenshotBuffer = await mobilePage.screenshot({
          type: "jpeg",
          quality: 70,
          fullPage: false,
        });
      } catch (ssErr) {
        screenshotError =
          ssErr instanceof Error ? ssErr.message : String(ssErr);
        ctx.log?.("debug", "Mobile screenshot failed", {
          error: screenshotError,
        });
      }
    }
  } finally {
    await mobileContext.close().catch(() => {});
  }

  const issues: string[] = [];
  const warnings: string[] = [];
  if (!evaluateData) {
    if (navigationError) {
      issues.push("navigationFailed");
    } else if (evaluateError) {
      issues.push("evaluationFailed");
    }
  } else {
    if (!evaluateData.viewportContent) issues.push("missingViewportMeta");
    if (evaluateData.horizontalOverflow) issues.push("horizontalOverflow");
    const fic = Number(evaluateData.fontIssueCount) || 0;
    if (fic > 0) warnings.push("smallReadableFonts");
    const tic = Number(evaluateData.tapIssueCount) || 0;
    if (tic > 0) warnings.push("smallTapTargets");
    const h1Text = String(evaluateData.h1Text || "");
    if (h1Text && !evaluateData.h1AboveFold) warnings.push("h1NotAboveFold");
    if (!evaluateData.primaryNavVisible) warnings.push("primaryNavMissing");
  }

  const result: Record<string, unknown> = {
    url,
    finalUrl,
    status,
    responseTime,
    viewport: { width: w, height: h },
    userAgent: mobileUA,
    viewportMeta: evaluateData ? evaluateData.viewportContent : "",
    horizontalOverflow: Boolean(evaluateData?.horizontalOverflow),
    overflowAmount: Number(evaluateData?.overflowAmount) || 0,
    docWidth: Number(evaluateData?.docWidth) || 0,
    bodyWidth: Number(evaluateData?.bodyWidth) || 0,
    contentHeight: Number(evaluateData?.contentHeight) || 0,
    fontIssueCount: Number(evaluateData?.fontIssueCount) || 0,
    fontIssues: Array.isArray(evaluateData?.fontIssues)
      ? evaluateData!.fontIssues
      : [],
    tapIssueCount: Number(evaluateData?.tapIssueCount) || 0,
    tapIssues: Array.isArray(evaluateData?.tapIssues)
      ? evaluateData!.tapIssues
      : [],
    h1: {
      text: String(evaluateData?.h1Text || ""),
      visible: Boolean(evaluateData?.h1Visible),
      aboveFold: Boolean(evaluateData?.h1AboveFold),
    },
    primaryNav: {
      visible: Boolean(evaluateData?.primaryNavVisible),
      tag: String(evaluateData?.primaryNavTag || ""),
    },
    firstScreenText: String(evaluateData?.firstScreenText || ""),
    aboveFoldLinks: Number(evaluateData?.aboveFoldLinks) || 0,
    issues,
    warnings,
  };

  if (navigationError) {
    result.navigationError = navigationError;
  }
  if (evaluateError) {
    result.evaluationError = evaluateError;
  }

  if (wantScreenshot) {
    if (screenshotBuffer) {
      result.screenshot = {
        base64: screenshotBuffer.toString("base64"),
        mimeType: "image/jpeg",
        bytes: screenshotBuffer.byteLength,
        omitted: true,
      };
    } else if (screenshotError) {
      result.screenshotError = screenshotError;
    } else if (navigationError || evaluateError) {
      result.screenshotSkipped = navigationError
        ? "navigationFailed"
        : "evaluationFailed";
    }
  }

  ctx.log?.("debug", "Mobile render inspection finished", {
    url: finalUrl,
    status,
    overflow: Number(evaluateData?.overflowAmount) || 0,
    fontIssues: Number(evaluateData?.fontIssueCount) || 0,
    tapIssues: Number(evaluateData?.tapIssueCount) || 0,
    screenshot: screenshotBuffer ? screenshotBuffer.byteLength : 0,
  });

  return result;
}
