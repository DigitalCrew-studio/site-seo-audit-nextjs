# Style Guide

Правила отступов, типографики, цветов и компонентов для проекта Seofriendly.
Основано на фактических значениях в `src/app/globals.css` и Tailwind utility-классов
в `src/app/**` и `src/components/**`.

---

## 1. Брейкпоинты

Tailwind-брейкпоинты по умолчанию:

| Префикс | Min-width | Назначение |
|---|---|---|
| (none) | 0 | mobile |
| `sm:` | 640px | крупный mobile / small tablet |
| `md:` | 768px | tablet |
| `lg:` | 1024px | desktop |
| `xl:` | 1280px | wide desktop |

Контейнер страницы: `max-w-6xl` (≈1152px).

---

## 2. Шкала отступов (padding / margin)

Все размеры в px. Привязка — к Tailwind-токенам (`p-1` = 4px, `p-2` = 8px и т.д.).

| Класс | px | Когда использовать |
|---|---|---|
| `p-1` / `m-1` | 4 | микро-отступы внутри иконок, бейджей |
| `p-2` / `m-2` | 8 | gap между dense-list элементами |
| `p-3` / `m-3` | 12 | паддинг sidebar-header, badge-кнопок |
| `p-4` / `m-4` | 16 | **compact** карточки (sidebar, sub-list, dense rows) |
| `p-5` / `m-5` | 20 | **regular** карточки (single-col lists, стат-блоки, FAQ details) |
| `p-6` / `m-6` | 24 | секции с одной колонкой, inner-gaps |
| `p-8` / `m-8` | 32 | крупные внутренние отступы |
| `p-10` / `m-10` | 40 | section break между большими секциями (только на `sm:`) |
| `p-12` / `m-12` | 48 | — |
| `p-14` / `m-14` | 56 | section break (default для крупных секций) |

### Глобальные пары mobile → sm

| Назначение | mobile | `sm:` |
|---|---|---|
| Горизонтальный паддинг контейнера страницы | `px-4` (16) | `sm:px-6` (24) |
| Вертикальный паддинг контейнера страницы | `py-10` (40) | `sm:py-14` (56) |
| Горизонтальный паддинг кнопок (Button, LinkButton) | `px-5` (20) | без изменений |
| Вертикальный паддинг кнопок | `py-2.5` (10) | без изменений |
| Минимальная высота кнопок | `min-h-[3rem]` (48) | без изменений |

---

## 3. Шкала паддингов карточек (4 размера)

Используется во всех `<Panel>`, `<SurfaceCard>`, ad-hoc `bg-surface` блоках.

| Размер | mobile | `sm:` | px (mobile / sm) | Где |
|---|---|---|---|---|
| **compact** | `p-4` | — | 16 | Sidebar (`AuditHistorySidebar`, settings), sub-list items |
| **regular** | `p-5` | `sm:p-6` | 20 / 24 | `PanelBody` (default), lists карточки, capability cards, deliverable cards, report card, EmptyState, intro cards |
| **large** | `p-6` | `sm:p-8` | 24 / 32 | Hero/feature-карточки (knowledge section cards, audit intro, services main card, services-CTA, финальный CTA) |
| **cta** | `p-6` | `sm:p-8` | 24 / 32 | Финальный CTA-блок (равен `large` — кресчендо снято) |

> Кресчендо внутри одной страницы запрещено. Все hero-карточки на странице
> должны быть в одном размере. Если визуально нужно усилить финальный CTA —
> делается через контент (тёмный фон, более крупный заголовок), не через padding.

### Специальные плотные форматы (не масштабируются)

| Формат | Класс | Где |
|---|---|---|
| Checklist item (список с иконкой) | `px-3.5 py-2.5` | `page.tsx` — «Что именно видит Seofriendly» |
| Sidebar header | `px-4 py-3` | `AuditHistorySidebar.tsx`, `AuditForm.tsx` footer |
| StatusNotice | `px-4 py-3` | `ui/StatusNotice.tsx` |
| SwitchRow | `px-4 py-3` | `ui/SwitchRow.tsx` |
| FAQ `<details>` | `px-5 py-4` | home / services / contacts — все FAQ-блоки |
| AuditForm footer | `px-5 py-4 sm:px-6` | `AuditForm.tsx` |
| Settings row item | `px-3 py-2.5` | settings page |
| Audit artifact item | `p-4` | `audit/page.tsx` (sub-list) |

---

## 4. Вертикальный ритм между секциями

Стандарт для **section break** на всех страницах (между крупными блоками):

| Класс | px | Когда |
|---|---|---|
| `mt-10` | 40 | между closely-related секциями (например, knowledge nav → sections) |
| `mt-12` | 48 | section break в плотных страницах (about, services) |
| `mt-14` | 56 | section break на главной странице (стандарт) |

**Правило:** в пределах одной страницы все `mt-N` для section-break должны
совпадать. Не смешивать `mt-12` и `mt-14` в одном списке секций.

Для **внутренних отступов внутри секции** (заголовок → контент, контент →
следующий блок внутри одной секции) использовать `mt-3`, `mt-4`, `mt-5`.

---

## 5. Типографика

Шрифты:
- `--font-plex-sans` (IBM Plex Sans) — основной, 400/500/600/700
- `--font-plex-mono` (IBM Plex Mono) — для технических строк, логов, кода

### Размеры и иерархия

| Роль | Класс | px | line-height | tracking |
|---|---|---|---|---|
| Display (h1, hero) | `text-[2.35rem] sm:text-[3rem]` | 37.6 / 48 | `leading-[1.05]` | `tracking-tight` |
| H1 (page) | `text-2xl sm:text-[1.75rem]` | 24 / 28 | — | `tracking-tight` |
| H2 (section) | `text-2xl` или `text-xl` | 24 / 20 | — | `tracking-tight` |
| H3 (card title) | `text-[14px] font-semibold` | 14 | `leading-tight` | `tracking-tight` |
| Body large | `text-[15px] leading-relaxed` | 15 | 1.625 | — |
| Body | `text-sm leading-relaxed` | 14 | 1.625 | — |
| Body small | `text-[13px] leading-relaxed` | 13 | 1.625 | — |
| Caption | `text-[12px]` | 12 | — | — |
| Code/mono | `font-mono text-[12px]` | 12 | 1.45 | — |

### Eyebrow / label

Класс `.eyebrow` (в `globals.css:40-46`):

```
font-mono, 12px, line-height 1, letter-spacing 0.14em, uppercase
```

Используется для маленьких подписей над заголовками, бейджей разделов.

---

## 6. Цвета

Базовые токены в `@theme` (`globals.css:4-19`):

| Токен | HEX | Назначение |
|---|---|---|
| `--color-paper` | `#f6f5f1` | фон страницы |
| `--color-surface` | `#ffffff` | фон карточек / панелей |
| `--color-ink` | `#1b1b19` | основной текст, тёмный CTA, sticky header bg |
| `--color-ink-soft` | `#3d3d38` | вторичный текст (заголовки внутри карточек) |
| `--color-muted` | `#6f6e68` | body-текст, описание |
| `--color-faint` | `#9a9890` | подписи, hints, мелкие метки |
| `--color-line` | `#e3e1d9` | границы карточек, разделители |
| `--color-line-strong` | `#d3d1c7` | границы кнопок, hover-state |
| `--color-accent` | `#b45309` | CTA, ссылки-акценты, статус «running» |
| `--color-accent-soft` | `#f3ece1` | фон для accent-карточек |
| `--color-positive` | `#15803d` | «успех», check-circle иконки, report ready |

`::selection` инвертирован: фон `ink`, текст `paper`.

---

## 7. Тени

Стандартная мягкая тень для elevated-карточек:

```
shadow-[0_18px_70px_rgba(27,27,25,0.06)]   // лёгкая
shadow-[0_18px_80px_rgba(27,27,25,0.07)]   // средняя
shadow-[0_18px_80px_rgba(27,27,25,0.12)]   // сильная (тёмный CTA)
shadow-[0_18px_60px_rgba(27,27,25,0.08)]   // hover для card-list
shadow-[0_18px_70px_rgba(27,27,25,0.12)]   // sticky AppBar (compact)
shadow-[0_12px_45px_rgba(27,27,25,0.045)]  // knowledge-term card
shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]  // inset highlight
```

---

## 8. Скругления

| Класс | px | Когда |
|---|---|---|
| `rounded-md` | 6 | маленькие inline-элементы, кнопки в sidebar |
| `rounded-lg` | 8 | кнопки, badge, основные контролы |
| `rounded-xl` | 12 | стандартные карточки, Panel |
| `rounded-2xl` | 16 | крупные hero-карточки, CTA-секции, sticky header (compact) |
| `rounded-full` | 9999 | бейджи, круглые кнопки, иконки-аватары |

---

## 9. Анимации

Глобальные утилиты в `globals.css:104-175`:

- `.ambient-float` — медленный float (7s)
- `.ambient-glow` — пульсация opacity+scale (8s)
- `.soft-sheen` — sheen-эффект при hover (1.2s)
- `.pulse-dot` — пульсирующая точка (1.6s)
- `.card-spotlight` + `.card-spotlight-glow` — spotlight по курсору на bento-карточках

Все уважают `prefers-reduced-motion: reduce` — анимации отключаются.

---

## 10. Кнопки

Два базовых компонента: `Button` (`<button>`) и `LinkButton` (`<a>` через `next/link`).

### Базовые параметры (одинаковые у обоих)

```
inline-flex shrink-0 items-center justify-center gap-2 rounded-lg whitespace-nowrap
min-h-[3rem] px-5 py-2.5 text-sm
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20
focus-visible:ring-offset-2 focus-visible:ring-offset-paper
```

### Варианты

| Variant | Классы | Где |
|---|---|---|
| `primary` | `bg-ink font-semibold text-paper hover:bg-ink-soft` | основной CTA (audit запустить, settings сохранить) |
| `secondary` | `border border-line-strong bg-surface text-ink-soft hover:border-ink hover:text-ink` | вторичный CTA |
| `outline` | `border border-ink text-ink hover:bg-ink hover:text-paper` | outline CTA (link-button only) |
| `inverse` | `bg-paper text-ink hover:bg-accent-soft` | CTA на тёмном фоне (link-button only) |

### Расположение в CTA-блоках

На мобиле кнопка занимает `w-full`. На `sm:` — `w-auto` (естественная ширина).
Группа кнопок: `flex flex-col gap-3 sm:flex-row sm:items-center`.

### Inline actions (sidebar)

Мелкие действия (Cancel/Delete/Stop) переопределяют padding через className:
`px-2 py-0.5` или `rounded-md px-2.5 py-1.5`. Не использовать базовый `min-h-[3rem]`.

---

## 11. Формы

### Поля ввода (Input, Select)

```
min-h-[2.875rem]   // 46px
px-3.5 py-3 text-sm leading-5
rounded-[10px]
border border-line bg-surface text-ink
focus:border-ink focus:shadow-[0_0_0_3px_rgba(27,27,25,0.08)]
```

Слоты: `leftSlot` → `pl-10`, `rightSlot` → `pr-11`.

### FieldLabel

`eyebrow text-muted` (12px, uppercase, mono) с возможным `hint` справа.

### SegmentedControl

Контейнер `rounded-lg border border-line bg-surface p-1` (внешний паддинг 4px).
Кнопки: `min-h-[2.5rem] rounded-md px-3 py-2`.

### SwitchRow

`rounded-lg border border-line bg-paper/60 px-4 py-3`.

### Form layout

- Label → gap `space-y-2` → Input
- Группа полей → `space-y-5` (внутри `PanelBody`)
- Между крупными группами → `space-y-6`

---

## 12. Panel API

```tsx
<Panel>                                    // по умолчанию <section>
  <PanelHeader title="..." description="..." meta={...} action={...} />
  <PanelBody>...</PanelBody>               // p-5 sm:p-6
</Panel>
```

`PanelHeader` имеет фиксированный внутренний padding `px-5 py-4 sm:px-6` —
**не масштабируется** в `PanelBody`, чтобы шапка оставалась визуально плотнее
тела (header = chrome, body = content).

`Panel` принимает `as="section" | "aside" | "div"`.

---

## 13. SurfaceCard

Минималистичный блок без padding (всё задаёт потребитель):

```
rounded-xl border
tone: "surface" | "paper" | "accent" | "ink"
```

Использовать, когда нужен кастомный padding (например, `px-3 py-2.5` для dense lists).

---

## 14. AppBar и Footer

AppBar (sticky):
- mobile: `h-[108px]`, десктоп сохраняет ту же высоту; при скролле >12px → `h-[76px]`,
  border-radius → `rounded-full`, shadow усиливается.
- Горизонтальный паддинг: `px-4 sm:px-6` (синхронизирован с контейнером страницы).

Footer:
- Контейнер: `px-4 py-10 sm:px-6 sm:py-14` (стандарт).

---

## 15. Иконки

`lucide-react`. Стандартный размер:

| Контекст | Класс | px |
|---|---|---|
| Inline в тексте | `h-3.5 w-3.5` | 14 |
| В кнопке рядом с label | `h-4 w-4` | 16 |
| В icon-боксе карточки | `h-4.5 w-4.5` | 18 |
| Большая иконка CTA | `h-5 w-5` | 20 |

Кастомный размер `h-4.5 w-4.5` (18px) задан в `@theme` (Tailwind v4).

---

## 16. Доступность

- Все интерактивные элементы с touch-таргетом ≥ 48px (`min-h-[3rem]`,
  `min-h-[44px]`, `min-h-[48px]`).
- Burger-кнопка AppBar: `touch-action: manipulation`, `WebkitTapHighlightColor: transparent`.
- `aria-current="page"` для активного пункта навигации.
- `aria-expanded` на `<details>` и `panel`-кнопках.
- `aria-live` для динамических уведомлений.
- Иконки без текста: `aria-hidden="true"`; кнопки с иконкой: `aria-label`.

---

## 17. Файловая структура UI-компонентов

```
src/components/
  AppBar.tsx              // sticky header с компакт-режимом
  Footer.tsx              // footer
  AuditForm.tsx           // форма запуска аудита
  AuditHistorySidebar.tsx // сайдбар истории
  AuditWorkspaceEmpty.tsx // заглушка пустого workspace
  CapabilityBentoCard.tsx // bento-карточка для capabilities
  ConsentBanner.tsx       // баннер согласия на аналитику
  HeroAuditGraphic.tsx    // SVG-графика для hero
  Logo.tsx / LogoMark.tsx // брендинг
  ProcessLog.tsx          // терминал-лог с прокруткой
  ReportCard.tsx          // карточка «отчёт готов»
  ReportDialog.tsx        // модальный отчёт
  ScreenshotGallery.tsx   // галерея + lightbox
  SettingsForm.tsx        // форма настроек
  ui/                     // переиспользуемые UI-кирпичи
    Badge.tsx
    Breadcrumbs.tsx
    Button.tsx
    EmptyState.tsx
    FieldLabel.tsx
    Input.tsx
    LinkButton.tsx
    PageHeader.tsx
    Panel.tsx
    SectionHeader.tsx
    SegmentedControl.tsx
    Select.tsx
    StatusNotice.tsx
    SurfaceCard.tsx
    SwitchRow.tsx
    index.ts               // barrel export
```
