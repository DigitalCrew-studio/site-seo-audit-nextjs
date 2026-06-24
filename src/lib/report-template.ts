import type { AuditLanguage } from "@/lib/types";

/**
 * The canonical report template, aligned with the "Required final report
 * structure" from the updated site-seo-audit skill. The model MUST produce a
 * report matching this exact structure, filling each section with
 * evidence-based content.
 */
export const REPORT_TEMPLATE = `# SEO Audit Report: <site>

## Executive summary
- Overall status:
- Top risks:
- Top opportunities:
- What was verified:
- What was not assessed:

## Scorecard
| Category | Verified score | Potential score | Status | Notes |
|---|---:|---:|---|---|
| Technical Indexability | /20 | /20 |  |  |
| Metadata and SERP Presentation | /10 | /10 |  |  |
| Content and Search Intent Fit | /15 | /15 |  |  |
| JavaScript Rendering and Raw HTML | /10 | /10 |  |  |
| Structured Data and Entity Clarity | /10 | /10 |  |  |
| Internal Links and Crawl Hygiene | /10 | /10 |  |  |
| Performance and Mobile Usability | /15 | /15 |  |  |
| Off-page Links and Authority | /5 | /5 |  |  |
| Local / Social / Brand Entity | /3 | /3 |  |  |
| Analytics and Marketing Readiness | /2 | /2 |  |  |
| **Overall** | **/100** | **/100** |  |  |

## Top 5 priorities
<The five highest-impact actions, each with a one-line rationale>

## Findings
<One "Expanded finding" block per actionable issue, ordered by priority P0→P3>

## Roadmap
- 0-7 days:
- 2-4 weeks:
- 1-3 months:

## Validation checklist
<Concrete steps to confirm each major fix landed>

## Appendix
- Tested URLs:
- Tools/data used:
- Access/data required:`;

/**
 * The expanded finding block the model must use for every individual finding,
 * matching the "Required finding format" from the updated skill.
 */
export const FINDING_TEMPLATE = `### [P0/P1/P2/P3] <issue title>

- Area: <technical/indexability/content/rendering/schema/performance/regional/etc.>
- Affected URL(s): <URL list, pattern, or template name>
- Evidence: <URL, HTTP header, HTML snippet, rendered DOM observation, tool result, or stated limitation>
- Current state: <how the site behaves now>
- Expected state: <specific desired behavior>
- Why it matters: <impact on crawl/index/ranking/UX/conversions>
- Recommended fix: <specific fix>
- Validation method: <how to confirm the fix>
- Owner: <SEO/Frontend/Backend/DevOps/Content/Marketing>
- Confidence: <High/Medium/Low>`;

/** Strict instructions (localized) telling the model how to fill the template. */
export function reportInstructions(language: AuditLanguage): string {
  if (language === "ru") {
    return `## Формат отчёта (СТРОГО)

Ты ДОЛЖЕН вернуть отчёт, который СТРОГО следует приведённому ниже шаблону, секция за секцией, в указанном порядке. Заполни каждую секцию реальным содержимым на основе собранных через инструменты доказательств. Не пропускай секции. Если для секции нет данных, явно укажи «Не оценено» (Not assessed) вместо выдумывания.

Правила заполнения:
- Оцени Scorecard по 100-балльной модели. Если область не проверена — оставь Verified score = 0 и пометь Status как «Не оценено», не угадывай. Scores диагностические, не гарантии.
- Каждая отдельная находка в секции Findings должна использовать блок «Expanded finding» ниже со всеми полями, включая Confidence (High/Medium/Low).
- Выводы должны быть основаны только на реальных результатах инструментов и снабжены доказательствами.
- Заголовки секций, метки приоритетов (P0–P3), Confidence и категории Scorecard оставляй как в шаблоне; описательный текст — на русском.

### Шаблон отчёта:
\`\`\`md
${REPORT_TEMPLATE}
\`\`\`

### Шаблон отдельной находки (Expanded finding):
\`\`\`md
${FINDING_TEMPLATE}
\`\`\``;
  }

  return `## Report format (STRICT)

You MUST return a report that STRICTLY follows the template below, section by section, in the exact order shown. Fill every section with real content based on evidence collected via the tools. Do not skip sections. If you have no data for a section, explicitly mark it "Not assessed" rather than guessing.

Filling rules:
- Score the Scorecard using the 100-point model. If an area was not assessed, leave Verified score = 0 and set Status to "Not assessed" — never guess. Scores are diagnostic, not predictive.
- Every individual finding in the Findings section must use the "Expanded finding" block below with all fields populated, including Confidence (High/Medium/Low).
- Findings must be evidence-based, backed by real tool results.
- Keep section headers, priority labels (P0–P3), Confidence values, and Scorecard categories exactly as in the template.

### Report template:
\`\`\`md
${REPORT_TEMPLATE}
\`\`\`

### Expanded finding block:
\`\`\`md
${FINDING_TEMPLATE}
\`\`\``;
}
