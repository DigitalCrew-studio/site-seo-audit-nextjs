import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AuditLanguage } from "@/lib/types";
import { reportInstructions } from "@/lib/report-template";

/** Ensure the supplied URL has an explicit protocol. */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/** Strict language instruction injected into the system prompt. */
export function langInstruction(language: AuditLanguage): string {
  return language === "ru"
    ? "Все твои ответы должны быть строго на русском языке. Это касается всего итогового отчёта: заголовков секций, заголовков таблиц, меток статусов, меток скоркарда и категорий. Допускаются только устоявшиеся технические термины (canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, FCP, TTI, Lighthouse, JSON-LD, Open Graph и т.п.)."
    : "All of your responses must be strictly in English. This applies to the entire final report: section headings, table headers, status labels, scorecard category labels, and other visible UI text. Only established technical terms are allowed (canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, FCP, TTI, Lighthouse, JSON-LD, Open Graph, etc.).";
}

/** Build the system message embedding the skill text as methodology. */
export function buildSystemPrompt(
  skillText: string,
  language: AuditLanguage,
  mode: "discovery" | "final" = "final"
): ChatCompletionMessageParam {
  return mode === "discovery"
    ? buildDiscoverySystemPrompt(skillText, language)
    : buildFinalSystemPrompt(skillText, language);
}

/**
 * Discovery-phase system prompt. Compact: methodology + tool guidance,
 * without the full report template. The model is meant to call tools and
 * gather evidence here; the report template only matters when we switch
 * to mode="final".
 */
function buildDiscoverySystemPrompt(
  skillText: string,
  language: AuditLanguage
): ChatCompletionMessageParam {
  return {
    role: "system",
    content: `You are an expert SEO auditor. Use the following skill as your operating methodology and system prompt.

${langInstruction(language)}

You have access to browser tools. Only claim a finding if you have evidence from a tool result. If a check could not be performed, state the limitation clearly.

This product is URL-only: the user supplies only a target URL. There is no external dashboard connection, no file upload, no pasted third-party audit report, and no external export input in the current interface. Do not mention unavailable external input modes, provider names, or missing user uploads as unassessed report areas, scorecard categories, or limitations. Do not penalize the audited site for those unavailable input modes.

Use compact aggregate tools first. Prefer inspect_page_seo, crawl_site_sample, parse_sitemap, inspect_http, structured/social/hreflang/entity/security/performance tools over raw HTML or one-off primitive checks. Do not over-explore URL variants manually after crawl/sitemap evidence is available. Leave enough time for the final report; once core evidence is gathered, stop calling tools and write the report.

Visual QA is page-by-page, not homepage-only. The deterministic preflight may run inspect_responsive_rendering on the homepage and on crawled internal pages, with screenshots streamed to the report gallery and omitted from model context. Use every inspect_responsive_rendering result when filling the rendering and page-by-page visual check sections. If visual coverage is thin, call inspect_responsive_rendering for additional important internal URLs, but keep the overall screenshot count bounded.

Never output hidden reasoning, chain-of-thought, scratchpad text, <think> tags, or markdown code fences around the final report. The user-facing final answer must start directly with the report content.

=== SEO AUDIT SKILL ===
${skillText}
=== END SKILL ===`,
  };
}

/**
 * Final-report system prompt. Carries the full diagnostic report template
 * and the "no roadmap / no owners / no timelines" hard rules. Only used
 * after discovery is done and the model is producing the final answer.
 */
function buildFinalSystemPrompt(
  skillText: string,
  language: AuditLanguage
): ChatCompletionMessageParam {
  void skillText;
  return {
    role: "system",
    content: `You are an expert SEO auditor producing the final user-facing diagnostic report.

${langInstruction(language)}

Tools are no longer available in this phase. Use only the evidence summary provided by the user message. Only claim a finding if it is supported by that evidence. If a check could not be performed, state the limitation clearly.

This product is URL-only: the user supplies only a target URL. There is no external analytics account connection, no file upload, no pasted third-party audit report, and no external backlink export input in the current interface. Do not mention those unavailable input modes, provider names, or missing uploads as unassessed report areas, scorecard categories, or limitations. Do not penalize the audited site for unavailable input modes.

Style: neutral, diagnostic, evidence-first. Avoid marketing praise such as "безупречный", "идеальный", "эталонный", "perfect", "flawless", "best-in-class". If no issue was found in an area, say "по проверенным данным проблем не обнаружено" / "no issue was found in the checked evidence".

Visual QA is page-by-page, not homepage-only. The deterministic preflight may run inspect_responsive_rendering on the homepage and on crawled internal pages, with screenshots streamed to the report gallery and omitted from model context. Use every inspect_responsive_rendering result when filling the rendering and page-by-page visual check sections. If visual coverage is thin, state that limitation clearly; do not invent visual findings.

Never output hidden reasoning, chain-of-thought, scratchpad text, <think> tags, or markdown code fences around the final report. The user-facing final answer must start directly with the report content.

## DIAGNOSTIC REPORT FORMAT (OVERRIDES THE SKILL)

The app's diagnostic report format defined in this prompt SUPERSEDES any older reporting format inside the SEO skill — including the skill's older finding-card structure, priority-list sections, roadmap-style sections, validation checklists, owner/timeline fields, and any P0-P3 style fix queue.

Hard rules for the final report:
- The report is a human-readable SEO DIAGNOSTIC, not a task backlog. State facts, compare current state with the normal benchmark, categorize severity/status, provide evidence-based recommendations in the dedicated recommendations section, and provide a final conclusion. Do NOT include owners, timelines, sprint planning, implementation steps, or "Priority P0–P3" used as a fix queue.
- All visible section headings, table headers, status labels, severity labels, and scorecard category labels MUST be in the user-selected language. For Russian use labels such as «Проверено», «Частично», «Не оценено», «Требует данных», «Критично», «Высокая», «Средняя», «Низкая», «Инфо». For English use labels such as "Checked", "Partially checked", "Not assessed", "Requires data", "Critical", "High", "Medium", "Low", "Info". Only established technical terms (canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, TTI, Lighthouse, JSON-LD, Open Graph, etc.) are allowed in their English form.
- The report MUST include the localized Check coverage matrix / «Матрица охвата проверок» that lists every available URL-only audit area / tool group with the localized coverage statuses above. No URL-only audit area may be silently omitted.
- The report MUST be table-heavy and compact: factual tables for scorecard, main SEO risks, check coverage matrix, page-by-page visual checks, evidence appendix, and textual gauges for Lighthouse / Core Web Vitals metrics.
- Do NOT include a "Roadmap" / «Дорожная карта» section, an "Owner" / «Ответственный» column, a "Timeline" / «Срок» column, or any implementation backlog. Recommendations belong only in the dedicated recommendations section.
- ABSOLUTELY FORBIDDEN: old skill priority sections, square P0-P3 labels, validation/check-method fields, old skill finding blocks, unsupported external-authority sections, or unavailable external data providers as limitations.

When you produce the FINAL report, you MUST follow the standardized diagnostic report template exactly — see the report format rules below. Every audit must return the same structure, filled with your evidence-based content.

${reportInstructions(language)}`,
  };
}

/** Build the initial user message that kicks off the audit. */
export function buildUserPrompt(
  url: string,
  language: AuditLanguage
): ChatCompletionMessageParam {
  return {
    role: "user",
    content:
      language === "ru"
        ? `Проведи SEO-аудит для ${url}. Следуй методологии из навыка. Начни с главной страницы и ключевых шаблонов, используй предоставленные инструменты для сбора доказательств. Когда доказательств достаточно, верни ИТОГОВЫЙ ДИАГНОСТИЧЕСКИЙ отчёт строго по шаблону из системного промпта, заполненный собранным контентом. Все видимые заголовки, заголовки таблиц, метки статусов и категории скоркарда — на русском языке. Обязательно заполни матрицу охвата проверок (Проверено / Частично / Не оценено / Требует данных), текстовые шкалы для Lighthouse / Core Web Vitals, постраничную визуальную проверку по скриншотам и раздел рекомендаций по улучшению на основе доказательств. Не включай roadmap, владельцев, сроки и бэклог. Ответ и отчёт должны быть полностью на русском языке (кроме устоявшихся технических терминов).`
        : `Run an SEO audit for ${url}. Follow the skill methodology. Start with the homepage and key templates, use the provided tools to collect evidence. Once you have enough evidence, return the FINAL DIAGNOSTIC report strictly following the template from the system prompt, filled with your collected content. Every visible heading, table header, status label, and scorecard category label must be in English. Make sure you fill the Check coverage matrix (Checked / Partially checked / Not assessed / Requires data), textual gauges for Lighthouse / Core Web Vitals, page-by-page visual check from screenshots, and the evidence-based improvement recommendations section. Do NOT include a roadmap, owners, timelines, or implementation backlog. The response and report must be entirely in English (only established technical terms allowed).`,
  };
}
