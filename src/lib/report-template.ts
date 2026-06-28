import type { AuditLanguage } from "@/lib/types";

const RU_REPORT_TEMPLATE = `# SEO-диагностика: <site>

## Исполнительное заключение
<1-3 предложения: общее диагностическое состояние SEO (критично / неудовлетворительно / удовлетворительно / хорошо), краткая сводка по индексируемости, метаданным, контенту, производительности. Только диагноз, без рекомендаций и плана действий.>

## Снимок состояния SEO
<Свободная диагностическая сводка: 4-7 пунктов, текущее состояние vs ожидаемая норма для каждой ключевой области: индексируемость, метаданные, контент, производительность, техническая гигиена, доверие, измеримость.>

## Матрица охвата проверок
| Область / инструмент | Статус охвата | Краткие доказательства |
|---|---|---|
| inspect_http | Проверено / Частично / Не оценено / Требует данных | <короткая ссылка на результат> |
| inspect_page_seo | ... | ... |
| parse_sitemap | ... | ... |
| crawl_site_sample | ... | ... |
| extract_structured_data | ... | ... |
| inspect_social_preview | ... | ... |
| inspect_hreflang | ... | ... |
| resource_inventory | ... | ... |
| run_lighthouse | ... | ... |
| inspect_responsive_rendering | ... | ... |
| inspect_analytics_tags | ... | ... |
| check_link_health | ... | ... |
| inspect_llms_txt | ... | ... |
| inspect_entity_trust | ... | ... |
| dns_and_security_check | ... | ... |
| batch_check_urls | ... | ... |

## Скоркард
| Категория | Проверено | Статус | Краткий комментарий |
|---|---:|---|---|
| Техническая индексируемость | /20 |  |  |
| Метаданные и SERP-представление | /10 |  |  |
| Контент и поисковый интент | /15 |  |  |
| JS-рендеринг и сырой HTML | /10 |  |  |
| Структурированные данные | /10 |  |  |
| Внутренние ссылки и краулинг | /10 |  |  |
| Производительность и адаптивность интерфейса | /15 |  |  |
| Локальность / сущность / соцсети | /5 |  |  |
| Аналитика и маркетинговая готовность | /5 |  |  |
| **Общий итог** | **/100** |  |  |

## Диагностика Lighthouse / производительности
### Mobile Lighthouse
- LCP: <цвет и шкала █/░> — <значение, норма>
- CLS: <цвет и шкала> — <значение, норма>
- TBT: <цвет и шкала> — <значение, норма>
- FCP: <цвет и шкала> — <значение, норма>
- TTI: <цвет и шкала> — <значение, норма>
- Performance score: <цвет и шкала> — <значение, норма>
- Accessibility: <цвет и шкала> — <значение, норма>
- Best Practices: <цвет и шкала> — <значение, норма>
- SEO: <цвет и шкала> — <значение, норма>
### Desktop Lighthouse
- LCP: <цвет и шкала █/░> — <значение, норма>
- CLS: <цвет и шкала> — <значение, норма>
- TBT: <цвет и шкала> — <значение, норма>
- FCP: <цвет и шкала> — <значение, норма>
- TTI: <цвет и шкала> — <значение, норма>
- Performance score: <цвет и шкала> — <значение, норма>
- Accessibility: <цвет и шкала> — <значение, норма>
- Best Practices: <цвет и шкала> — <значение, норма>
- SEO: <цвет и шкала> — <значение, норма>
(Если какой-то из прогонов Mobile/Desktop Lighthouse не выполнен — явно указать «Не оценено», указать, какая именно конфигурация не запустилась (formFactor: mobile / desktop, configPreset: desktopConfig / fallbackDesktop / defaultMobile), и привести текст ошибки инструмента.)

## Рендеринг по устройствам
| Профиль | Viewport | Overflow | H1 above fold | Primary nav | Small text | Tap issues | Screenshot |
|---|---:|---|---|---|---:|---:|---|
| Desktop | 1440×900 | да/нет, <px>px | да/нет | виден/не виден | <count> | <count> | да/нет |
| Laptop | 1366×768 | ... | ... | ... | ... | ... | ... |
| Tablet | 768×1024 | ... | ... | ... | ... | ... | ... |
| Mobile | 390×844 | ... | ... | ... | ... | ... | ... |
(Одна строка на каждый из профилей, проверенных inspect_responsive_rendering; если профилей было меньше — пометить отсутствующие как «Не оценено». Small text — число элементов с font-size < 12px; Tap issues — число интерактивных элементов < 48×48 CSS px. Screenshot — есть ли JPEG, сохранённый в галерее отчёта. Overflow и H1 above fold показывают, как страница ведёт себя в данном viewport.)

## Постраничная визуальная проверка
| URL | Проверенные профили | Скриншоты | Overflow | H1 above fold | Small text | Tap issues | Визуальные наблюдения |
|---|---|---:|---|---|---:|---:|---|
| ... | Desktop / Mobile / Tablet / Laptop | <count> | да/нет, <профили> | да/нет, <профили> | <count> | <count> | <краткое наблюдение по скриншотам и rendering evidence> |
(Заполни по всем page-by-page вызовам inspect_responsive_rendering из preflight/follow-up. Укажи реальное количество скриншотов и профили для каждой страницы. Если проверена только главная — так и укажи ограничение.)

## Анализ по категориям
<Свободный диагностический текст по каждой ключевой области, объединяющий факты. Только наблюдения, без рекомендаций и плана действий.>

## Основные SEO-риски
| Область | URL | Доказательство | Текущее состояние | Норма или ориентир | Значение для SEO | Серьёзность | Достоверность |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | Критично / Высокая / Средняя / Низкая / Инфо | Высокая / Средняя / Низкая |
(Одна строка на каждый значимый риск. Без владельцев, сроков или шагов внедрения.)

## Рекомендации по улучшению
| Приоритет | Область | Рекомендация | Основание | Ожидаемый эффект | Источник |
|---|---|---|---|---|---|
| Высокий / Средний / Низкий | Lighthouse / техническое SEO / контент / аналитика / безопасность | <конкретная рекомендация без владельца и срока> | <факт из инструмента или наблюдение> | <какая метрика или SEO-риск может улучшиться> | <инструмент: run_lighthouse / inspect_page_seo / ...> |
(Включи рекомендации Lighthouse из opportunities/diagnostics/failedAudits, если они есть. Разрешены практические рекомендации, но без roadmap, owners, timeline, sprint и бэклога.)

## Не оценено / ограничения
<Что не удалось проверить внутри URL-only аудита: например, инструмент не запустился, доступ закрыт, данных на публичной странице нет, проверка требует авторизованного API. Не упоминай недоступные внешние кабинеты, загруженные отчёты или внешние экспортные файлы как «не предоставлено», потому что текущий интерфейс принимает только URL.>

## Приложение с доказательствами
- Целевой URL:
- Протестированные URL:
- Использованные инструменты:
- Использованные данные: URL-only публичные данные и результаты инструментов
- HTTP-статусы и заголовки (выборка):
- Сводка по sitemap.xml:
- Краткая сводка Lighthouse / PageSpeed:

## Финальное заключение
<1-2 предложения: итоговая диагностическая оценка. Без плана действий, roadmap, владельцев или сроков.>`;

const EN_REPORT_TEMPLATE = `# SEO diagnostic: <site>

## Executive conclusion
<1-3 sentences: overall SEO diagnostic state (critical / unsatisfactory / satisfactory / good), short summary of indexability, metadata, content, performance. Diagnosis only — no recommendations or plan.>

## SEO health snapshot
<Free-form diagnostic summary: 4-7 bullets, current state vs expected benchmark for each key area: indexability, metadata, content, performance, technical hygiene, trust, measurability.>

## Check coverage matrix
| Area / tool | Coverage status | Brief evidence |
|---|---|---|
| inspect_http | Checked / Partially checked / Not assessed / Requires data | <short result pointer> |
| inspect_page_seo | ... | ... |
| parse_sitemap | ... | ... |
| crawl_site_sample | ... | ... |
| extract_structured_data | ... | ... |
| inspect_social_preview | ... | ... |
| inspect_hreflang | ... | ... |
| resource_inventory | ... | ... |
| run_lighthouse | ... | ... |
| inspect_responsive_rendering | ... | ... |
| inspect_analytics_tags | ... | ... |
| check_link_health | ... | ... |
| inspect_llms_txt | ... | ... |
| inspect_entity_trust | ... | ... |
| dns_and_security_check | ... | ... |
| batch_check_urls | ... | ... |

## Scorecard
| Category | Verified | Status | Short comment |
|---|---:|---|---|
| Technical indexability | /20 |  |  |
| Metadata and SERP presentation | /10 |  |  |
| Content and search intent fit | /15 |  |  |
| JS rendering and raw HTML | /10 |  |  |
| Structured data | /10 |  |  |
| Internal links and crawl hygiene | /10 |  |  |
| Performance and interface adaptability | /15 |  |  |
| Local / entity / social | /5 |  |  |
| Analytics and marketing readiness | /5 |  |  |
| **Overall** | **/100** |  |  |

## Lighthouse / performance diagnostics
### Mobile Lighthouse
- LCP: <color and gauge █/░> — <value, benchmark>
- CLS: <color and gauge> — <value, benchmark>
- TBT: <color and gauge> — <value, benchmark>
- FCP: <color and gauge> — <value, benchmark>
- TTI: <color and gauge> — <value, benchmark>
- Performance score: <color and gauge> — <value, benchmark>
- Accessibility: <color and gauge> — <value, benchmark>
- Best Practices: <color and gauge> — <value, benchmark>
- SEO: <color and gauge> — <value, benchmark>
### Desktop Lighthouse
- LCP: <color and gauge █/░> — <value, benchmark>
- CLS: <color and gauge> — <value, benchmark>
- TBT: <color and gauge> — <value, benchmark>
- FCP: <color and gauge> — <value, benchmark>
- TTI: <color and gauge> — <value, benchmark>
- Performance score: <color and gauge> — <value, benchmark>
- Accessibility: <color and gauge> — <value, benchmark>
- Best Practices: <color and gauge> — <value, benchmark>
- SEO: <color and gauge> — <value, benchmark>
(If a Mobile or Desktop Lighthouse run did not complete, explicitly mark "Not assessed", state which configuration failed (formFactor: mobile / desktop, configPreset: desktopConfig / fallbackDesktop / defaultMobile), and quote the tool's actual error message — do not label it simply as "not assessed".)

## Rendering by device
| Profile | Viewport | Overflow | H1 above fold | Primary nav | Small text | Tap issues | Screenshot |
|---|---:|---|---|---|---:|---:|---|
| Desktop | 1440×900 | yes/no, <px>px | yes/no | visible/missing | <count> | <count> | yes/no |
| Laptop | 1366×768 | ... | ... | ... | ... | ... | ... |
| Tablet | 768×1024 | ... | ... | ... | ... | ... | ... |
| Mobile | 390×844 | ... | ... | ... | ... | ... | ... |
(One row per profile checked by inspect_responsive_rendering; if some profiles were not requested, mark them "Not assessed". Small text = number of elements with font-size < 12px; Tap issues = number of interactive controls smaller than 48×48 CSS px. Screenshot = whether a JPEG was captured and stored in the report gallery. Overflow and H1 above fold show how the page behaves in that specific viewport.)

## Page-by-page visual check
| URL | Checked profiles | Screenshots | Overflow | H1 above fold | Small text | Tap issues | Visual observations |
|---|---|---:|---|---|---:|---:|---|
| ... | Desktop / Mobile / Tablet / Laptop | <count> | yes/no, <profiles> | yes/no, <profiles> | <count> | <count> | <short observation based on screenshots and rendering evidence> |
(Fill this from all page-by-page inspect_responsive_rendering calls in preflight/follow-up. State the real screenshot count and profiles for each page. If only the homepage was checked, state that limitation.)

## Category analysis
<Free-form diagnostic narrative per key area, summarising facts. Observations only, no recommendations or action plan.>

## Main SEO risks
| Area | URL | Evidence | Current state | Normal benchmark | SEO implication | Severity | Confidence |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | Critical / High / Medium / Low / Info | High / Medium / Low |
(One row per significant risk. No owners, timelines, or implementation steps.)

## Improvement recommendations
| Priority | Area | Recommendation | Basis | Expected effect | Source |
|---|---|---|---|---|---|
| High / Medium / Low | Lighthouse / technical SEO / content / analytics / security | <specific recommendation without owner or deadline> | <tool fact or observation> | <metric or SEO risk that may improve> | <tool: run_lighthouse / inspect_page_seo / ...> |
(Include Lighthouse recommendations from opportunities/diagnostics/failedAudits when available. Practical recommendations are allowed, but do not include roadmap, owners, timeline, sprint, or backlog.)

## Not assessed / limitations
<What could not be tested within the URL-only audit: e.g. a tool failed, public access was blocked, public page data was absent, or an authenticated API would be required. Do not mention unavailable external dashboards, uploaded reports, or external export files as “not provided”, because the current interface accepts only a URL.>

## Evidence appendix
- Target URL:
- Tested URLs:
- Tools used:
- Data used: URL-only public data and tool results
- HTTP statuses and headers (sample):
- sitemap.xml summary:
- Lighthouse / PageSpeed summary:

## Final conclusion
<1-2 sentences: final diagnostic verdict. No action plan, roadmap, owners, or timelines.>`;

const RU_BENCHMARKS = `- HTTP-каноникал: индексируемые страницы должны отвечать 200 и быть self-canonical там, где это уместно.
- sitemap.xml: должен содержать только канонические индексируемые URL (без noindex, без 404, без параметризованных/приватных страниц).
- Title: обычно 30-60 символов, уникальный, релевантный содержимому.
- Meta description: обычно 120-160 символов, уникальный, отражает суть страницы.
- H1: на основной (и большинстве) странице должен быть один чёткий H1.
- LCP: хорошо ≤ 2.5s, требует улучшения 2.5-4s, плохо > 4s.
- CLS: хорошо ≤ 0.1.
- TBT: хорошо ≤ 200ms.
- Lighthouse Performance: хорошо ≥ 90, требует улучшения 50-89, плохо < 50.
- Tap targets: обычно ≥ 48x48 CSS px.
- Читаемый мобильный текст: обычно ≥ 12-14px.
- OG image: обычно 1200x630 и достаточно лёгкий (ориентир < 300KB).
- hreflang: должен включать валидные взаимные ссылки и x-default там, где это уместно.
- Аналитика/измерения: не прямой фактор ранжирования; отмечай только готовность/наблюдаемость.
- Безопасность / DNS / email-trust: техническое доверие и операционная готовность, не прямой фактор ранжирования.`;

const EN_BENCHMARKS = `- HTTP canonical: indexable pages should return 200 and be self-canonical where appropriate.
- sitemap.xml: should contain only canonical indexable URLs (no noindex, no 404, no parameter / private URLs).
- Title: typically 30-60 chars, unique, relevant to the page content.
- Meta description: typically 120-160 chars, unique, summarises the page.
- H1: the main page (and most pages) should normally have one clear H1.
- LCP: good ≤ 2.5s, needs improvement 2.5-4s, poor > 4s.
- CLS: good ≤ 0.1.
- TBT: good ≤ 200ms.
- Lighthouse Performance: good ≥ 90, needs improvement 50-89, poor < 50.
- Tap targets: typically ≥ 48x48 CSS px.
- Readable mobile text: typically ≥ 12-14px.
- OG image: typically 1200x630 and reasonably lightweight (< 300KB guideline).
- hreflang: should include valid reciprocals and x-default where appropriate.
- Analytics / measurement: not a direct ranking factor; report readiness / observability only.
- Security / DNS / email trust: technical trust and operational readiness, not direct SEO ranking factors.`;

const RU_GAUGE_LEGEND = `- 🟢 хорошо: ██████████ / █████████░ / ████████░░ / ...
- 🟡 требует улучшения: ██████░░░░ / █████░░░░░ / ████░░░░░░ / ...
- 🔴 плохо: ███░░░░░░░ / ██░░░░░░░░ / █░░░░░░░░░ / ...
Используй 10 сегментов; подбирай уровень заполнения под результат.`;

const EN_GAUGE_LEGEND = `- 🟢 good: ██████████ / █████████░ / ████████░░ / ...
- 🟡 needs improvement: ██████░░░░ / █████░░░░░ / ████░░░░░░ / ...
- 🔴 poor: ███░░░░░░░ / ██░░░░░░░░ / █░░░░░░░░░ / ...
Use 10 segments; choose the fill level to reflect the result.`;

export function reportInstructions(language: AuditLanguage): string {
  if (language === "ru") {
    return `## Формат отчёта (СТРОГО)

Этот шаблон ДИАГНОСТИЧЕСКОГО отчёта имеет приоритет над любым другим форматом отчётности, упомянутым в подключённом SEO-навыке (включая старые карточки находок, приоритетные списки, roadmap-секции, чек-листы валидации, поля владельцев/сроков, спринты и бэклоги). Отчёт ДОЛЖЕН быть человекочитаемой диагностикой с отдельным разделом рекомендаций, а не задачником.

Ты ДОЛЖЕН вернуть отчёт, который СТРОГО следует приведённому ниже шаблону, секция за секцией, в указанном порядке. Все видимые заголовки, заголовки таблиц, метки статусов и категории скоркарда — строго на русском языке (допускаются только устоявшиеся технические термины: canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, FCP, TTI, Lighthouse, Performance, Accessibility, Best Practices, JSON-LD, Open Graph и т.п.). Заполни каждую секцию реальным содержимым на основе собранных через инструменты доказательств. Не пропускай секции. Если для секции нет данных, явно укажи «Не оценено» или «Требует данных» и объясни почему — никогда не выдумывай факты.

Правила заполнения:
- Скоркард оценивается по 100-балльной URL-only модели. Оценивай только области, которые можно проверить по публичному URL и доступным инструментам. Не добавляй штрафы за недоступные внешние кабинеты, загруженные отчёты, внешние экспортные файлы или другие данные, которые текущий интерфейс не принимает. Если область из URL-only набора не проверена — оставь «Проверено» = 0 и пометь «Статус» как «Не оценено», не угадывай. Баллы диагностические, не прогноз позиций.
- Таблица «Основные SEO-риски» — одна строка на риск. Колонки строго: Область, URL, Доказательство, Текущее состояние, Норма или ориентир, Значение для SEO, Серьёзность, Достоверность. Рекомендации выноси только в отдельный раздел «Рекомендации по улучшению». ЗАПРЕЩЕНО добавлять колонки «Owner», «Timeline», «Sprint», «Priority P0–P3» в виде владельцев или сроков — это диагностика, а не бэклог.
- В разделе «Матрица охвата проверок» перечисли ВСЕ доступные URL-only области/инструменты аудита (HTTP, page SEO, sitemap, crawl, structured data, social preview, hreflang, resource inventory, Lighthouse, responsive rendering по desktop/laptop/tablet/mobile, analytics, link health, llms.txt, entity trust, DNS/security, batch URL checks). Для каждой укажи: Проверено / Частично / Не оценено / Требует данных. Не добавляй строки про недоступные внешние кабинеты, загруженные отчёты или внешние экспортные файлы.
- В разделе «Диагностика Lighthouse / производительности» используй ТЕКСТОВЫЕ ШКАЛЫ, например «🟢 ██████████», «🟡 ██████░░░░», «🔴 ███░░░░░░░», для каждой метрики: LCP, CLS, TBT, FCP, TTI, Performance, Accessibility, Best Practices, SEO. Если метрика недоступна — «Не оценено» с причиной.
- Раздел «Постраничная визуальная проверка» обязателен: используй все результаты inspect_responsive_rendering, включая дополнительные page-by-page скриншоты crawled URL. Не своди визуальную проверку только к 4 скриншотам главной, если preflight собрал больше страниц.
- В визуальных наблюдениях описывай только факты из inspect_responsive_rendering и сохранённых скриншотов. Не добавляй наблюдения про карту, контраст, iPhone SE, alt у иконок, формы или конкретные кнопки, если таких данных нет в evidence.
- Каждая строка Markdown-таблицы должна быть на отдельной строке. Не склеивай header row, separator row и data rows в один абзац. Перед и после каждой таблицы оставляй пустую строку.
- Раздел «Рекомендации по улучшению» обязателен: включи практические рекомендации на основе собранных доказательств, особенно Lighthouse opportunities/diagnostics/failedAudits. Не выдумывай рекомендации без фактов.
- ЗАПРЕЩЕНО: roadmap, владельцы, сроки, спринты, бэклоги, чек-листы валидации как задачи. Отчёт диагностический, а не плановый.
- ЗАПРЕЩЕНО использовать старую структуру навыка: отдельные приоритетные списки, квадратные метки P0-P3, карточки находок с полем проверки/валидации, секции внешней авторитетности без данных и названия недоступных внешних провайдеров данных как ограничения.
- Стиль должен быть нейтральным диагностическим. Не используй «безупречный», «идеальный», «эталонный» и похожую рекламную лексику; вместо этого пиши «по проверенным данным проблем не обнаружено».
- Не выводи <think>, chain-of-thought, скрытые заметки или code fence. Только сам отчёт.

### Ориентиры и нормативы (используй для сравнения с фактами):
${RU_BENCHMARKS}

### Текстовая шкала для метрик:
${RU_GAUGE_LEGEND}

### Шаблон отчёта:
\`\`\`md
${RU_REPORT_TEMPLATE}
\`\`\``;
  }

  return `## Report format (STRICT)

This DIAGNOSTIC report template takes priority over any other reporting format inside the attached SEO skill (including older finding-card structures, priority-list sections, roadmap sections, validation checklists, owner/timeline fields, sprints, or task backlogs). The report MUST be a human-readable SEO diagnostic with a dedicated recommendations section, not a task backlog.

You MUST return a report that STRICTLY follows the template below, section by section, in the exact order shown. Every visible heading, table header, status label, and Scorecard category label MUST be strictly in English (only established technical terms are allowed: canonical, hreflang, x-default, noindex, robots.txt, sitemap.xml, LCP, CLS, TBT, FCP, TTI, Lighthouse, Performance, Accessibility, Best Practices, JSON-LD, Open Graph, and similar). Fill every section with real content based on evidence collected via the tools. Do not skip sections. If you have no data for a section, explicitly mark it "Not assessed" or "Requires data" and explain why — never invent facts.

Filling rules:
- Score the Scorecard using the 100-point URL-only model. Assess only areas that can be checked from the public URL and available tools. Do not penalize for unavailable external dashboards, uploaded reports, external export files, or other inputs that the current interface does not accept. If a URL-only area was not assessed, leave "Verified" = 0 and set "Status" to "Not assessed" — never guess. Scores are diagnostic, not predictive.
- The "Main SEO risks" table is one row per risk. Columns are strictly: Area, URL, Evidence, Current state, Normal benchmark, SEO implication, Severity, Confidence. Put recommendations only in the dedicated "Improvement recommendations" section. DO NOT add "Owner", "Timeline", "Sprint", or "Priority P0–P3" columns used as owners or schedules — this is a diagnostic, not a backlog.
- In the "Check coverage matrix" section, list EVERY available URL-only audit area / tool group (HTTP, page SEO, sitemap, crawl, structured data, social preview, hreflang, resource inventory, Lighthouse, responsive rendering across desktop / laptop / tablet / mobile, analytics, link health, llms.txt, entity trust, DNS/security, batch URL checks). For each, mark: Checked / Partially checked / Not assessed / Requires data. Do not add rows for unavailable external dashboards, uploaded reports, or external export files.
- In the "Lighthouse / performance diagnostics" section, use TEXTUAL GAUGES such as "🟢 ██████████", "🟡 ██████░░░░", "🔴 ███░░░░░░░" for each metric: LCP, CLS, TBT, FCP, TTI, Performance, Accessibility, Best Practices, SEO. If a metric is unavailable, mark "Not assessed" and state the reason.
- The "Page-by-page visual check" section is required: use all inspect_responsive_rendering results, including additional page-by-page screenshots for crawled URLs. Do not reduce visual checking to only the 4 homepage screenshots when preflight collected more pages.
- In visual observations, describe only facts from inspect_responsive_rendering and stored screenshots. Do not add observations about maps, contrast, iPhone SE, icon alt text, forms, or specific buttons unless those facts are present in evidence.
- Every Markdown table row must be on its own line. Do not merge the header row, separator row, and data rows into one paragraph. Leave a blank line before and after each table.
- The "Improvement recommendations" section is required: include practical recommendations based on collected evidence, especially Lighthouse opportunities/diagnostics/failedAudits. Do not invent recommendations without evidence.
- DO NOT include: roadmap, owners, timelines, sprints, backlogs, or validation checklists framed as tasks. The report is diagnostic, not a plan.
- DO NOT use the old skill structure: separate priority lists, square P0-P3 labels, individual finding cards with validation/check-method fields, external-authority sections without data, or unavailable external data-provider names as limitations.
- Use neutral diagnostic language. Do not use "perfect", "flawless", "best-in-class", or similar marketing praise; instead write "no issue was found in the checked evidence".
- Do not output <think>, chain-of-thought, hidden notes, or code fences. Only the report.

### Benchmark / reference values (use them to compare facts):
${EN_BENCHMARKS}

### Textual gauge legend:
${EN_GAUGE_LEGEND}

### Report template:
\`\`\`md
${EN_REPORT_TEMPLATE}
\`\`\``;
}
