import OpenAI from "openai";
import type { Stream } from "openai/core/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { randomUUID } from "node:crypto";
import { loadSkillText } from "@/lib/skill";
import { BrowserSession, type BrowserLogFn } from "@/lib/playwright";
import { getEndpoint } from "@/lib/opencode";
import { TOOLS } from "@/lib/tools";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import type { Emitter } from "@/lib/sse";
import type { AuditLanguage, OpenCodeGroup } from "@/lib/types";

const MAX_ITERATIONS = 8;
const MAX_DISCOVERY_ITERATIONS = 6;
const MAX_TOKENS = 16000;
const TOOL_TIMEOUT_MS = 25000;

// OpenAI HTTP client timeout. Kept slightly above the per-step budget so the
// client abort fires first and we can attach a clear, step-aware message.
const OPENAI_TIMEOUT_MS = 120000;

// Budgets that keep the audit from running away. Values are intentionally
// pragmatic (not a 1:1 token/byte map) — they just cap the worst cases.
const PER_MODEL_WAIT_MS = 110000;        // hard cap on a single model call
const MAX_AUDIT_DURATION_MS = 300000;   // total wall-clock cap for the loop
const FINALIZE_AFTER_MS = 210000;       // switch from discovery to report writing
const MIN_FINAL_REPORT_MS = 60000;      // keep enough time for the final report
const MAX_TOOL_RESULT_BYTES = 64_000;   // per-tool result cap before model ctx
const MAX_HTML_TOOL_RESULT_BYTES = 24_000;
const MAX_TEXT_TOOL_RESULT_BYTES = 16_000;
const MAX_CONTEXT_BYTES = 1_500_000;    // total message-array bytes cap
const MAX_TOOL_CALLS = 32;
const MAX_VISIT_PAGE_CALLS = 18;
const MAX_HTML_TOOL_CALLS = 6;
const MAX_SCREENSHOT_CALLS = 3;
const MAX_INTERNAL_LINK_CALLS = 6;

// Throttling for streamed model output. Emit a status/debug event at most
// once per window so the UI gets visible progress without log spam.
const STREAM_PROGRESS_EVERY_MS = 2500;
const STREAM_PROGRESS_EVERY_CHUNKS = 20;
const textEncoder = new TextEncoder();
const SENSITIVE_QUERY_KEYS = new Set([
  "api_key",
  "apikey",
  "auth",
  "code",
  "key",
  "password",
  "secret",
  "session",
  "signature",
  "token",
]);
const STATIC_ASSET_EXT_RE = /\.(png|jpe?g|webp|gif|svg|ico|pdf|zip|mp4|webm)(?:[?#].*)?$/i;
const STATIC_SKIP_TOOLS = new Set([
  "visit_page",
  "get_rendered_html",
  "get_rendered_text",
  "take_screenshot",
]);
const HTML_TOOLS = new Set(["fetch_raw_html", "get_rendered_html", "get_rendered_text"]);

type AuditMode = "discovery" | "final";

type RunAuditParams = {
  apiKey: string;
  modelId: string;
  group: OpenCodeGroup;
  url: string;
  language: AuditLanguage;
  emit: Emitter;
  signal?: AbortSignal;
  onPhase?: (phase: string) => void;
};

type ToolError = { name: string; args: Record<string, unknown>; error: string };
type ToolStats = {
  total: number;
  visit_page: number;
  fetch_raw_html: number;
  get_rendered_html: number;
  get_rendered_text: number;
  take_screenshot: number;
  list_internal_links: number;
  check_robots_and_sitemap: number;
  denied: number;
  cacheHits: number;
  skippedStaticAssets: number;
};

function createToolStats(): ToolStats {
  return {
    total: 0,
    visit_page: 0,
    fetch_raw_html: 0,
    get_rendered_html: 0,
    get_rendered_text: 0,
    take_screenshot: 0,
    list_internal_links: 0,
    check_robots_and_sitemap: 0,
    denied: 0,
    cacheHits: 0,
    skippedStaticAssets: 0,
  };
}

function utf8Bytes(text: string): number {
  return textEncoder.encode(text).length;
}

function approxBytes(value: unknown): number {
  try {
    return utf8Bytes(JSON.stringify(value ?? null));
  } catch {
    return 0;
  }
}

function isAborted(signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted);
}

function safeTruncate(text: string, maxBytes: number): { text: string; truncated: boolean; originalBytes: number } {
  const originalBytes = utf8Bytes(text);
  if (originalBytes <= maxBytes) {
    return { text, truncated: false, originalBytes };
  }
  const note = `\n\n... [truncated from ${originalBytes} bytes before model context]`;
  const targetBytes = Math.max(0, maxBytes - utf8Bytes(note));
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (utf8Bytes(text.slice(0, mid)) <= targetBytes) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  const head = text.slice(0, low);
  return { text: head + note, truncated: true, originalBytes };
}

function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, "[redacted]");
      }
    }
    return url.toString();
  } catch {
    return value;
  }
}

function redactArgs(args: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      redacted[key] = "[redacted]";
    } else if (typeof value === "string") {
      redacted[key] = redactUrl(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function buildFinalReportMessage(language: AuditLanguage): ChatCompletionMessageParam {
  return {
    role: "user",
    content:
      language === "ru"
        ? "Больше не вызывай инструменты. Сформируй ИТОГОВЫЙ SEO-аудит сейчас, используя только уже собранные доказательства. Следуй обязательному шаблону отчёта из системного промпта. Если данных не хватает, явно укажи ограничение и не выдумывай факты."
        : "Stop calling tools. Produce the FINAL SEO audit report now using only the evidence already collected. Follow the required report template from the system prompt. If evidence is incomplete, state the limitation clearly and do not invent facts.",
  };
}

function toolCacheKey(name: string, args: Record<string, unknown>): string {
  return `${name}:${JSON.stringify(args)}`;
}

function isStaticAssetToolCall(name: string, args: Record<string, unknown>): boolean {
  if (!STATIC_SKIP_TOOLS.has(name)) return false;
  const url = args.url;
  return typeof url === "string" && STATIC_ASSET_EXT_RE.test(url);
}

function countHtmlToolCalls(stats: ToolStats): number {
  return stats.fetch_raw_html + stats.get_rendered_html + stats.get_rendered_text;
}

function canRunTool(name: string, stats: ToolStats): { ok: boolean; reason?: string } {
  if (stats.total >= MAX_TOOL_CALLS) {
    return { ok: false, reason: `total tool budget exhausted (${stats.total}/${MAX_TOOL_CALLS})` };
  }
  if (name === "visit_page" && stats.visit_page >= MAX_VISIT_PAGE_CALLS) {
    return { ok: false, reason: `visit_page budget exhausted (${stats.visit_page}/${MAX_VISIT_PAGE_CALLS})` };
  }
  if (HTML_TOOLS.has(name) && countHtmlToolCalls(stats) >= MAX_HTML_TOOL_CALLS) {
    return { ok: false, reason: `HTML/text tool budget exhausted (${countHtmlToolCalls(stats)}/${MAX_HTML_TOOL_CALLS})` };
  }
  if (name === "take_screenshot" && stats.take_screenshot >= MAX_SCREENSHOT_CALLS) {
    return { ok: false, reason: `screenshot budget exhausted (${stats.take_screenshot}/${MAX_SCREENSHOT_CALLS})` };
  }
  if (name === "list_internal_links" && stats.list_internal_links >= MAX_INTERNAL_LINK_CALLS) {
    return { ok: false, reason: `internal link budget exhausted (${stats.list_internal_links}/${MAX_INTERNAL_LINK_CALLS})` };
  }
  return { ok: true };
}

function recordToolCall(name: string, stats: ToolStats): void {
  stats.total += 1;
  if (name in stats && name !== "total" && name !== "denied" && name !== "cacheHits" && name !== "skippedStaticAssets") {
    stats[name as keyof Omit<ToolStats, "total" | "denied" | "cacheHits" | "skippedStaticAssets">] += 1;
  }
}

function shouldFinalize(params: {
  iterations: number;
  elapsedMs: number;
  remainingMs: number;
  stats: ToolStats;
}): { yes: boolean; reason?: string } {
  const { iterations, elapsedMs, remainingMs, stats } = params;
  if (iterations >= MAX_DISCOVERY_ITERATIONS) {
    return { yes: true, reason: `max discovery iterations reached (${iterations}/${MAX_DISCOVERY_ITERATIONS})` };
  }
  if (elapsedMs >= FINALIZE_AFTER_MS) {
    return { yes: true, reason: `finalize-after time reached (${elapsedMs}/${FINALIZE_AFTER_MS}ms)` };
  }
  if (remainingMs <= MIN_FINAL_REPORT_MS) {
    return { yes: true, reason: `only ${remainingMs}ms remaining for final report` };
  }
  if (stats.total >= MAX_TOOL_CALLS) {
    return { yes: true, reason: `total tool budget exhausted (${stats.total}/${MAX_TOOL_CALLS})` };
  }
  if (stats.visit_page >= MAX_VISIT_PAGE_CALLS) {
    return { yes: true, reason: `visit_page budget exhausted (${stats.visit_page}/${MAX_VISIT_PAGE_CALLS})` };
  }
  if (countHtmlToolCalls(stats) >= MAX_HTML_TOOL_CALLS) {
    return { yes: true, reason: `HTML/text tool budget exhausted (${countHtmlToolCalls(stats)}/${MAX_HTML_TOOL_CALLS})` };
  }
  if (stats.take_screenshot >= MAX_SCREENSHOT_CALLS) {
    return { yes: true, reason: `screenshot budget exhausted (${stats.take_screenshot}/${MAX_SCREENSHOT_CALLS})` };
  }
  if (stats.list_internal_links >= MAX_INTERNAL_LINK_CALLS) {
    return { yes: true, reason: `internal link budget exhausted (${stats.list_internal_links}/${MAX_INTERNAL_LINK_CALLS})` };
  }
  return { yes: false };
}

/**
 * Cap a tool result before it is appended to the model context. Screenshots
 * are a special case: the full base64 is intentionally NOT sent to the model
 * by default; we keep the bytes count and a compact "omitted" marker so the
 * model knows a screenshot was taken without paying its token cost.
 */
function shapeToolResult(
  name: string,
  result: unknown
): { content: string; bytes: number; truncated: boolean; omittedScreenshot: boolean } {
  let payload: unknown = result;
  let omittedScreenshot = false;

  if (name === "take_screenshot" && result && typeof result === "object") {
    const r = result as { base64?: string; mimeType?: string; bytes?: number };
    payload = {
      mimeType: r.mimeType ?? "image/jpeg",
      bytes: r.bytes ?? (typeof r.base64 === "string" ? r.base64.length : 0),
      omitted: true,
      reason: "screenshot omitted from model context; refer to debug log for size",
    };
    omittedScreenshot = true;
  }

  const json = JSON.stringify(payload);
  const cap = name === "get_rendered_text"
    ? MAX_TEXT_TOOL_RESULT_BYTES
    : name === "fetch_raw_html" || name === "get_rendered_html"
      ? MAX_HTML_TOOL_RESULT_BYTES
      : MAX_TOOL_RESULT_BYTES;
  const jsonBytes = utf8Bytes(json);
  if (jsonBytes <= cap) {
    return { content: json, bytes: jsonBytes, truncated: false, omittedScreenshot };
  }
  const { text, truncated } = safeTruncate(json, cap);
  return { content: text, bytes: utf8Bytes(text), truncated, omittedScreenshot };
}

/**
 * Executes a single browser tool with a hard timeout, emitting progress and
 * error events. Always resolves to a JSON string suitable for a tool message.
 *
 * Tool calls share a single page, so they are invoked sequentially by the
 * caller; this function never overlaps work on the browser.
 */
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  browser: BrowserSession,
  emit: Emitter,
  toolErrors: ToolError[]
): Promise<string> {
  const logArgs = redactArgs(args);
  emit("tool", { name, args: logArgs });
  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const run = async () => {
      switch (name) {
        case "visit_page":
          return await browser.visit(String(args.url));
        case "fetch_raw_html":
          return await browser.fetchRawHtml(String(args.url));
        case "get_rendered_html":
          return await browser.getRenderedHtml(args.url ? String(args.url) : undefined);
        case "get_rendered_text":
          return await browser.getRenderedText(args.url ? String(args.url) : undefined);
        case "take_screenshot":
          return await browser.takeScreenshot(args.url ? String(args.url) : undefined);
        case "list_internal_links":
          return await browser.internalLinks(String(args.url));
        case "check_robots_and_sitemap":
          return await browser.fetchRobotsAndSitemap(String(args.url));
        default:
          return { error: `Unknown tool: ${name}` };
      }
    };

    const result = await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `Tool ${name} timed out after ${TOOL_TIMEOUT_MS}ms`
              )
            ),
          TOOL_TIMEOUT_MS
        );
      }),
    ]);

    // Screenshot success: hand the full payload to the client for the gallery.
    // The model context below deliberately omits the base64 (see
    // `shapeToolResult`), so this is the only place the bytes leave the server.
    if (
      name === "take_screenshot" &&
      result &&
      typeof result === "object" &&
      !Array.isArray(result)
    ) {
      const r = result as { base64?: unknown; mimeType?: unknown; bytes?: unknown };
      if (typeof r.base64 === "string" && r.base64.length > 0) {
        const base64 = r.base64;
        const mimeType = typeof r.mimeType === "string" ? r.mimeType : "image/jpeg";
        const bytes =
          typeof r.bytes === "number"
            ? r.bytes
            : Buffer.byteLength(base64, "base64");
        const toolUrl = args.url;
        const screenshotUrl =
          typeof toolUrl === "string" && toolUrl.length > 0 ? toolUrl : undefined;
        emit("screenshot", {
          id: randomUUID(),
          url: screenshotUrl,
          mimeType,
          base64,
          bytes,
          takenAt: new Date().toISOString(),
        });
      }
    }

    const shaped = shapeToolResult(name, result);
    const fullBytes = approxBytes(result);
    if (shaped.truncated) {
      emit("status", {
        message: `Tool ${name} result truncated for model context (${shaped.bytes}B kept, ${fullBytes}B original).`,
        phase: "tools",
      });
    }
    if (shaped.omittedScreenshot) {
      emit("debug", {
        message: "Screenshot omitted from model context",
        data: { name, bytes: fullBytes, kept: shaped.bytes },
      });
    }
    emit("tool_end", {
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
      bytes: fullBytes,
    });
    return shaped.content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    toolErrors.push({ name, args, error: msg });
    emit("tool_error", { name, args: logArgs, error: msg });
    emit("tool_end", {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      bytes: approxBytes(msg),
      error: msg,
    });
    return JSON.stringify({ error: msg });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type AccumulatedToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/**
 * Drive a streaming chat.completions response: accumulate content + tool-call
 * deltas, emit throttled progress events, and return a final assistant
 * message that is compatible with the existing tool_calls loop.
 */
async function runModelStep(
  openai: OpenAI,
  modelId: string,
  messages: ChatCompletionMessageParam[],
  step: number,
  mode: AuditMode,
  requestBytes: number,
  modelWaitMs: number,
  signal: AbortSignal | undefined,
  emit: Emitter,
  setPhase: (p: string) => void
): Promise<{
  content: string;
  toolCalls: AccumulatedToolCall[];
  finishReason: string | null;
  chunkCount: number;
  firstChunkMs: number;
}> {
  const phase = mode === "final" ? "model:final report" : `model:thinking step ${step}`;
  setPhase(phase);
  emit("status", {
    message: mode === "final" ? "Writing final report..." : `Thinking step ${step}...`,
    phase,
  });
  emit("debug", {
    message: mode === "final" ? "Final report request started" : `Model request started (step ${step})`,
    data: { mode, model: modelId, messages: messages.length, requestBytes, maxTokens: MAX_TOKENS },
  });

  const startedAt = Date.now();
  const timeoutError = () =>
    new Error(
      `Model request timed out after ${modelWaitMs}ms at thinking step ${step}`
    );
  const remainingWaitMs = () => modelWaitMs - (Date.now() - startedAt);
  const requestController = new AbortController();
  const abortRequest = () => requestController.abort();
  signal?.addEventListener("abort", abortRequest, { once: true });
  const ensureBudget = () => {
    if (remainingWaitMs() <= 0) throw timeoutError();
  };
  const withModelBudget = async <T,>(promise: Promise<T>): Promise<T> => {
    ensureBudget();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            requestController.abort();
            reject(timeoutError());
          }, remainingWaitMs());
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const request = {
    model: modelId,
    messages,
    ...(mode === "discovery" ? { tools: TOOLS, tool_choice: "auto" as const } : {}),
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    stream: true as const,
    stream_options: { include_usage: true },
  };
  const stream: Stream<ChatCompletionChunk> = await withModelBudget(
    openai.chat.completions.create(request, {
      signal: requestController.signal,
      timeout: OPENAI_TIMEOUT_MS,
    })
  );

  let content = "";
  const toolCalls = new Map<number, AccumulatedToolCall>();
  let finishReason: string | null = null;
  let chunkCount = 0;
  let firstChunkMs = 0;
  let lastProgressAt = 0;
  let warnedMissingToolCallIndex = false;
  let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null;

  const emitProgress = (force = false) => {
    const now = Date.now();
    if (!force) {
      if (now - lastProgressAt < STREAM_PROGRESS_EVERY_MS) return;
      if (chunkCount % STREAM_PROGRESS_EVERY_CHUNKS !== 0) return;
    }
    lastProgressAt = now;
    setPhase(mode === "final" ? `model:final report (${chunkCount} chunks)` : `model:streaming step ${step} (${chunkCount} chunks)`);
    emit("status", {
      message: mode === "final"
        ? `Final report streaming (${chunkCount} chunks, ${content.length}B content so far)...`
        : `Model streaming step ${step} (${chunkCount} chunks, ${content.length}B content so far)...`,
      phase: mode === "final" ? "model:final report" : `model:streaming step ${step}`,
    });
  };

  const iterator = stream[Symbol.asyncIterator]();
  // Per-step hard cap. Wraps the iterator so a slow / hung model does not
  // stall the audit past the budget; we surface a step-aware error.
  const perStepTimer = setTimeout(() => {
    emit("debug", {
      message: `Per-step wait timer fired`,
      data: { step, waitMs: PER_MODEL_WAIT_MS },
    });
  }, PER_MODEL_WAIT_MS);

  try {
    while (true) {
      if (isAborted(signal)) {
        requestController.abort();
        throw new Error("aborted");
      }
      const next = await withModelBudget(iterator.next());
      if (next.done) break;
      const chunk = next.value;
      chunkCount += 1;
      if (firstChunkMs === 0) firstChunkMs = Date.now() - startedAt;

      if (chunk.usage) {
        usage = {
          prompt_tokens: chunk.usage.prompt_tokens,
          completion_tokens: chunk.usage.completion_tokens,
          total_tokens: chunk.usage.total_tokens,
        };
      }

      for (const choice of chunk.choices) {
        const delta = choice.delta;
        if (delta?.content) {
          content += delta.content;
        }
      if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index === undefined && !warnedMissingToolCallIndex) {
              warnedMissingToolCallIndex = true;
              emit("debug", {
                message: "Model streamed a tool_call delta without index",
                data: { step, id: tc.id },
              });
            }
            const idx = tc.index ?? 0;
            const existing =
              toolCalls.get(idx) ??
              { id: "", type: "function" as const, function: { name: "", arguments: "" } };
            if (tc.id) existing.id = tc.id;
            if (tc.type) existing.type = "function";
            if (tc.function?.name) existing.function.name += tc.function.name;
            if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
            toolCalls.set(idx, existing);
          }
        }
        if (choice.finish_reason) {
          finishReason = choice.finish_reason;
        }
      }

      ensureBudget();
      emitProgress(false);
    }
  } finally {
    clearTimeout(perStepTimer);
    signal?.removeEventListener("abort", abortRequest);
  }

  if (firstChunkMs === 0) {
    throw new Error(`Model returned no chunks at thinking step ${step}`);
  }

  emitProgress(true);
  const durationMs = Date.now() - startedAt;
  const ordered = Array.from(toolCalls.values())
    .filter((tc) => tc.id && tc.function.name)
    .map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: { name: tc.function.name, arguments: tc.function.arguments || "{}" },
    }));

  emit("debug", {
    message: mode === "final" ? "Final report request finished" : `Model request finished (step ${step})`,
    data: {
      mode,
      durationMs,
      firstChunkMs,
      chunks: chunkCount,
      finishReason,
      toolCalls: ordered.length,
      contentBytes: content.length,
      usage,
    },
  });

  return { content, toolCalls: ordered, finishReason, chunkCount, firstChunkMs };
}

/**
 * Runs the full audit agent loop: load skill -> build prompts -> iteratively
 * call the model, executing any tool calls against the browser, until a final
 * report is produced or the iteration cap is reached. Progress is streamed via
 * the provided emitter. Owns the browser lifecycle.
 */
export async function runAudit({
  apiKey,
  modelId,
  group,
  url,
  language,
  emit,
  signal,
  onPhase,
}: RunAuditParams): Promise<void> {
  const browserLog: BrowserLogFn = (level, message, data) => {
    if (level === "error") {
      emit("error", { message });
    } else if (level === "debug") {
      emit("debug", { message, data });
    } else {
      emit("status", { message });
    }
  };
  const browser = new BrowserSession({ onLog: browserLog });
  const toolErrors: ToolError[] = [];
  const toolStats = createToolStats();
  const toolCache = new Map<string, string>();
  let iterations = 0;
  let mode: AuditMode = "discovery";
  let reportDone = false;

  const setPhase = (phase: string) => {
    try {
      onPhase?.(phase);
    } catch {
      // Phase callbacks must never break the audit.
    }
  };
  setPhase("init");

  const auditStartedAt = Date.now();
  const auditBudgetTimer = setTimeout(() => {
    const elapsed = Date.now() - auditStartedAt;
    emit("debug", {
      message: `Audit duration budget timer fired`,
      data: { elapsedMs: elapsed, maxMs: MAX_AUDIT_DURATION_MS },
    });
  }, MAX_AUDIT_DURATION_MS);

  try {
    if (isAborted(signal)) {
      emit("error", { message: "Audit aborted before start" });
      return;
    }

    emit("status", { message: "Loading SEO audit skill...", phase: "skill" });
    setPhase("skill");
    const skillText = await loadSkillText();

    emit("status", { message: "Starting headless Chromium...", phase: "browser:start" });
    setPhase("browser:start");
    await browser.start();

    const messages: ChatCompletionMessageParam[] = [
      buildSystemPrompt(skillText, language),
      buildUserPrompt(url, language),
    ];

    const openai = new OpenAI({
      apiKey,
      baseURL: getEndpoint(group),
      timeout: OPENAI_TIMEOUT_MS,
    });

    let finalMessageAdded = false;
    while (iterations < MAX_ITERATIONS) {
      if (isAborted(signal)) {
        emit("error", { message: "Audit aborted by client" });
        return;
      }
      const elapsedMs = Date.now() - auditStartedAt;
      const remainingMs = MAX_AUDIT_DURATION_MS - elapsedMs;
      if (remainingMs <= 0) {
        emit("error", {
          message: `Audit stopped by time budget after ${iterations} step(s), ${toolStats.total} tool(s), ${elapsedMs}ms elapsed. No final report was produced.`,
        });
        emit("debug", {
          message: "Audit stopped without final report",
          data: { iterations, elapsedMs, toolStats },
        });
        return;
      }

      if (mode === "discovery") {
        const decision = shouldFinalize({ iterations, elapsedMs, remainingMs, stats: toolStats });
        if (decision.yes) {
          mode = "final";
          emit("status", {
            message: `Switching to final report mode: ${decision.reason}`,
            phase: "report",
          });
          emit("debug", {
            message: "Tool budget state",
            data: { reason: decision.reason, iterations, elapsedMs, remainingMs, toolStats },
          });
        }
      }

      if (mode === "final" && !finalMessageAdded) {
        messages.push(buildFinalReportMessage(language));
        finalMessageAdded = true;
      }

      iterations += 1;
      setPhase(mode === "final" ? "model:final report" : `model:thinking step ${iterations}`);

      const requestBytes = approxBytes({ messages, tools: mode === "discovery" ? TOOLS.length : 0 });
      if (requestBytes > MAX_CONTEXT_BYTES) {
        emit("error", {
          message: `Aborting: model context would be ${requestBytes}B (max ${MAX_CONTEXT_BYTES}B)`,
        });
        return;
      }
      const remainingAuditMs = MAX_AUDIT_DURATION_MS - (Date.now() - auditStartedAt);
      const modelWaitMs = Math.min(PER_MODEL_WAIT_MS, Math.max(1, remainingAuditMs));

      const { content, toolCalls, finishReason } = await runModelStep(
        openai,
        modelId,
        messages,
        iterations,
        mode,
        requestBytes,
        modelWaitMs,
        signal,
        emit,
        setPhase
      );

      // No usable response: surface a step-aware error and stop.
      if (!content && toolCalls.length === 0) {
        const reason = finishReason ? ` (finish_reason=${finishReason})` : "";
        emit("error", {
          message: mode === "final"
            ? `Empty final report response${reason}`
            : `Empty model response at thinking step ${iterations}${reason}`,
        });
        break;
      }

      if (mode === "final") {
        if (content) {
          setPhase("report");
          emit("status", { message: "Generating final report...", phase: "report" });
          emit("done", { report: content });
          reportDone = true;
          break;
        }
        emit("error", {
          message: "Final report mode produced no report content.",
        });
        break;
      }

      // The model wants to call one or more tools. Execute them sequentially
      // because they share a single page instance.
      if (toolCalls.length > 0) {
        // Push the assistant message in the shape the API expects so the
        // tool/tool message pairing is valid on the next iteration.
        messages.push({
          role: "assistant",
          content: content || null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        });
        emit("status", {
          message: `Executing ${toolCalls.length} tool call(s)...`,
          phase: "tools",
        });
        setPhase("tools");
        const toolResults: { role: "tool"; tool_call_id: string; content: string }[] = [];
        for (const toolCall of toolCalls) {
          if (isAborted(signal)) {
            emit("error", { message: "Audit aborted by client" });
            return;
          }
          if (Date.now() - auditStartedAt > MAX_AUDIT_DURATION_MS) {
            emit("error", {
              message: `Audit aborted: exceeded total duration budget of ${MAX_AUDIT_DURATION_MS}ms`,
            });
            return;
          }
          let args: Record<string, unknown>;
          try {
            args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
          } catch (parseErr) {
            const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
            toolErrors.push({ name: toolCall.function.name, args: {}, error: `Invalid JSON args: ${msg}` });
            toolResults.push({
              role: "tool" as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: `Invalid JSON args: ${msg}` }),
            });
            continue;
          }

          if (isStaticAssetToolCall(toolCall.function.name, args)) {
            toolStats.skippedStaticAssets += 1;
            const skipped = JSON.stringify({
              skipped: true,
              reason: "Static asset URL skipped by audit policy",
              url: typeof args.url === "string" ? args.url : undefined,
            });
            emit("debug", {
              message: "Tool skipped for static asset URL",
              data: { name: toolCall.function.name, args: redactArgs(args) },
            });
            emit("tool_end", {
              name: toolCall.function.name,
              ok: true,
              durationMs: 0,
              bytes: approxBytes(skipped),
            });
            toolResults.push({ role: "tool" as const, tool_call_id: toolCall.id, content: skipped });
            continue;
          }

          const cacheKey = toolCacheKey(toolCall.function.name, args);
          const cached = toolCache.get(cacheKey);
          if (cached) {
            toolStats.cacheHits += 1;
            emit("debug", {
              message: "Tool cache hit",
              data: { name: toolCall.function.name, args: redactArgs(args) },
            });
            emit("tool_end", {
              name: toolCall.function.name,
              ok: true,
              durationMs: 0,
              bytes: utf8Bytes(cached),
            });
            toolResults.push({ role: "tool" as const, tool_call_id: toolCall.id, content: cached });
            continue;
          }

          const budget = canRunTool(toolCall.function.name, toolStats);
          if (!budget.ok) {
            toolStats.denied += 1;
            const denied = JSON.stringify({
              error: `Tool call skipped: ${budget.reason}. Continue to final report using collected evidence.`,
            });
            emit("status", {
              message: `Denied ${toolCall.function.name}: ${budget.reason}`,
              phase: "tools",
            });
            emit("debug", {
              message: "Tool call denied by budget",
              data: { name: toolCall.function.name, reason: budget.reason, toolStats },
            });
            toolResults.push({ role: "tool" as const, tool_call_id: toolCall.id, content: denied });
            continue;
          }

          recordToolCall(toolCall.function.name, toolStats);
          emit("debug", {
            message: "Tool budget",
            data: { used: toolStats.total, max: MAX_TOOL_CALLS, toolStats },
          });
          const content = await executeTool(
            toolCall.function.name,
            args,
            browser,
            emit,
            toolErrors
          );
          toolCache.set(cacheKey, content);
          toolResults.push({ role: "tool" as const, tool_call_id: toolCall.id, content });
        }
        messages.push(...toolResults);

        // Re-check the context budget after appending tool results.
        const afterBytes = approxBytes(messages);
        if (afterBytes > MAX_CONTEXT_BYTES) {
          emit("error", {
            message: `Aborting: model context grew to ${afterBytes}B (max ${MAX_CONTEXT_BYTES}B)`,
          });
          return;
        }
        continue;
      }

      // The model produced the final report.
      if (content) {
        setPhase("report");
        emit("status", { message: "Generating final report...", phase: "report" });
        emit("done", { report: content });
        reportDone = true;
        break;
      }

      emit("error", {
        message: `Empty model response at thinking step ${iterations}`,
      });
      break;
    }

    if (!reportDone && iterations >= MAX_ITERATIONS) {
      emit("error", {
        message: "Stopped after maximum number of tool-call rounds.",
      });
    }

    if (toolErrors.length > 0) {
      emit("status", {
        message: `Audit completed with ${toolErrors.length} tool error(s). See details in the report.`,
      });
    }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // Make timeout / abort errors from the OpenAI client specific to the step.
    const lower = raw.toLowerCase();
    const stepMatch = raw.match(/at thinking step (\d+)/i);
    const stepSuffix = stepMatch ? ` ${stepMatch[1]}` : "";
    if (lower.includes("aborted")) {
      emit("error", {
        message: `Audit aborted at thinking step${stepSuffix} (client disconnect)`,
      });
    } else if (
      lower.includes("timeout") ||
      lower.includes("timed out") ||
      lower.includes("etimedout") ||
      lower.includes("aborterror")
    ) {
      emit("error", {
        message: raw.includes("Model request timed out")
          ? raw
          : `Model request timed out after ${PER_MODEL_WAIT_MS}ms at thinking step${stepSuffix}`,
      });
      emit("debug", {
        message: "Audit timeout stats",
        data: {
          iterations,
          elapsedMs: Date.now() - auditStartedAt,
          toolStats,
          mode,
          reportDone,
        },
      });
    } else {
      emit("error", { message: raw });
    }
    emit("debug", {
      message: "runAudit caught error",
      data: { message: raw, name: err instanceof Error ? err.name : undefined },
    });
  } finally {
    clearTimeout(auditBudgetTimer);
    await browser.close();
  }
}
