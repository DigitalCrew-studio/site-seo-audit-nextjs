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
    ? "Все твои ответы, включая итоговый отчёт, заголовки, таблицы и пункты рекомендаций, должны быть строго на русском языке."
    : "All of your responses, including the final report, headings, tables, and recommendation items, must be strictly in English.";
}

/** Build the system message embedding the skill text as methodology. */
export function buildSystemPrompt(
  skillText: string,
  language: AuditLanguage
): ChatCompletionMessageParam {
  return {
    role: "system",
    content: `You are an expert SEO auditor. Use the following skill as your operating methodology and system prompt.

${langInstruction(language)}

You have access to browser tools. Only claim a finding if you have evidence from a tool result. If a check could not be performed, state the limitation clearly.

When you produce the FINAL report, you MUST follow the standardized report template exactly — see the report format rules below. Every audit must return the same structure, filled with your evidence-based content.

${reportInstructions(language)}

=== SEO AUDIT SKILL ===
${skillText}
=== END SKILL ===`,
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
          ? `Проведи SEO-аудит для ${url}. Следуй методологии из навыка. Начни с главной страницы и ключевых шаблонов, используй предоставленные инструменты для сбора доказательств. Когда доказательств достаточно, верни ИТОГОВЫЙ отчёт строго по стандартизированному шаблону из системного промпта (все 16 секций + Scorecard + backlog + roadmap), заполненный собранным контентом. Ответ и отчёт должны быть полностью на русском языке.`
          : `Run an SEO audit for ${url}. Follow the skill methodology. Start with the homepage and key templates, use the provided tools to collect evidence. Once you have enough evidence, return the FINAL report strictly following the standardized template from the system prompt (all 16 sections + Scorecard + backlog + roadmap), filled with your collected content. The response and report must be entirely in English.`,
  };
}
