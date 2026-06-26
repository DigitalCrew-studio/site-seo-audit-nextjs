import OpenAI from "openai";
import type { Stream } from "openai/core/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { randomUUID } from "node:crypto";
import { loadSkillText } from "@/lib/skill";
import { BrowserSession, type BrowserLogFn } from "@/lib/playwright";
import { getEndpoint } from "@/lib/opencode";
import { TOOLS } from "@/lib/tools";
import { buildSystemPrompt } from "@/lib/prompts";
import type { Emitter } from "@/lib/sse";
import type { AuditLanguage, OpenCodeGroup } from "@/lib/types";

const MAX_TOKENS = 16000;
const MAX_FINAL_TOKENS = 8000;
const MAX_EMERGENCY_FINAL_TOKENS = 4000;
const MAX_FINAL_CONTINUATIONS = 3;
const FINAL_REPORT_END_MARKER = "END_OF_AUDIT_REPORT";
const FINAL_CONTINUATION_CONTEXT_CHARS = 12_000;
const TOOL_TIMEOUT_MS = 25000;

// Long local Docker runs should behave like a CLI: do not abort an active
// stream just because it has been running for a while. These are idle/network
// safeguards, not output-length caps.
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 1_800_000);

// Budgets that keep the audit from running away. Values are intentionally
// pragmatic (not a 1:1 token/byte map) — they just cap the worst cases.
const PER_MODEL_WAIT_MS = Number(process.env.MODEL_IDLE_TIMEOUT_MS ?? 180_000);
const PER_FINAL_MODEL_WAIT_MS = 110000;  // final reports are long; partials continue instead of being accepted
const PER_EMERGENCY_FINAL_MODEL_WAIT_MS = 60000;
const MAX_AUDIT_DURATION_MS = Number(process.env.AUDIT_MAX_DURATION_MS ?? 0);
const FINALIZE_AFTER_MS = 150000;       // switch from discovery to report writing
const MIN_FINAL_REPORT_MS = 100000;     // keep enough time for the final report
const MAX_TOOL_RESULT_BYTES = 64_000;   // per-tool result cap before model ctx
const MAX_HTML_TOOL_RESULT_BYTES = 10_000;
const MAX_TEXT_TOOL_RESULT_BYTES = 10_000;
const MAX_CONTEXT_BYTES = 1_500_000;    // total message-array bytes cap
const MAX_TOOL_CALLS = 24;
const MAX_VISIT_PAGE_CALLS = 1;
const MAX_INSPECT_PAGE_CALLS = 6;
const MAX_HTML_TOOL_CALLS = 2;
const MAX_SCREENSHOT_CALLS = 3;
const MAX_INTERNAL_LINK_CALLS = 1;
const MAX_INSPECT_HTTP_CALLS = 4;
const MAX_PARSE_SITEMAP_CALLS = 2;
const MAX_EXTRACT_STRUCTURED_DATA_CALLS = 3;
const MAX_INSPECT_SOCIAL_PREVIEW_CALLS = 3;
const MAX_INSPECT_HREFLANG_CALLS = 2;
const MAX_RESOURCE_INVENTORY_CALLS = 2;
const MAX_RUN_LIGHTHOUSE_CALLS = 2;
const MAX_INSPECT_MOBILE_RENDERING_CALLS = 2;
const MAX_INSPECT_RESPONSIVE_RENDERING_CALLS = 3;
const MAX_INSPECT_ANALYTICS_TAGS_CALLS = 2;
const MAX_CHECK_LINK_HEALTH_CALLS = 2;
const MAX_CRAWL_SITE_SAMPLE_CALLS = 1;
const MAX_INSPECT_LLMS_TXT_CALLS = 1;
const MAX_INSPECT_ENTITY_TRUST_CALLS = 2;
const MAX_DNS_AND_SECURITY_CHECK_CALLS = 2;
const MAX_ANALYZE_UPLOADED_AUDIT_REPORT_CALLS = 2;
const MAX_ANALYZE_BACKLINK_EXPORT_CALLS = 2;
const MAX_BATCH_CHECK_URLS_CALLS = 2;
const MAX_REPORT_TEXT_CHARS = 200_000;
const MIN_USABLE_FINAL_REPORT_CHARS = 500;

// New pipeline caps: deterministic preflight runs all of the calls below, then
// the model may request up to MAX_FOLLOWUP_TOOL_CALLS additional tools.
const MAX_FOLLOWUP_TOOL_CALLS = 5;
const EVIDENCE_RESULT_MAX_BYTES = 2000;
const MAX_EVIDENCE_ERROR_CHARS = 200;

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
  "inspect_page_seo",
  "get_rendered_html",
  "get_rendered_text",
  "take_screenshot",
  "extract_structured_data",
  "inspect_social_preview",
  "inspect_mobile_rendering",
  "inspect_responsive_rendering",
  "inspect_analytics_tags",
  "crawl_site_sample",
  "inspect_entity_trust",
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
  inspect_page_seo: number;
  fetch_raw_html: number;
  get_rendered_html: number;
  get_rendered_text: number;
  take_screenshot: number;
  list_internal_links: number;
  check_robots_and_sitemap: number;
  inspect_http: number;
  parse_sitemap: number;
  extract_structured_data: number;
  inspect_social_preview: number;
  inspect_hreflang: number;
  resource_inventory: number;
  run_lighthouse: number;
  inspect_mobile_rendering: number;
  inspect_responsive_rendering: number;
  inspect_analytics_tags: number;
  check_link_health: number;
  crawl_site_sample: number;
  inspect_llms_txt: number;
  inspect_entity_trust: number;
  dns_and_security_check: number;
  analyze_uploaded_audit_report: number;
  analyze_backlink_export: number;
  batch_check_urls: number;
  denied: number;
  cacheHits: number;
  skippedStaticAssets: number;
};

function createToolStats(): ToolStats {
  return {
    total: 0,
    visit_page: 0,
    inspect_page_seo: 0,
    fetch_raw_html: 0,
    get_rendered_html: 0,
    get_rendered_text: 0,
    take_screenshot: 0,
    list_internal_links: 0,
    check_robots_and_sitemap: 0,
    inspect_http: 0,
    parse_sitemap: 0,
    extract_structured_data: 0,
    inspect_social_preview: 0,
    inspect_hreflang: 0,
    resource_inventory: 0,
    run_lighthouse: 0,
    inspect_mobile_rendering: 0,
    inspect_responsive_rendering: 0,
    inspect_analytics_tags: 0,
    check_link_health: 0,
    crawl_site_sample: 0,
    inspect_llms_txt: 0,
    inspect_entity_trust: 0,
    dns_and_security_check: 0,
    analyze_uploaded_audit_report: 0,
    analyze_backlink_export: 0,
    batch_check_urls: 0,
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

function auditHasTimeBudget(): boolean {
  return Number.isFinite(MAX_AUDIT_DURATION_MS) && MAX_AUDIT_DURATION_MS > 0;
}

function remainingAuditMs(startedAt: number): number {
  return auditHasTimeBudget()
    ? MAX_AUDIT_DURATION_MS - (Date.now() - startedAt)
    : Number.POSITIVE_INFINITY;
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

function reportHeading(language: AuditLanguage): string {
  return language === "ru" ? "# SEO-диагностика:" : "# SEO diagnostic:";
}

function buildFinalReportMessage(language: AuditLanguage): ChatCompletionMessageParam {
  const heading = reportHeading(language);
  return {
    role: "user",
    content:
      language === "ru"
        ? `Больше не вызывай инструменты. Сформируй ИТОГОВЫЙ ДИАГНОСТИЧЕСКИЙ SEO-аудит сейчас, используя только уже собранные доказательства. Следуй обязательному диагностическому шаблону из системного промпта: все видимые заголовки, заголовки таблиц, метки статусов и категории скоркарда — на русском языке. Обязательно заполни матрицу охвата проверок (Проверено / Частично / Не оценено / Требует данных) и используй текстовые шкалы для Lighthouse / Core Web Vitals. Без roadmap, рекомендаций по исправлению, владельцев и сроков. Если данных не хватает, явно укажи ограничение и не выдумывай факты. Не выводи рассуждения, chain-of-thought, <think>, скрытые заметки или markdown code fence. Начни сразу с "${heading}". В конце полного отчёта отдельной последней строкой выведи ${FINAL_REPORT_END_MARKER}. Если не успеваешь закончить, не выводи этот маркер.`
        : `Stop calling tools. Produce the FINAL DIAGNOSTIC SEO audit now using only the evidence already collected. Follow the required diagnostic template from the system prompt: every visible heading, table header, status label, and scorecard category label MUST be in English. Make sure you fill the Check coverage matrix (Checked / Partially checked / Not assessed / Requires data) and use textual gauges for Lighthouse / Core Web Vitals. No roadmap, recommended fixes, owners, or timelines. If evidence is incomplete, state the limitation clearly and do not invent facts. Do not output reasoning, chain-of-thought, <think>, hidden notes, or a markdown code fence. Start directly with "${heading}". End the complete report with ${FINAL_REPORT_END_MARKER} on its own final line. If you cannot finish, do not output this marker.`,
  };
}

function buildEmergencyFinalReportMessage(language: AuditLanguage): ChatCompletionMessageParam {
  const heading = reportHeading(language);
  return {
    role: "user",
    content:
      language === "ru"
        ? `Предыдущая попытка итогового отчёта не завершилась корректно. Немедленно верни компактный, но полноценный ДИАГНОСТИЧЕСКИЙ SEO-аудит по обязательным секциям шаблона. Все видимые заголовки, заголовки таблиц, метки статусов и категории скоркарда — на русском языке. Обязательно включи матрицу охвата проверок и таблицу основных SEO-рисков. Без roadmap, рекомендаций по исправлению, владельцев и сроков. Не используй инструменты. Не выводи <think>, рассуждения, преамбулу или code fence. Начни с "${heading}". Ограничься самыми важными проверенными находками и явно пометь непроверенное как «Не оценено». В конце полного отчёта отдельной последней строкой выведи ${FINAL_REPORT_END_MARKER}.`
        : `The previous final-report attempt did not complete cleanly. Immediately return a compact but complete DIAGNOSTIC SEO audit using the required template sections. Every visible heading, table header, status label, and scorecard category label MUST be in English. Make sure to include the Check coverage matrix and the Main SEO risks table. No roadmap, recommended fixes, owners, or timelines. Do not call tools. Do not output <think>, reasoning, preamble, or a code fence. Start with "${heading}". Limit the report to the most important verified findings and mark unverified areas as "Not assessed". End the complete report with ${FINAL_REPORT_END_MARKER} on its own final line.`,
  };
}

function buildContinueFinalReportMessage(language: AuditLanguage): ChatCompletionMessageParam {
  return {
    role: "user",
    content:
      language === "ru"
        ? `Продолжи итоговый ДИАГНОСТИЧЕСКИЙ SEO-аудит ровно с места, где он оборвался. Не повторяй уже написанные секции, заголовок отчёта или преамбулу. Не используй инструменты. Не выводи <think>, рассуждения или code fence. Пиши компактно: заверши только недостающие строки/секции, затем обязательно добавь короткое «Финальное заключение», если его ещё нет. Когда полный отчёт закончен, ОБЯЗАТЕЛЬНО выведи ${FINAL_REPORT_END_MARKER} отдельной последней строкой. Если содержательно продолжать нечего, сразу выведи недостающее финальное заключение и ${FINAL_REPORT_END_MARKER}.`
        : `Continue the final DIAGNOSTIC SEO audit exactly from where it stopped. Do not repeat already written sections, the report title, or any preamble. Do not call tools. Do not output <think>, reasoning, or a code fence. Write compactly: finish only the missing rows/sections, then add a short "Final conclusion" if it is not already present. When the complete report is finished, you MUST output ${FINAL_REPORT_END_MARKER} on its own final line. If there is nothing meaningful left to add, immediately output the missing final conclusion and ${FINAL_REPORT_END_MARKER}.`,
  };
}

function buildFinalContinuationMessages(
  language: AuditLanguage,
  reportSoFar: string
): ChatCompletionMessageParam[] {
  const tail = reportSoFar.length > FINAL_CONTINUATION_CONTEXT_CHARS
    ? reportSoFar.slice(-FINAL_CONTINUATION_CONTEXT_CHARS)
    : reportSoFar;
  return [
    {
      role: "system",
      content: language === "ru"
        ? `Ты завершаешь уже начатый диагностический SEO-отчёт. Инструменты недоступны. Не повторяй существующий текст. Все видимые заголовки, заголовки таблиц, статусы и подписи — на русском языке. Без roadmap, рекомендаций по исправлению, владельцев, сроков и бэклога. Итоговый полный отчёт должен закончиться строкой ${FINAL_REPORT_END_MARKER}.`
        : `You are finishing an already-started diagnostic SEO report. Tools are unavailable. Do not repeat existing text. Every visible heading, table header, status, and label must be in English. No roadmap, recommended fixes, owners, timelines, or backlog. The complete final report must end with ${FINAL_REPORT_END_MARKER}.`,
    },
    {
      role: "assistant",
      content: tail,
    },
    buildContinueFinalReportMessage(language),
  ];
}

function sanitizeFinalReport(content: string): string {
  let out = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/^[\s\S]*?<\/think>/i, "")
    .trim();

  const fence = out.match(/^```(?:md|markdown)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (fence?.[1]) out = fence[1].trim();
  out = out.replace(/^markdown\s*\n/i, "").trim();
  return out;
}

function hasFinalReportEndMarker(content: string): boolean {
  return new RegExp(`(?:^|\\n)\\s*${FINAL_REPORT_END_MARKER}\\s*$`).test(content.trim());
}

function stripFinalReportEndMarker(content: string): string {
  return content
    .replace(new RegExp(`\\n?\\s*${FINAL_REPORT_END_MARKER}\\s*$`), "")
    .trim();
}

function finalReportNeedsContinuation(content: string, finishReason: string | null): boolean {
  return (
    finishReason === "length" ||
    finishReason === "timeout_partial" ||
    finishReason === "timeout_unusable_partial" ||
    !hasFinalReportEndMarker(content)
  );
}

function isUsableFinalReport(content: string): boolean {
  const sanitized = sanitizeFinalReport(content);
  return (
    sanitized.length >= MIN_USABLE_FINAL_REPORT_CHARS &&
    /SEO Audit Report|SEO-аудит|SEO-диагностика|SEO diagnostic|Scorecard|Скоркард|Coverage matrix|Матрица охвата|Executive conclusion|Исполнительное заключение/i.test(sanitized)
  );
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
  if (name === "inspect_page_seo" && stats.inspect_page_seo >= MAX_INSPECT_PAGE_CALLS) {
    return { ok: false, reason: `inspect_page_seo budget exhausted (${stats.inspect_page_seo}/${MAX_INSPECT_PAGE_CALLS})` };
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
  if (name === "inspect_http" && stats.inspect_http >= MAX_INSPECT_HTTP_CALLS) {
    return { ok: false, reason: `inspect_http budget exhausted (${stats.inspect_http}/${MAX_INSPECT_HTTP_CALLS})` };
  }
  if (name === "parse_sitemap" && stats.parse_sitemap >= MAX_PARSE_SITEMAP_CALLS) {
    return { ok: false, reason: `parse_sitemap budget exhausted (${stats.parse_sitemap}/${MAX_PARSE_SITEMAP_CALLS})` };
  }
  if (name === "extract_structured_data" && stats.extract_structured_data >= MAX_EXTRACT_STRUCTURED_DATA_CALLS) {
    return { ok: false, reason: `extract_structured_data budget exhausted (${stats.extract_structured_data}/${MAX_EXTRACT_STRUCTURED_DATA_CALLS})` };
  }
  if (name === "inspect_social_preview" && stats.inspect_social_preview >= MAX_INSPECT_SOCIAL_PREVIEW_CALLS) {
    return { ok: false, reason: `inspect_social_preview budget exhausted (${stats.inspect_social_preview}/${MAX_INSPECT_SOCIAL_PREVIEW_CALLS})` };
  }
  if (name === "inspect_hreflang" && stats.inspect_hreflang >= MAX_INSPECT_HREFLANG_CALLS) {
    return { ok: false, reason: `inspect_hreflang budget exhausted (${stats.inspect_hreflang}/${MAX_INSPECT_HREFLANG_CALLS})` };
  }
  if (name === "resource_inventory" && stats.resource_inventory >= MAX_RESOURCE_INVENTORY_CALLS) {
    return { ok: false, reason: `resource_inventory budget exhausted (${stats.resource_inventory}/${MAX_RESOURCE_INVENTORY_CALLS})` };
  }
  if (name === "run_lighthouse" && stats.run_lighthouse >= MAX_RUN_LIGHTHOUSE_CALLS) {
    return { ok: false, reason: `run_lighthouse budget exhausted (${stats.run_lighthouse}/${MAX_RUN_LIGHTHOUSE_CALLS})` };
  }
  if (name === "inspect_mobile_rendering" && stats.inspect_mobile_rendering >= MAX_INSPECT_MOBILE_RENDERING_CALLS) {
    return { ok: false, reason: `inspect_mobile_rendering budget exhausted (${stats.inspect_mobile_rendering}/${MAX_INSPECT_MOBILE_RENDERING_CALLS})` };
  }
  if (name === "inspect_responsive_rendering" && stats.inspect_responsive_rendering >= MAX_INSPECT_RESPONSIVE_RENDERING_CALLS) {
    return { ok: false, reason: `inspect_responsive_rendering budget exhausted (${stats.inspect_responsive_rendering}/${MAX_INSPECT_RESPONSIVE_RENDERING_CALLS})` };
  }
  if (name === "inspect_analytics_tags" && stats.inspect_analytics_tags >= MAX_INSPECT_ANALYTICS_TAGS_CALLS) {
    return { ok: false, reason: `inspect_analytics_tags budget exhausted (${stats.inspect_analytics_tags}/${MAX_INSPECT_ANALYTICS_TAGS_CALLS})` };
  }
  if (name === "check_link_health" && stats.check_link_health >= MAX_CHECK_LINK_HEALTH_CALLS) {
    return { ok: false, reason: `check_link_health budget exhausted (${stats.check_link_health}/${MAX_CHECK_LINK_HEALTH_CALLS})` };
  }
  if (name === "crawl_site_sample" && stats.crawl_site_sample >= MAX_CRAWL_SITE_SAMPLE_CALLS) {
    return { ok: false, reason: `crawl_site_sample budget exhausted (${stats.crawl_site_sample}/${MAX_CRAWL_SITE_SAMPLE_CALLS})` };
  }
  if (name === "inspect_llms_txt" && stats.inspect_llms_txt >= MAX_INSPECT_LLMS_TXT_CALLS) {
    return { ok: false, reason: `inspect_llms_txt budget exhausted (${stats.inspect_llms_txt}/${MAX_INSPECT_LLMS_TXT_CALLS})` };
  }
  if (name === "inspect_entity_trust" && stats.inspect_entity_trust >= MAX_INSPECT_ENTITY_TRUST_CALLS) {
    return { ok: false, reason: `inspect_entity_trust budget exhausted (${stats.inspect_entity_trust}/${MAX_INSPECT_ENTITY_TRUST_CALLS})` };
  }
  if (name === "dns_and_security_check" && stats.dns_and_security_check >= MAX_DNS_AND_SECURITY_CHECK_CALLS) {
    return { ok: false, reason: `dns_and_security_check budget exhausted (${stats.dns_and_security_check}/${MAX_DNS_AND_SECURITY_CHECK_CALLS})` };
  }
  if (name === "analyze_uploaded_audit_report" && stats.analyze_uploaded_audit_report >= MAX_ANALYZE_UPLOADED_AUDIT_REPORT_CALLS) {
    return { ok: false, reason: `analyze_uploaded_audit_report budget exhausted (${stats.analyze_uploaded_audit_report}/${MAX_ANALYZE_UPLOADED_AUDIT_REPORT_CALLS})` };
  }
  if (name === "analyze_backlink_export" && stats.analyze_backlink_export >= MAX_ANALYZE_BACKLINK_EXPORT_CALLS) {
    return { ok: false, reason: `analyze_backlink_export budget exhausted (${stats.analyze_backlink_export}/${MAX_ANALYZE_BACKLINK_EXPORT_CALLS})` };
  }
  if (name === "batch_check_urls" && stats.batch_check_urls >= MAX_BATCH_CHECK_URLS_CALLS) {
    return { ok: false, reason: `batch_check_urls budget exhausted (${stats.batch_check_urls}/${MAX_BATCH_CHECK_URLS_CALLS})` };
  }
  return { ok: true };
}

function recordToolCall(name: string, stats: ToolStats): void {
  stats.total += 1;
  if (name in stats && name !== "total" && name !== "denied" && name !== "cacheHits" && name !== "skippedStaticAssets") {
    stats[name as keyof Omit<ToolStats, "total" | "denied" | "cacheHits" | "skippedStaticAssets">] += 1;
  }
}

type ReportIssue = {
  title: string;
  url?: string;
  severity?: string;
  status?: string;
};

function compactSample<T>(items: T[], limit: number): T[] {
  return items.slice(0, limit);
}

function detectReportFormat(text: string): "json" | "csv" | "text" | "unknown" {
  const trimmed = text.trim();
  if (!trimmed) return "unknown";
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return "json";
  }
  const firstLines = trimmed.split(/\r?\n/).slice(0, 5);
  if (firstLines.length >= 2 && firstLines[0].includes(",") && firstLines[1].includes(",")) {
    return "csv";
  }
  return "text";
}

function normalizeScore(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value <= 1) return Math.round(value * 100);
  if (value <= 100) return Math.round(value);
  return undefined;
}

function analyzeUploadedAuditReport(reportText: string, sourceName?: string): unknown {
  const inputBytes = utf8Bytes(reportText);
  const warnings: string[] = [];
  if (!reportText.trim()) {
    return {
      sourceName,
      inputBytes,
      detectedFormat: "unknown",
      scores: {},
      urls: { count: 0, sample: [] },
      issues: { count: 0, sample: [] },
      severityCounts: {},
      toolHints: [],
      warnings: ["emptyInput", "noIssuesDetected"],
    };
  }

  const truncatedInput = reportText.length > MAX_REPORT_TEXT_CHARS;
  const text = reportText.slice(0, MAX_REPORT_TEXT_CHARS);
  if (truncatedInput) warnings.push("truncatedInput");
  const detectedFormat = detectReportFormat(text);
  const lower = text.toLowerCase();
  const toolHints = [
    ["lighthouse", /lighthouse|largest-contentful-paint|cumulative-layout-shift|total-blocking-time/i],
    ["search-console", /search console|googlebot|coverage|indexing|clicks|impressions/i],
    ["screaming-frog", /screaming frog|inlinks|outlinks|indexability|crawl depth/i],
    ["semrush", /semrush|site audit|toxic score|position tracking/i],
    ["ahrefs", /ahrefs|domain rating|organic traffic|referring domains/i],
    ["pagespeed", /pagespeed|page speed insights|field data|origin summary/i],
  ].filter(([, re]) => (re as RegExp).test(text)).map(([name]) => name as string);

  const urls = Array.from(new Set(text.match(/https?:\/\/[^\s"'<>),]+/gi) ?? [])).slice(0, 200);
  const scores: Record<string, number> = {};
  const namedScores: Record<string, number> = {};
  const issues: ReportIssue[] = [];
  const severityCounts: Record<string, number> = {};

  const addSeverity = (severity?: string) => {
    if (!severity) return;
    const key = severity.toLowerCase();
    severityCounts[key] = (severityCounts[key] ?? 0) + 1;
  };
  const addIssue = (issue: ReportIssue) => {
    const title = issue.title.trim().replace(/\s+/g, " ");
    if (!title || title.length < 4) return;
    if (issues.some((existing) => existing.title === title && existing.url === issue.url)) return;
    const severity = issue.severity?.slice(0, 40);
    addSeverity(severity);
    issues.push({
      title: title.slice(0, 180),
      url: issue.url,
      severity,
      status: issue.status?.slice(0, 40),
    });
  };

  const assignScore = (name: string, value: unknown) => {
    const score = normalizeScore(value);
    if (score === undefined) return;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!key) return;
    if (["performance", "accessibility", "best_practices", "bestpractices", "seo"].includes(key)) {
      scores[key === "bestpractices" ? "bestPractices" : key] = score;
    } else if (Object.keys(namedScores).length < 12) {
      namedScores[key] = score;
    }
  };

  let parseError: string | undefined;
  if (detectedFormat === "json") {
    try {
      const parsed = JSON.parse(text) as unknown;
      const visit = (value: unknown, path = "", depth = 0) => {
        if (depth > 5 || value == null) return;
        if (Array.isArray(value)) {
          for (const item of value.slice(0, 200)) visit(item, path, depth + 1);
          return;
        }
        if (typeof value !== "object") return;
        const obj = value as Record<string, unknown>;
        for (const [key, val] of Object.entries(obj)) {
          if (/score|performance|accessibility|best.?practices|seo/i.test(key)) assignScore(key, val);
        }
        const title = String(obj.title ?? obj.name ?? obj.issue ?? obj.audit ?? "");
        const score = normalizeScore(obj.score);
        const severity = typeof obj.severity === "string" ? obj.severity : typeof obj.level === "string" ? obj.level : undefined;
        const status = typeof obj.status === "string" ? obj.status : undefined;
        const url = typeof obj.url === "string" ? obj.url : typeof obj.href === "string" ? obj.href : undefined;
        if (title && (severity || status || score === 0 || /error|warning|issue|fail|missing|invalid/i.test(title))) {
          addIssue({ title, url, severity, status });
        }
        for (const [key, val] of Object.entries(obj)) visit(val, path ? `${path}.${key}` : key, depth + 1);
      };
      visit(parsed);
    } catch (err) {
      parseError = err instanceof Error ? err.message : String(err);
      warnings.push("parseError");
    }
  }

  const scoreRe = /\b(performance|accessibility|best\s*practices|seo|health|score)\b[^\d]{0,24}(\d{1,3})(?:\s*\/\s*100|\s*%)?/gi;
  for (const match of text.matchAll(scoreRe)) assignScore(match[1], Number(match[2]));

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase().split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")) ?? [];
  if (detectedFormat === "csv" && header.length > 1) {
    const issueIdx = header.findIndex((h) => /issue|problem|warning|error|title|name/.test(h));
    const statusIdx = header.findIndex((h) => /status|code/.test(h));
    const urlIdx = header.findIndex((h) => /^url$|address|link|page/.test(h));
    const severityIdx = header.findIndex((h) => /severity|priority|level/.test(h));
    for (const line of lines.slice(1, 301)) {
      const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
      const title = issueIdx >= 0 ? cells[issueIdx] : "";
      if (title) addIssue({ title, url: urlIdx >= 0 ? cells[urlIdx] : undefined, severity: severityIdx >= 0 ? cells[severityIdx] : undefined, status: statusIdx >= 0 ? cells[statusIdx] : undefined });
    }
  }

  for (const line of lines.slice(0, 500)) {
    if (/\b(error|warning|issue|fail(?:ed)?|missing|invalid|critical|high|medium|low)\b/i.test(line)) {
      const severity = line.match(/\b(critical|high|medium|low|error|warning)\b/i)?.[1];
      const url = line.match(/https?:\/\/[^\s"'<>),]+/i)?.[0];
      addIssue({ title: line, url, severity });
    }
  }

  if (issues.length === 0) warnings.push("noIssuesDetected");

  return {
    sourceName,
    inputBytes,
    detectedFormat,
    scores: {
      ...scores,
      namedSamples: namedScores,
    },
    urls: { count: urls.length, sample: compactSample(urls, 20) },
    issues: { count: issues.length, sample: compactSample(issues, 30) },
    severityCounts,
    toolHints,
    warnings,
    ...(parseError ? { parseError: parseError.slice(0, 200) } : {}),
    textSignals: {
      mentionsIndexing: /indexing|indexed|noindex|canonical/i.test(lower),
      mentionsCoreWebVitals: /core web vitals|lcp|cls|inp|fid|fcp/i.test(lower),
      mentionsStructuredData: /structured data|schema\.org|json-ld|rich result/i.test(lower),
    },
  };
}

function parseLooseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, ""));
}

function hostnameFromMaybeUrl(value: string): string | undefined {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return undefined;
  }
}

function analyzeBacklinkExport(exportText: string, sourceName?: string): unknown {
  const inputBytes = utf8Bytes(exportText);
  const warnings: string[] = [];
  if (!exportText.trim()) {
    return {
      sourceName,
      inputBytes,
      detectedFormat: "unknown",
      toolHints: [],
      referringDomains: { count: 0, sample: [] },
      targetUrls: { count: 0, sample: [] },
      anchors: { count: 0, top: [] },
      linkAttributes: {},
      authoritySamples: [],
      toxicSamples: [],
      suspiciousPatterns: [],
      warnings: ["emptyInput", "noBacklinksDetected"],
    };
  }

  const truncatedInput = exportText.length > MAX_REPORT_TEXT_CHARS;
  const text = exportText.slice(0, MAX_REPORT_TEXT_CHARS);
  if (truncatedInput) warnings.push("truncatedInput");
  const detectedFormat = detectReportFormat(text);
  const toolHints = [
    ["ahrefs", /ahrefs|domain rating|url rating|referring domains|traffic/i],
    ["semrush", /semrush|authority score|toxicity|toxic score|backlink audit/i],
    ["search-console", /search console|latest links|top linked pages|top linking sites/i],
    ["majestic", /majestic|trust flow|citation flow/i],
    ["moz", /moz|domain authority|page authority|spam score/i],
  ].filter(([, re]) => (re as RegExp).test(text)).map(([name]) => name as string);

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const header = detectedFormat === "csv" ? parseLooseCsvLine(lines[0] ?? "").map((cell) => cell.toLowerCase()) : [];
  const findColumn = (patterns: RegExp[]) => header.findIndex((cell) => patterns.some((pattern) => pattern.test(cell)));
  const sourceIdx = findColumn([/source|referring.*(page|url)|backlink.*url|from/]);
  const domainIdx = findColumn([/referring.*domain|source.*domain|domain/]);
  const targetIdx = findColumn([/target|destination|linked.*page|to url|landing/]);
  const anchorIdx = findColumn([/anchor/]);
  const relIdx = findColumn([/rel|link type|attribute|nofollow|follow/]);
  const statusIdx = findColumn([/status|lost|first seen|last seen/]);
  const authorityIdx = findColumn([/domain rating|domain authority|authority score|trust flow|citation flow|dr|da|as/]);
  const toxicIdx = findColumn([/toxic|toxicity|spam/]);

  const referringDomains = new Set<string>();
  const sourceUrls = new Set<string>();
  const targetUrls = new Set<string>();
  const anchorCounts = new Map<string, number>();
  const linkAttributes: Record<string, number> = { follow: 0, nofollow: 0, sponsored: 0, ugc: 0, unknown: 0 };
  const statusCounts: Record<string, number> = {};
  const authoritySamples: Array<{ domain?: string; value: string }> = [];
  const toxicSamples: Array<{ domain?: string; value: string }> = [];

  const addAnchor = (anchor?: string) => {
    const cleaned = anchor?.trim().replace(/\s+/g, " ").slice(0, 120);
    if (!cleaned) return;
    anchorCounts.set(cleaned, (anchorCounts.get(cleaned) ?? 0) + 1);
  };
  const addRel = (rel?: string) => {
    const value = rel?.toLowerCase() ?? "";
    if (value.includes("nofollow")) linkAttributes.nofollow += 1;
    else if (value.includes("sponsored")) linkAttributes.sponsored += 1;
    else if (value.includes("ugc")) linkAttributes.ugc += 1;
    else if (value.includes("follow") || value === "dofollow") linkAttributes.follow += 1;
    else linkAttributes.unknown += 1;
  };
  const addStatus = (status?: string) => {
    const cleaned = status?.trim().toLowerCase();
    if (!cleaned) return;
    if (/lost|removed|deleted|not found/.test(cleaned)) statusCounts.lost = (statusCounts.lost ?? 0) + 1;
    else if (/new|live|active|found/.test(cleaned)) statusCounts.live = (statusCounts.live ?? 0) + 1;
    else statusCounts[cleaned.slice(0, 40)] = (statusCounts[cleaned.slice(0, 40)] ?? 0) + 1;
  };

  if (detectedFormat === "csv" && header.length > 1) {
    for (const line of lines.slice(1, 1001)) {
      const cells = parseLooseCsvLine(line);
      const sourceUrl = sourceIdx >= 0 ? cells[sourceIdx] : undefined;
      const sourceDomain = domainIdx >= 0 ? cells[domainIdx] : undefined;
      const targetUrl = targetIdx >= 0 ? cells[targetIdx] : undefined;
      const domain = sourceDomain || (sourceUrl ? hostnameFromMaybeUrl(sourceUrl) : undefined);
      if (domain) referringDomains.add(domain.replace(/^www\./i, "").toLowerCase());
      if (sourceUrl?.startsWith("http")) sourceUrls.add(sourceUrl);
      if (targetUrl?.startsWith("http")) targetUrls.add(targetUrl);
      addAnchor(anchorIdx >= 0 ? cells[anchorIdx] : undefined);
      addRel(relIdx >= 0 ? cells[relIdx] : undefined);
      addStatus(statusIdx >= 0 ? cells[statusIdx] : undefined);
      if (authorityIdx >= 0 && cells[authorityIdx] && authoritySamples.length < 20) {
        authoritySamples.push({ domain, value: cells[authorityIdx].slice(0, 40) });
      }
      if (toxicIdx >= 0 && cells[toxicIdx] && toxicSamples.length < 20) {
        toxicSamples.push({ domain, value: cells[toxicIdx].slice(0, 40) });
      }
    }
  } else {
    for (const url of Array.from(new Set(text.match(/https?:\/\/[^\s"'<>),]+/gi) ?? [])).slice(0, 500)) {
      sourceUrls.add(url);
      const domain = hostnameFromMaybeUrl(url);
      if (domain) referringDomains.add(domain);
    }
    for (const line of lines.slice(0, 500)) {
      const anchorMatch = line.match(/anchor(?: text)?[:=]\s*["']?([^"'|,;]{2,120})/i);
      addAnchor(anchorMatch?.[1]);
      addRel(line);
      addStatus(line);
    }
  }

  const topAnchors = Array.from(anchorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([anchor, count]) => ({ anchor, count }));
  const suspiciousPatterns = [
    ...(topAnchors.some((item) => /casino|viagra|loan|porn|betting|crypto/i.test(item.anchor)) ? ["spammyAnchorText"] : []),
    ...(linkAttributes.nofollow + linkAttributes.sponsored + linkAttributes.ugc > linkAttributes.follow * 3 && linkAttributes.follow > 0 ? ["mostlyNonFollowAttributes"] : []),
    ...(toxicSamples.some((item) => /high|toxic|spam|\b[7-9]\d\b|100/.test(item.value.toLowerCase())) ? ["toxicOrSpamScoresPresent"] : []),
    ...(referringDomains.size > 0 && sourceUrls.size / referringDomains.size > 20 ? ["manyLinksPerDomain"] : []),
  ];

  if (referringDomains.size === 0 && sourceUrls.size === 0) warnings.push("noBacklinksDetected");
  if (detectedFormat !== "csv") warnings.push("unstructuredInput");

  return {
    sourceName,
    inputBytes,
    detectedFormat,
    toolHints,
    referringDomains: { count: referringDomains.size, sample: compactSample(Array.from(referringDomains), 30) },
    sourceUrls: { count: sourceUrls.size, sample: compactSample(Array.from(sourceUrls), 20) },
    targetUrls: { count: targetUrls.size, sample: compactSample(Array.from(targetUrls), 20) },
    anchors: { count: anchorCounts.size, top: topAnchors },
    linkAttributes,
    statusCounts,
    authoritySamples,
    toxicSamples,
    suspiciousPatterns,
    warnings,
  };
}

async function checkOneUrlForBatch(url: string): Promise<{
  url: string;
  status?: number;
  finalUrl?: string;
  redirected: boolean;
  contentType?: string;
  error?: string;
}> {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const fetchOnce = async (method: "HEAD" | "GET") => {
    const response = await fetch(normalized, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; OpenCodeSEOAudit/1.0)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    response.body?.cancel().catch(() => undefined);
    return response;
  };

  try {
    let response = await fetchOnce("HEAD");
    if ([405, 403, 501].includes(response.status)) response = await fetchOnce("GET");
    return {
      url: normalized,
      status: response.status,
      finalUrl: response.url,
      redirected: response.url !== normalized,
      contentType: response.headers.get("content-type")?.split(";")[0]?.slice(0, 80),
    };
  } catch (err) {
    return {
      url: normalized,
      redirected: false,
      error: err instanceof Error ? err.message.slice(0, 160) : String(err).slice(0, 160),
    };
  }
}

async function batchCheckUrls(rawUrls: unknown, maxUrls?: number): Promise<unknown> {
  const requestedUrls = Array.isArray(rawUrls)
    ? rawUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];
  const uniqueUrls = Array.from(new Set(requestedUrls.map((url) => url.trim())));
  const limit = Math.min(Math.max(Math.floor(maxUrls ?? 50), 1), 150);
  const urls = uniqueUrls.slice(0, limit);
  const warnings: string[] = [];
  if (requestedUrls.length === 0) warnings.push("emptyInput");
  if (uniqueUrls.length > urls.length) warnings.push("truncatedInput");

  const results: Awaited<ReturnType<typeof checkOneUrlForBatch>>[] = [];
  const concurrency = 8;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await checkOneUrlForBatch(urls[index]);
    }
  });
  await Promise.all(workers);

  const statusBuckets = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, errors: 0, other: 0 };
  const contentTypes: Record<string, number> = {};
  for (const result of results) {
    if (result.error || !result.status) statusBuckets.errors += 1;
    else if (result.status >= 200 && result.status < 300) statusBuckets["2xx"] += 1;
    else if (result.status >= 300 && result.status < 400) statusBuckets["3xx"] += 1;
    else if (result.status >= 400 && result.status < 500) statusBuckets["4xx"] += 1;
    else if (result.status >= 500 && result.status < 600) statusBuckets["5xx"] += 1;
    else statusBuckets.other += 1;
    if (result.contentType) contentTypes[result.contentType] = (contentTypes[result.contentType] ?? 0) + 1;
  }

  const redirects = results.filter((result) => result.redirected);
  const broken = results.filter((result) => result.error || (result.status !== undefined && result.status >= 400));
  const finalUrlMismatches = redirects.filter((result) => {
    if (!result.finalUrl) return false;
    try {
      const source = new URL(result.url);
      const final = new URL(result.finalUrl);
      return source.hostname.replace(/^www\./i, "") !== final.hostname.replace(/^www\./i, "") || source.pathname !== final.pathname;
    } catch {
      return false;
    }
  });
  if (broken.length > 0) warnings.push("brokenOrErrorUrls");
  if (redirects.length > 0) warnings.push("redirectsDetected");

  return {
    requestedCount: requestedUrls.length,
    uniqueCount: uniqueUrls.length,
    checkedCount: results.length,
    truncated: uniqueUrls.length > urls.length,
    statusBuckets,
    redirects: { count: redirects.length, sample: compactSample(redirects, 25) },
    broken: { count: broken.length, sample: compactSample(broken, 25) },
    finalUrlMismatches: { count: finalUrlMismatches.length, sample: compactSample(finalUrlMismatches, 15) },
    contentTypes: Object.entries(contentTypes).slice(0, 20).map(([contentType, count]) => ({ contentType, count })),
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Deterministic audit pipeline: evidence model + helpers.
// ---------------------------------------------------------------------------

type ToolEvidence = {
  phase: "preflight" | "follow_up";
  name: string;
  args: Record<string, unknown>;
  ok: boolean;
  durationMs: number;
  bytes: number;
  result?: unknown;
  error?: string;
};

type AuditEvidence = {
  targetUrl: string;
  preflight: ToolEvidence[];
  followUp: ToolEvidence[];
  errors: ToolError[];
};

function appendEvidence(list: ToolEvidence[], entry: ToolEvidence): ToolEvidence {
  list.push(entry);
  return entry;
}

function tryParseJson(text: string): unknown {
  if (typeof text !== "string") return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractResultError(parsed: unknown): string | undefined {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
  const err = (parsed as Record<string, unknown>).error;
  if (typeof err === "string") return err;
  return undefined;
}

function buildEvidenceSummary(evidence: AuditEvidence): unknown {
  const summarizeEntry = (entry: ToolEvidence) => {
    const summary: Record<string, unknown> = {
      phase: entry.phase,
      name: entry.name,
      args: redactArgs(entry.args),
      ok: entry.ok,
      durationMs: entry.durationMs,
      bytes: entry.bytes,
    };
    if (entry.error) {
      summary.error = entry.error.length > MAX_EVIDENCE_ERROR_CHARS
        ? entry.error.slice(0, MAX_EVIDENCE_ERROR_CHARS) + "..."
        : entry.error;
    }
    if (entry.result !== undefined) {
      let json: string | undefined;
      try {
        json = JSON.stringify(entry.result);
      } catch {
        json = undefined;
      }
      if (json) {
        if (utf8Bytes(json) <= EVIDENCE_RESULT_MAX_BYTES) {
          summary.result = entry.result;
        } else {
          const { text, originalBytes } = safeTruncate(json, EVIDENCE_RESULT_MAX_BYTES);
          summary.result = {
            _truncated: true,
            _originalBytes: originalBytes,
            _preview: text,
          };
        }
      }
    }
    return summary;
  };

  return {
    targetUrl: evidence.targetUrl,
    preflight: evidence.preflight.map(summarizeEntry),
    followUp: evidence.followUp.map(summarizeEntry),
    errorCount: evidence.errors.length,
    errors: evidence.errors.map((e) => ({ name: e.name, error: e.error.length > MAX_EVIDENCE_ERROR_CHARS ? e.error.slice(0, MAX_EVIDENCE_ERROR_CHARS) + "..." : e.error })),
  };
}

type PreflightToolCall = { name: string; args: Record<string, unknown> };

function buildPreflightToolCalls(url: string): PreflightToolCall[] {
  return [
    { name: "inspect_http", args: { url } },
    { name: "inspect_page_seo", args: { url } },
    { name: "parse_sitemap", args: { url, maxUrls: 100, checkSample: false } },
    { name: "crawl_site_sample", args: { url, maxPages: 10 } },
    { name: "extract_structured_data", args: { url, checkImages: false } },
    { name: "inspect_social_preview", args: { url, checkImages: true } },
    { name: "inspect_responsive_rendering", args: { url, profiles: ["desktop", "laptop", "tablet", "mobile"], includeScreenshots: true } },
    { name: "resource_inventory", args: { url } },
    { name: "inspect_entity_trust", args: { url } },
    { name: "dns_and_security_check", args: { url } },
    { name: "inspect_llms_txt", args: { url } },
    { name: "inspect_analytics_tags", args: { url } },
    { name: "run_lighthouse", args: { url, formFactor: "mobile" } },
    { name: "run_lighthouse", args: { url, formFactor: "desktop" } },
  ];
}

function buildPlanningUserMessage(
  url: string,
  evidenceSummary: unknown,
  language: AuditLanguage
): ChatCompletionMessageParam {
  const evidenceJson = JSON.stringify(evidenceSummary);
  const heading = reportHeading(language);
  return {
    role: "user",
    content:
      language === "ru"
        ? `Целевой URL: ${url}\n\nСобраны предварительные доказательства (preflight):\n\n${evidenceJson}\n\nИспользуй инструменты свободно, если нужны дополнительные доказательства. Когда данных достаточно, верни диагностический SEO-отчёт по шаблону из системного промпта: без roadmap, рекомендаций по исправлению, владельцев, сроков и бэклога. Все видимые заголовки и заголовки таблиц — на русском. Начни с "${heading}" и заверши ${FINAL_REPORT_END_MARKER}.`
        : `Target URL: ${url}\n\nPreflight evidence has been collected:\n\n${evidenceJson}\n\nUse tools freely if more evidence is needed. Once evidence is sufficient, return the diagnostic SEO report using the system template: no roadmap, recommended fixes, owners, timelines, or backlog. Every visible heading and table header must be in English. Start with "${heading}" and end with ${FINAL_REPORT_END_MARKER}.`,
  };
}

function buildFinalEvidenceUserMessage(
  url: string,
  evidenceSummary: unknown,
  language: AuditLanguage
): ChatCompletionMessageParam {
  const evidenceJson = JSON.stringify(evidenceSummary);
  const heading = reportHeading(language);
  return {
    role: "user",
    content:
      language === "ru"
        ? `Целевой URL: ${url}\n\nКомпактная сводка собранных доказательств:\n\n${evidenceJson}\n\nСформируй итоговую SEO-диагностику по шаблону из системного промпта, используя только эти доказательства. Не вызывай инструменты. Без roadmap, рекомендаций по исправлению, владельцев, сроков и бэклога. Не выводи <think>, рассуждения, скрытые заметки или code fence. Начни сразу с "${heading}". Если данных не хватает, явно укажи ограничение и не выдумывай факты.`
        : `Target URL: ${url}\n\nCompact summary of collected evidence:\n\n${evidenceJson}\n\nProduce the final SEO diagnostic report using the system template, based only on this evidence. Do not call tools. No roadmap, recommended fixes, owners, timelines, or backlog. Do not output <think>, reasoning, hidden notes, or a code fence. Start directly with "${heading}". If data is insufficient, state the limitation clearly and do not invent facts.`,
  };
}

/**
 * Build the initial user message for the unrestricted agent loop. The model
 * is told that it can call any tool as many times as it wants, and that when
 * it has enough evidence it should respond with the final report (no tool
 * calls, end marker on the last line).
 */
function buildAgentUserMessage(
  url: string,
  evidenceSummary: unknown,
  language: AuditLanguage
): ChatCompletionMessageParam {
  const evidenceJson = JSON.stringify(evidenceSummary);
  const heading = reportHeading(language);
  return {
    role: "user",
    content:
      language === "ru"
        ? `Целевой URL: ${url}\n\nНиже приведена компактная сводка автоматически собранных предварительных доказательств (preflight):\n\n${evidenceJson}\n\nТвоя задача:\n1. Используй приведённую выше сводку как отправную точку.\n2. Свободно вызывай любые из доступных TOOLS, чтобы собрать недостающие доказательства. Можно делать несколько вызовов подряд в одном шаге.\n3. Прежде чем переходить к итоговому ответу, убедись, что КАЖДАЯ URL-only область/инструмент из доступных упомянуты в матрице охвата проверок с явным статусом «Проверено», «Частично», «Не оценено» или «Требует данных». Не добавляй Search Console, загруженные отчёты, Ahrefs/Semrush или бэклинк-экспорты.\n4. Когда доказательств достаточно, верни ИТОГОВЫЙ ДИАГНОСТИЧЕСКИЙ SEO-аудит по обязательному шаблону из системного промпта обычным текстом (БЕЗ вызова TOOLS). Все видимые заголовки, заголовки таблиц, метки статусов и категории скоркарда — строго на русском языке (допускаются устоявшиеся технические термины: canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, FCP, TTI, Lighthouse, JSON-LD, Open Graph). Без roadmap, рекомендаций по исправлению, владельцев и сроков. Начни с "${heading}" и заверши ${FINAL_REPORT_END_MARKER} на отдельной последней строке.`
        : `Target URL: ${url}\n\nBelow is a compact JSON summary of the automatically collected preflight evidence:\n\n${evidenceJson}\n\nYour task:\n1. Use the evidence summary above as the starting point.\n2. You may freely call any of the available TOOLS to gather missing evidence. You may make multiple tool calls in a single step.\n3. Before producing the final answer, make sure EVERY available URL-only audit area / tool group is mentioned in the Check coverage matrix with an explicit status of "Checked", "Partially checked", "Not assessed", or "Requires data". Do not add Search Console, uploaded reports, Ahrefs/Semrush, or backlink exports.\n4. Once the evidence is sufficient, return the FINAL DIAGNOSTIC SEO audit following the required template from the system prompt as plain text (no TOOL calls). Every visible heading, table header, status label, and scorecard category label MUST be in English (only established technical terms allowed: canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, FCP, TTI, Lighthouse, JSON-LD, Open Graph). No roadmap, recommended fixes, owners, or timelines. Start with "${heading}" and end with ${FINAL_REPORT_END_MARKER} on its own final line.`,
  };
}

async function runPreflightTool(
  call: PreflightToolCall,
  browser: BrowserSession,
  emit: Emitter,
  toolErrors: ToolError[]
): Promise<ToolEvidence> {
  const startedAt = Date.now();
  const content = await executeTool(call.name, call.args, browser, emit, toolErrors);
  const durationMs = Date.now() - startedAt;
  const bytes = utf8Bytes(content);
  const parsed = tryParseJson(content);
  const error = extractResultError(parsed);
  const ok = !error;
  return {
    phase: "preflight",
    name: call.name,
    args: call.args,
    ok,
    durationMs,
    bytes,
    result: ok ? parsed : undefined,
    error,
  };
}

async function runFollowUpTool(
  call: PreflightToolCall,
  browser: BrowserSession,
  emit: Emitter,
  toolStats: ToolStats,
  toolErrors: ToolError[]
): Promise<ToolEvidence> {
  const budget = canRunTool(call.name, toolStats);
  if (!budget.ok) {
    toolStats.denied += 1;
    emit("status", {
      message: `Denied ${call.name}: ${budget.reason}`,
      phase: "tools",
    });
    emit("debug", {
      message: "Tool call denied by budget",
      data: { name: call.name, reason: budget.reason, toolStats },
    });
    return {
      phase: "follow_up",
      name: call.name,
      args: call.args,
      ok: false,
      durationMs: 0,
      bytes: 0,
      error: `denied: ${budget.reason}`,
    };
  }
  recordToolCall(call.name, toolStats);
  emit("debug", {
    message: "Tool budget",
    data: { used: toolStats.total, max: MAX_TOOL_CALLS, toolStats },
  });
  const startedAt = Date.now();
  const content = await executeTool(call.name, call.args, browser, emit, toolErrors);
  const durationMs = Date.now() - startedAt;
  const bytes = utf8Bytes(content);
  const parsed = tryParseJson(content);
  const error = extractResultError(parsed);
  const ok = !error;
  return {
    phase: "follow_up",
    name: call.name,
    args: call.args,
    ok,
    durationMs,
    bytes,
    result: ok ? parsed : undefined,
    error,
  };
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
  } else if (
    (name === "inspect_mobile_rendering" || name === "inspect_responsive_rendering") &&
    result &&
    typeof result === "object" &&
    !Array.isArray(result)
  ) {
    const r = result as Record<string, unknown>;
    const stripScreenshot = (entry: unknown) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
      const ss = entry as {
        base64?: unknown;
        mimeType?: unknown;
        bytes?: unknown;
        profile?: unknown;
        viewport?: unknown;
        source?: unknown;
      };
      const bytes =
        typeof ss.bytes === "number"
          ? ss.bytes
          : typeof ss.base64 === "string"
            ? Buffer.byteLength(ss.base64, "base64")
            : 0;
      const out: Record<string, unknown> = {
        mimeType: typeof ss.mimeType === "string" ? ss.mimeType : "image/jpeg",
        bytes,
        omitted: true,
        reason: "screenshot omitted from model context; refer to debug log for size",
      };
      if (typeof ss.profile === "string") out.profile = ss.profile;
      if (ss.viewport && typeof ss.viewport === "object") out.viewport = ss.viewport;
      if (typeof ss.source === "string") out.source = ss.source;
      return out;
    };
    if (name === "inspect_responsive_rendering") {
      const results = Array.isArray(r.results) ? r.results : [];
      for (const item of results) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const entry = item as Record<string, unknown>;
        if (entry.screenshot) {
          const replaced = stripScreenshot(entry.screenshot);
          if (replaced) entry.screenshot = replaced;
        }
      }
      if (results.length > 0) omittedScreenshot = true;
    } else {
      if (r.screenshot) {
        const replaced = stripScreenshot(r.screenshot);
        if (replaced) {
          r.screenshot = replaced;
          omittedScreenshot = true;
        }
      }
    }
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

function emitSocialReportImages(
  result: unknown,
  emit: Emitter
): void {
  if (!result || typeof result !== "object" || Array.isArray(result)) return;
  const r = result as Record<string, unknown>;
  const pageUrl = typeof r.finalUrl === "string"
    ? r.finalUrl
    : typeof r.url === "string"
      ? r.url
      : undefined;
  const checks = Array.isArray(r.imageChecks) ? r.imageChecks : [];
  const emitted = new Set<string>();

  const emitOne = (rawUrl: unknown, source: string, meta?: Record<string, unknown>) => {
    if (typeof rawUrl !== "string" || rawUrl.length === 0 || emitted.has(rawUrl)) return;
    emitted.add(rawUrl);
    emit("report_image", {
      id: randomUUID(),
      kind: "social",
      source,
      url: rawUrl,
      pageUrl,
      alt: typeof meta?.alt === "string" ? meta.alt : source,
      mimeType: typeof meta?.contentType === "string" ? meta.contentType : undefined,
      bytes: typeof meta?.bytes === "number" ? meta.bytes : undefined,
      width: typeof meta?.width === "number" ? meta.width : undefined,
      height: typeof meta?.height === "number" ? meta.height : undefined,
      status: typeof meta?.status === "number" ? meta.status : undefined,
      takenAt: new Date().toISOString(),
    });
  };

  for (const item of checks) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const image = item as Record<string, unknown>;
    emitOne(image.url, typeof image.source === "string" ? image.source : "social image", image);
  }

  const openGraph = r.openGraph;
  if (openGraph && typeof openGraph === "object" && !Array.isArray(openGraph)) {
    const og = openGraph as Record<string, unknown>;
    emitOne(og.image, "og:image", { alt: og.imageAlt });
  }

  const twitter = r.twitter;
  if (twitter && typeof twitter === "object" && !Array.isArray(twitter)) {
    const tw = twitter as Record<string, unknown>;
    emitOne(tw.image, "twitter:image");
  }
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
        case "inspect_page_seo":
          return await browser.inspectPageSeo(String(args.url));
        case "check_robots_and_sitemap":
          return await browser.fetchRobotsAndSitemap(String(args.url));
        case "inspect_http":
          return await browser.inspectHttp(
            String(args.url),
            typeof args.maxRedirects === "number" ? args.maxRedirects : undefined
          );
        case "parse_sitemap":
          return await browser.parseSitemap(
            String(args.url),
            typeof args.maxUrls === "number" ? args.maxUrls : undefined,
            typeof args.checkSample === "boolean" ? args.checkSample : undefined
          );
        case "extract_structured_data":
          return await browser.extractStructuredData(
            String(args.url),
            typeof args.checkImages === "boolean" ? args.checkImages : undefined
          );
        case "inspect_social_preview":
          return await browser.inspectSocialPreview(
            String(args.url),
            typeof args.checkImages === "boolean" ? args.checkImages : undefined
          );
        case "inspect_hreflang":
          return await browser.inspectHreflang(
            String(args.url),
            typeof args.checkReciprocal === "boolean" ? args.checkReciprocal : undefined
          );
        case "resource_inventory":
          return await browser.resourceInventory(
            String(args.url),
            typeof args.waitMs === "number" ? args.waitMs : undefined
          );
        case "run_lighthouse":
          return await browser.runLighthouse(
            String(args.url),
            args.formFactor === "desktop" ? "desktop" : "mobile"
          );
        case "inspect_mobile_rendering":
          return await browser.inspectMobileRendering(
            String(args.url),
            typeof args.width === "number" ? args.width : undefined,
            typeof args.height === "number" ? args.height : undefined,
            typeof args.includeScreenshot === "boolean"
              ? args.includeScreenshot
              : undefined
          );
        case "inspect_responsive_rendering":
          return await browser.inspectResponsiveRendering(
            String(args.url),
            Array.isArray(args.profiles)
              ? (args.profiles.filter(
                  (p): p is "desktop" | "laptop" | "tablet" | "mobile" =>
                    typeof p === "string" &&
                    ["desktop", "laptop", "tablet", "mobile"].includes(p)
                ) as Array<"desktop" | "laptop" | "tablet" | "mobile">)
              : undefined,
            typeof args.includeScreenshots === "boolean"
              ? args.includeScreenshots
              : undefined
          );
        case "inspect_analytics_tags":
          return await browser.inspectAnalyticsTags(String(args.url));
        case "check_link_health":
          return await browser.checkLinkHealth(
            String(args.url),
            typeof args.maxLinks === "number" ? args.maxLinks : undefined,
            typeof args.includeExternal === "boolean"
              ? args.includeExternal
              : undefined
          );
        case "crawl_site_sample":
          return await browser.crawlSiteSample(
            String(args.url),
            typeof args.maxPages === "number" ? args.maxPages : undefined
          );
        case "inspect_llms_txt":
          return await browser.inspectLlmsTxt(String(args.url));
        case "inspect_entity_trust":
          return await browser.inspectEntityTrust(String(args.url));
        case "dns_and_security_check":
          return await browser.dnsAndSecurityCheck(String(args.url));
        case "analyze_uploaded_audit_report":
          return analyzeUploadedAuditReport(
            String(args.reportText ?? ""),
            typeof args.sourceName === "string" ? args.sourceName : undefined
          );
        case "analyze_backlink_export":
          return analyzeBacklinkExport(
            String(args.exportText ?? ""),
            typeof args.sourceName === "string" ? args.sourceName : undefined
          );
        case "batch_check_urls":
          return await batchCheckUrls(
            args.urls,
            typeof args.maxUrls === "number" ? args.maxUrls : undefined
          );
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
    } else if (
      name === "inspect_mobile_rendering" &&
      result &&
      typeof result === "object" &&
      !Array.isArray(result)
    ) {
      const r = result as {
        screenshot?: { base64?: unknown; mimeType?: unknown; bytes?: unknown };
        finalUrl?: unknown;
      };
      const ss = r.screenshot;
      if (ss && typeof ss === "object" && typeof ss.base64 === "string" && ss.base64.length > 0) {
        const base64 = ss.base64;
        const mimeType = typeof ss.mimeType === "string" ? ss.mimeType : "image/jpeg";
        const bytes =
          typeof ss.bytes === "number"
            ? ss.bytes
            : Buffer.byteLength(base64, "base64");
        const toolUrl = args.url;
        const screenshotUrl =
          typeof r.finalUrl === "string" && r.finalUrl.length > 0
            ? r.finalUrl
            : typeof toolUrl === "string" && toolUrl.length > 0
              ? toolUrl
              : undefined;
        emit("screenshot", {
          id: randomUUID(),
          url: screenshotUrl,
          mimeType,
          base64,
          bytes,
          takenAt: new Date().toISOString(),
        });
      }
    } else if (
      name === "inspect_responsive_rendering" &&
      result &&
      typeof result === "object" &&
      !Array.isArray(result)
    ) {
      const r = result as { results?: unknown };
      const results = Array.isArray(r.results) ? r.results : [];
      for (const rawEntry of results) {
        if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) continue;
        const entry = rawEntry as {
          screenshot?: {
            base64?: unknown;
            mimeType?: unknown;
            bytes?: unknown;
            profile?: unknown;
            viewport?: unknown;
            source?: unknown;
          };
          finalUrl?: unknown;
          url?: unknown;
        };
        const ss = entry.screenshot;
        if (!ss || typeof ss !== "object" || typeof ss.base64 !== "string" || ss.base64.length === 0) continue;
        const base64 = ss.base64;
        const mimeType = typeof ss.mimeType === "string" ? ss.mimeType : "image/jpeg";
        const bytes =
          typeof ss.bytes === "number"
            ? ss.bytes
            : Buffer.byteLength(base64, "base64");
        const toolUrl = args.url;
        const screenshotUrl =
          typeof entry.finalUrl === "string" && entry.finalUrl.length > 0
            ? entry.finalUrl
            : typeof entry.url === "string" && entry.url.length > 0
              ? entry.url
              : typeof toolUrl === "string" && toolUrl.length > 0
                ? toolUrl
                : undefined;
        const profile =
          typeof ss.profile === "string" &&
          ["desktop", "laptop", "tablet", "mobile"].includes(ss.profile)
            ? (ss.profile as "desktop" | "laptop" | "tablet" | "mobile")
            : undefined;
        emit("screenshot", {
          id: randomUUID(),
          url: screenshotUrl,
          mimeType,
          base64,
          bytes,
          takenAt: new Date().toISOString(),
          source: typeof ss.source === "string" ? ss.source : "inspectResponsiveRendering",
          profile,
          viewport:
            ss.viewport && typeof ss.viewport === "object" && !Array.isArray(ss.viewport)
              ? (ss.viewport as { width?: number; height?: number })
              : undefined,
        });
      }
    } else if (name === "inspect_social_preview") {
      emitSocialReportImages(result, emit);
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
  maxTokens: number,
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
    data: { mode, model: modelId, messages: messages.length, requestBytes, maxTokens },
  });

  const startedAt = Date.now();
  const timeoutError = () =>
    new Error(
      `Model stream was idle for ${modelWaitMs}ms at thinking step ${step}`
    );
  const requestController = new AbortController();
  const abortRequest = () => requestController.abort();
  signal?.addEventListener("abort", abortRequest, { once: true });
  const withModelIdleTimeout = async <T,>(promise: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            requestController.abort();
            reject(timeoutError());
          }, modelWaitMs);
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
    temperature: mode === "final" ? 0 : 0.2,
    max_tokens: maxTokens,
    stream: true as const,
    stream_options: { include_usage: true },
  };
  const stream: Stream<ChatCompletionChunk> = await withModelIdleTimeout(
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

  try {
    while (true) {
      if (isAborted(signal)) {
        requestController.abort();
        throw new Error("aborted");
      }
      const next = await withModelIdleTimeout(iterator.next());
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

      emitProgress(false);
    }
  } catch (err) {
    const sanitizedPartial = mode === "final" ? sanitizeFinalReport(content) : content;
    if (content.trim().length > 0) {
      const msg = err instanceof Error ? err.message : String(err);
      finishReason = "timeout_partial";
      content = sanitizedPartial;
      emit("status", {
        message: "Model stream went idle; returning the partial content generated so far for continuation.",
        phase: mode === "final" ? "model:final report" : `model:streaming step ${step}`,
      });
      emit("debug", {
        message: "Model stream idle partial fallback",
        data: { step, contentBytes: content.length, reason: msg },
      });
    } else {
      throw err;
    }
  } finally {
    signal?.removeEventListener("abort", abortRequest);
  }

  if (firstChunkMs === 0) {
    throw new Error(`Model returned no chunks at thinking step ${step}`);
  }

  if (mode === "final") {
    const sanitized = sanitizeFinalReport(content);
    if (sanitized !== content.trim()) {
      emit("debug", {
        message: "Sanitized final report content",
        data: { beforeBytes: content.length, afterBytes: sanitized.length },
      });
    }
    content = sanitized;
  }

  emitProgress(true);
  const durationMs = Date.now() - startedAt;
  let ordered = Array.from(toolCalls.values())
    .filter((tc) => tc.id && tc.function.name)
    .map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: { name: tc.function.name, arguments: tc.function.arguments || "{}" },
    }));

  if (mode === "final" && ordered.length > 0) {
    emit("debug", {
      message: "Ignoring tool calls returned during final report mode",
      data: { toolCalls: ordered.map((tc) => tc.function.name) },
    });
    ordered = [];
  }

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
 * Runs the audit as a deterministic pipeline:
 *   1. Run fixed preflight tools without LLM.
 *   2. Build a compact evidence summary.
 *   3. Ask the LLM once for optional follow-up tool calls (max 5).
 *   4. Execute those follow-up tools.
 *   5. Rebuild the evidence summary.
 *   6. Generate the final standardized report without tools.
 *
 * The browser is started/stopped by this function. Progress is streamed via
 * the provided emitter.
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
  const evidence: AuditEvidence = {
    targetUrl: url,
    preflight: [],
    followUp: [],
    errors: toolErrors,
  };

  const setPhase = (phase: string) => {
    try {
      onPhase?.(phase);
    } catch {
      // Phase callbacks must never break the audit.
    }
  };
  setPhase("init");

  const auditStartedAt = Date.now();
  const auditBudgetTimer = auditHasTimeBudget()
    ? setTimeout(() => {
        const elapsed = Date.now() - auditStartedAt;
        emit("debug", {
          message: `Audit duration budget timer fired`,
          data: { elapsedMs: elapsed, maxMs: MAX_AUDIT_DURATION_MS },
        });
      }, MAX_AUDIT_DURATION_MS)
    : undefined;

  let reportDone = false;

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

    const openai = new OpenAI({
      apiKey,
      baseURL: getEndpoint(group),
      timeout: OPENAI_TIMEOUT_MS,
    });

    // ----- 1. Deterministic preflight tools -----
    setPhase("preflight");
    emit("status", { message: "Running preflight tools...", phase: "preflight" });
    const preflightCalls = buildPreflightToolCalls(url);
    emit("debug", {
      message: "Preflight plan",
      data: { count: preflightCalls.length, tools: preflightCalls.map((c) => c.name) },
    });
    for (const call of preflightCalls) {
      if (isAborted(signal)) {
        emit("error", { message: "Audit aborted by client" });
        return;
      }
      const remainingMs = remainingAuditMs(auditStartedAt);
      if (auditHasTimeBudget() && remainingMs <= MIN_FINAL_REPORT_MS) {
        emit("status", {
          message: `Skipping remaining preflight tools to leave time for the final report (${remainingMs}ms remaining).`,
          phase: "preflight",
        });
        break;
      }
      if (call.name === "run_lighthouse") {
        const formFactor = call.args.formFactor === "desktop" ? "desktop" : "mobile";
        emit("status", {
          message: `Running Lighthouse (formFactor: ${formFactor})...`,
          phase: "preflight",
        });
      }
      const entry = await runPreflightTool(call, browser, emit, toolErrors);
      appendEvidence(evidence.preflight, entry);
      emit("debug", {
        message: "Preflight tool done",
        data: { name: entry.name, ok: entry.ok, durationMs: entry.durationMs, bytes: entry.bytes },
      });
    }
    emit("status", {
      message: `Preflight complete: ${evidence.preflight.length}/${preflightCalls.length} tool(s) finished.`,
      phase: "preflight",
    });

    // ----- 2. Build the initial messages for the unrestricted agent loop -----
    const initialEvidenceSummary = buildEvidenceSummary(evidence);
    const messages: ChatCompletionMessageParam[] = [
      buildSystemPrompt(skillText, language),
      buildAgentUserMessage(url, initialEvidenceSummary, language),
    ];
    // Simple tool result cache, keyed by tool name + JSON-stringified args.
    // Disabled arguments whose keys/ordering are unstable would not be a
    // problem here: the model controls the args, so identical calls produce
    // identical keys.
    const toolResultCache = new Map<string, string>();

    // ----- 3. Unrestricted agent loop -----
    // The model is free to call any tool as many times as it wants, or to
    // return the final report at any time. Per-tool budgets are NOT applied;
    // we only skip calls that target static assets, cache duplicate results,
    // and respect the overall time / context / iteration caps.
    let agentStep = 0;
    let emergencyTried = false;
    let finalContinuationCount = 0;

    while (true) {
      if (isAborted(signal)) {
        emit("error", { message: "Audit aborted by client" });
        return;
      }
      agentStep += 1;
      const remainingMs = remainingAuditMs(auditStartedAt);
      if (auditHasTimeBudget() && remainingMs <= 0) {
        emit("error", {
          message: "Audit stopped by time budget. No final report was produced.",
        });
        return;
      }

      // Context check / compaction gate: refuse to send another request when
      // the message array already exceeds the cap. The model still has the
      // existing messages, so we exit and try a final report below.
      const requestBytes = approxBytes({ messages });
      if (requestBytes > MAX_CONTEXT_BYTES) {
        emit("debug", {
          message: "Context budget exceeded; stopping agent loop",
          data: { requestBytes, max: MAX_CONTEXT_BYTES, messages: messages.length },
        });
        break;
      }

      emit("debug", {
        message: `Agent step ${agentStep} request prepared`,
        data: { messages: messages.length, requestBytes, remainingMs },
      });

      const waitMs = auditHasTimeBudget()
        ? Math.min(PER_MODEL_WAIT_MS, Math.max(1, remainingMs))
        : PER_MODEL_WAIT_MS;

      let result: {
        content: string;
        toolCalls: AccumulatedToolCall[];
        finishReason: string | null;
        chunkCount: number;
        firstChunkMs: number;
      };
      try {
        result = await runModelStep(
          openai,
          modelId,
          messages,
          agentStep,
          "discovery",
          requestBytes,
          waitMs,
          MAX_TOKENS,
          signal,
          emit,
          setPhase
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emit("error", {
          message: `Agent step ${agentStep} failed: ${msg}`,
        });
        emit("debug", {
          message: "runAudit caught agent step error",
          data: { agentStep, error: msg, name: err instanceof Error ? err.name : undefined },
        });
        return;
      }

      if (result.toolCalls.length > 0) {
        // Append the assistant turn with its tool_calls, preserving any text
        // the model emitted alongside the calls.
        const assistantContent =
          result.content && result.content.length > 0 ? result.content : null;
        messages.push({
          role: "assistant",
          content: assistantContent,
          tool_calls: result.toolCalls,
        });

        // Execute every returned tool call sequentially. Per the spec we do
        // NOT apply canRunTool / per-tool budgets; we only skip static-asset
        // URLs and serve cached results when possible.
        for (const toolCall of result.toolCalls) {
          if (isAborted(signal)) {
            emit("error", { message: "Audit aborted by client" });
            return;
          }

          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
          } catch (parseErr) {
            const parseMsg =
              parseErr instanceof Error ? parseErr.message : String(parseErr);
            toolErrors.push({
              name: toolCall.function.name,
              args: {},
              error: `Invalid JSON args: ${parseMsg}`,
            });
            emit("debug", {
              message: "Tool call arguments were not valid JSON",
              data: { name: toolCall.function.name, error: parseMsg },
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: `Invalid JSON args: ${parseMsg}` }),
            });
            continue;
          }

          let content: string;

          if (isStaticAssetToolCall(toolCall.function.name, args)) {
            toolStats.skippedStaticAssets += 1;
            const skipMsg = `Skipped: ${toolCall.function.name} is not applicable to static asset URLs. Inspect the host page (inspect_http, resource_inventory, inspect_page_seo) instead of fetching the asset directly.`;
            content = JSON.stringify({ error: skipMsg });
            emit("debug", {
              message: "Skipped tool call: static asset URL",
              data: { name: toolCall.function.name, args: redactArgs(args) },
            });
          } else {
            const cacheKey = toolCacheKey(toolCall.function.name, args);
            const cached = toolResultCache.get(cacheKey);
            if (cached !== undefined) {
              toolStats.cacheHits += 1;
              content = cached;
              emit("debug", {
                message: "Tool cache hit",
                data: { name: toolCall.function.name, cacheKey, bytes: cached.length },
              });
            } else {
              content = await executeTool(
                toolCall.function.name,
                args,
                browser,
                emit,
                toolErrors
              );
              toolResultCache.set(cacheKey, content);
            }
            recordToolCall(toolCall.function.name, toolStats);
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content,
          });
        }

        continue;
      }

      // ----- Final-report branch -----
      // No tool calls were returned, so the assistant's text content is the
      // final report candidate. Apply the same marker/finish-reason rules
      // used previously: incomplete -> ask for continuation; complete -> emit
      // done; unusable -> try the compact emergency retry once.
      const sanitized = sanitizeFinalReport(result.content);
      let finalReportContent = sanitized;

      while (finalReportNeedsContinuation(finalReportContent, result.finishReason)) {
        finalContinuationCount += 1;
        if (finalContinuationCount > MAX_FINAL_CONTINUATIONS) {
          emit("debug", {
            message: "Final report continuation limit reached",
            data: {
              continuations: finalContinuationCount - 1,
              max: MAX_FINAL_CONTINUATIONS,
              finishReason: result.finishReason,
              hasEndMarker: hasFinalReportEndMarker(finalReportContent),
              contentBytes: finalReportContent.length,
            },
          });
          break;
        }
        const remainingAtCont = remainingAuditMs(auditStartedAt);
        if (auditHasTimeBudget() && remainingAtCont <= 10_000) {
          emit("debug", {
            message: "Skipping final report continuation due to low time budget",
            data: { remainingMs: remainingAtCont },
          });
          break;
        }
        emit("status", {
          message: `Final report is incomplete; requesting no-tool continuation ${finalContinuationCount}/${MAX_FINAL_CONTINUATIONS}...`,
          phase: "model:final report",
        });
        emit("debug", {
          message: "Final report needs continuation",
          data: {
            finishReason: result.finishReason,
            hasEndMarker: hasFinalReportEndMarker(finalReportContent),
            contentBytes: finalReportContent.length,
            agentStep,
            continuation: finalContinuationCount,
          },
        });
        const continuationMessages = buildFinalContinuationMessages(language, finalReportContent);
        const continuationRequestBytes = approxBytes({ messages: continuationMessages });
        const continuation = await runModelStep(
          openai,
          modelId,
          continuationMessages,
          agentStep + finalContinuationCount,
          "final",
          continuationRequestBytes,
          auditHasTimeBudget()
            ? Math.min(PER_MODEL_WAIT_MS, Math.max(1, remainingAtCont))
            : PER_MODEL_WAIT_MS,
          MAX_FINAL_TOKENS,
          signal,
          emit,
          setPhase
        );
        const continuationText = sanitizeFinalReport(continuation.content);
        if (continuationText.length === 0) {
          result.finishReason = continuation.finishReason;
          break;
        }
        finalReportContent = `${finalReportContent.trim()}\n\n${continuationText.trim()}`.trim();
        result.finishReason = continuation.finishReason;
      }

      if (finalReportNeedsContinuation(finalReportContent, result.finishReason)) {
        emit("error", {
          message: "Final report did not complete with the required end marker after continuation attempts.",
        });
        break;
      }

      const reportForDisplay = stripFinalReportEndMarker(finalReportContent);
      if (!isUsableFinalReport(reportForDisplay)) {
        if (!emergencyTried) {
          const elapsedEmergency = Date.now() - auditStartedAt;
          emergencyTried = true;
          emit("status", {
            message:
              "Final report was not usable; retrying once with compact emergency instructions.",
            phase: "report",
          });
          emit("debug", {
            message: "Retrying final report after unusable output",
              data: {
                finishReason: result.finishReason,
                contentBytes: finalReportContent.length,
                elapsedMs: elapsedEmergency,
                retryWaitMs: PER_EMERGENCY_FINAL_MODEL_WAIT_MS,
                retryMaxTokens: MAX_EMERGENCY_FINAL_TOKENS,
              },
            });
          const emergencyMessages: ChatCompletionMessageParam[] = [
            buildSystemPrompt(skillText, language),
            buildEmergencyFinalReportMessage(language),
          ];
          const emergency = await runModelStep(
            openai,
            modelId,
            emergencyMessages,
            agentStep + finalContinuationCount + 1,
            "final",
            approxBytes({ messages: emergencyMessages }),
            PER_MODEL_WAIT_MS,
            MAX_EMERGENCY_FINAL_TOKENS,
            signal,
            emit,
            setPhase
          );
          finalReportContent = sanitizeFinalReport(emergency.content);
          if (finalReportNeedsContinuation(finalReportContent, emergency.finishReason)) {
            emit("error", {
              message: "Emergency final report did not complete with the required end marker.",
            });
            break;
          }
          const emergencyForDisplay = stripFinalReportEndMarker(finalReportContent);
          if (isUsableFinalReport(emergencyForDisplay)) {
            setPhase("report");
            emit("status", { message: "Generating final report...", phase: "report" });
            emit("done", { report: emergencyForDisplay });
            reportDone = true;
            break;
          }
          emit("error", {
            message: "Emergency final report was complete but not usable.",
          });
          break;
        }
        emit("error", {
          message: "Final report mode produced no usable report content.",
        });
        break;
      }

      setPhase("report");
      emit("status", { message: "Generating final report...", phase: "report" });
      emit("done", { report: reportForDisplay });
      reportDone = true;
      break;
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
    if (lower.includes("aborted")) {
      emit("error", {
        message: "Audit aborted (client disconnect)",
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
          : `Model request timed out after ${PER_MODEL_WAIT_MS}ms`,
      });
      emit("debug", {
        message: "Audit timeout stats",
        data: {
          elapsedMs: Date.now() - auditStartedAt,
          toolStats,
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
    if (auditBudgetTimer) clearTimeout(auditBudgetTimer);
    await browser.close();
  }
}
