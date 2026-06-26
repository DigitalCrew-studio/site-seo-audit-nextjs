import type { CapabilityIconKey } from "@/lib/capabilityIcons";

export type { CapabilityIconKey };

export type Capability = {
  title: string;
  description: string;
  iconKey: CapabilityIconKey;
  featured?: boolean;
};

export const CAPABILITIES: Capability[] = [
  {
    title: "HTTP, редиректы, заголовки",
    description:
      "Проверяем коды ответов, цепочки редиректов, заголовки безопасности и сжатие, чтобы в отчёте были только реальные сетевые следы сайта.",
    iconKey: "shield",
    featured: true,
  },
  {
    title: "Мета-теги, canonical, robots",
    description:
      "Считываем title, description, Open Graph, Twitter Card, canonical и robots с реальной страницы, отрендеренной в headless Chromium.",
    iconKey: "fileSearch",
    featured: true,
  },
  {
    title: "sitemap.xml и структура",
    description:
      "Парсим sitemap.xml, контрольные URL и выборку внутренних страниц, чтобы видеть структуру сайта, а не одну точку входа.",
    iconKey: "map",
  },
  {
    title: "Hreflang и локализация",
    description:
      "Сверяем hreflang-аннотации и атрибуты lang с реальными языками страниц и находим противоречия между заявленной и фактической локализацией.",
    iconKey: "link",
  },
  {
    title: "Структурированные данные",
    description:
      "Извлекаем JSON-LD, Microdata и RDFa, проверяем их валидность и соответствие типу страницы.",
    iconKey: "barChart",
  },
  {
    title: "OG и Twitter превью",
    description:
      "Загружаем Open Graph и Twitter Card изображения, фиксируем размеры, MIME-тип и доступность, чтобы превью в соцсетях не были битыми.",
    iconKey: "camera",
  },
  {
    title: "Скорость и адаптивность",
    description:
      "Запускаем Lighthouse для mobile и desktop, проверяем Core Web Vitals, viewport, overflow и touch-targets на разных разрешениях экрана.",
    iconKey: "gauge",
    featured: true,
  },
  {
    title: "Здоровье ссылок",
    description:
      "Проверяем внутренние ссылки пачками: коды ответов, редиректы, тайтлы и контентные изменения, чтобы в отчёте были только живые URL.",
    iconKey: "link",
  },
  {
    title: "Аналитика и сторонние теги",
    description:
      "Находим GA4, GTM, Meta Pixel, Яндекс.Метрику и другие счётчики прямо в DOM, с фиксацией загрузки и видимости в headless-режиме.",
    iconKey: "activity",
  },
  {
    title: "Домен и безопасность",
    description:
      "Смотрим на DNS, TLS, whois-сигналы и упоминания бренда, чтобы отличить технические SEO-проблемы от доверительных сигналов домена.",
    iconKey: "building",
  },
  {
    title: "Скриншоты и визуальные доказательства",
    description:
      "Сохраняем визуальные срезы страниц как доказательства: они помогают быстро увидеть проблемы с рендерингом, адаптивностью и превью.",
    iconKey: "eye",
  },
  {
    title: "Только URL",
    description:
      "Не нужен доступ к Search Console, не нужны выгрузки и файлы. Достаточно ввести домен и получить диагностический отчёт.",
    iconKey: "globe",
  },
];

export const CAPABILITY_CARD_TONES = [
  {
    card: "border-ink/15 bg-ink",
    grid: "opacity-[0.12] [background-image:linear-gradient(rgba(246,245,241,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(246,245,241,0.32)_1px,transparent_1px)]",
    hover:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(180,83,9,0.38),transparent_34%),linear-gradient(135deg,rgba(27,27,25,0.96),rgba(61,61,56,0.96))]",
    icon: "bg-paper/10 text-paper ring-1 ring-paper/15 group-hover:bg-paper group-hover:text-ink group-focus:bg-paper group-focus:text-ink",
    title: "text-paper",
    description: "text-paper/72",
  },
  {
    card: "border-accent/25 bg-accent-soft",
    grid: "opacity-[0.22] [background-image:linear-gradient(rgba(180,83,9,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(180,83,9,0.18)_1px,transparent_1px)]",
    hover:
      "bg-[radial-gradient(circle_at_18%_20%,rgba(180,83,9,0.24),transparent_36%),linear-gradient(135deg,var(--color-accent-soft),var(--color-paper))]",
    icon: "bg-surface text-accent group-hover:bg-accent group-hover:text-paper group-focus:bg-accent group-focus:text-paper",
    title: "text-ink",
    description: "text-ink-soft",
  },
  {
    card: "border-positive/20 bg-[rgba(21,128,61,0.08)]",
    grid: "opacity-[0.2] [background-image:linear-gradient(rgba(21,128,61,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(21,128,61,0.14)_1px,transparent_1px)]",
    hover:
      "bg-[radial-gradient(circle_at_20%_15%,rgba(21,128,61,0.18),transparent_34%),linear-gradient(135deg,rgba(21,128,61,0.10),var(--color-surface))]",
    icon: "bg-surface text-positive group-hover:bg-positive group-hover:text-paper group-focus:bg-positive group-focus:text-paper",
    title: "text-ink",
    description: "text-muted",
  },
  {
    card: "border-line bg-surface",
    grid: "opacity-[0.32] [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)]",
    hover:
      "bg-[radial-gradient(circle_at_20%_15%,rgba(180,83,9,0.18),transparent_34%),linear-gradient(135deg,var(--color-paper),var(--color-accent-soft))]",
    icon: "bg-accent-soft text-accent group-hover:bg-surface group-focus:bg-surface",
    title: "text-ink",
    description: "text-muted",
  },
] as const;
