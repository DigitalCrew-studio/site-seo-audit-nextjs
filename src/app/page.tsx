import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  ShieldCheck,
  FileSearch,
  BarChart3,
  Camera,
  Link2,
  Activity,
  Building2,
  Map as MapIcon,
  Gauge,
  CheckCircle2,
  FileText,
  History,
  Eye,
  Compass,
} from "lucide-react";
import { AppBar } from "@/components/AppBar";

const SITE_URL = "https://seofrendly.ru";
const SITE_NAME = "Seofriendly";
const SITE_DESCRIPTION =
  "Seofriendly — бесплатный SEO-аудит сайта нейросетью. Браузерная проверка sitemap.xml, robots.txt, canonical, редиректов, мета-тегов, скорости и адаптивности с отчётом от нейросети.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: {
      "ru-RU": `${SITE_URL}/`,
    },
  },
  openGraph: {
    title: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

type Capability = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CAPABILITIES: Capability[] = [
  {
    title: "HTTP, редиректы, заголовки",
    description:
      "Проверяем коды ответов, цепочки редиректов, заголовки безопасности и сжатие, чтобы в отчёте были только реальные сетевые следы сайта.",
    icon: ShieldCheck,
  },
  {
    title: "Мета-теги, canonical, robots",
    description:
      "Считываем title, description, Open Graph, Twitter Card, canonical и robots с реальной страницы, отрендеренной в headless Chromium.",
    icon: FileSearch,
  },
  {
    title: "sitemap.xml и структура",
    description:
      "Парсим sitemap.xml, контрольные URL и выборку внутренних страниц, чтобы видеть структуру сайта, а не одну точку входа.",
    icon: MapIcon,
  },
  {
    title: "Hreflang и локализация",
    description:
      "Сверяем hreflang-аннотации и атрибуты lang с реальными языками страниц и находим противоречия между заявленной и фактической локализацией.",
    icon: Link2,
  },
  {
    title: "Структурированные данные",
    description:
      "Извлекаем JSON-LD, Microdata и RDFa, проверяем их валидность и соответствие типу страницы.",
    icon: BarChart3,
  },
  {
    title: "OG и Twitter превью",
    description:
      "Загружаем Open Graph и Twitter Card изображения, фиксируем размеры, MIME-тип и доступность, чтобы превью в соцсетях не были битыми.",
    icon: Camera,
  },
  {
    title: "Скорость и адаптивность",
    description:
      "Запускаем Lighthouse для mobile и desktop, проверяем Core Web Vitals, viewport, overflow и touch-targets на разных разрешениях экрана.",
    icon: Gauge,
  },
  {
    title: "Здоровье ссылок",
    description:
      "Проверяем внутренние ссылки пачками: коды ответов, редиректы, тайтлы и контентные изменения, чтобы в отчёте были только живые URL.",
    icon: Link2,
  },
  {
    title: "Аналитика и сторонние теги",
    description:
      "Находим GA4, GTM, Meta Pixel, Яндекс.Метрику и другие счётчики прямо в DOM, с фиксацией загрузки и видимости в headless-режиме.",
    icon: Activity,
  },
  {
    title: "Домен и безопасность",
    description:
      "Смотрим на DNS, TLS, whois-сигналы и упоминания бренда, чтобы отличить технические SEO-проблемы от доверительных сигналов домена.",
    icon: Building2,
  },
  {
    title: "Скриншоты и визуальные доказательства",
    description:
      "Сохраняем визуальные срезы страниц как доказательства: они помогают быстро увидеть проблемы с рендерингом, адаптивностью и превью.",
    icon: Eye,
  },
  {
    title: "Только URL",
    description:
      "Не нужен доступ к Search Console, не нужны выгрузки и файлы. Достаточно ввести домен и получить диагностический отчёт.",
    icon: Globe2,
  },
];

const CHECKS = [
  "Доступность сайта: коды ответов, цепочки 3xx-редиректов, битые ссылки",
  "Карта сайта: наличие и валидность sitemap.xml, расхождения с robots.txt",
  "Индексирование: robots, meta robots, X-Robots-Tag, canonical, пагинация",
  "Мета-теги: title, description, Open Graph, Twitter Card, дубли и обрезка",
  "Заголовки и иерархия: один h1, корректные уровни h2–h6, переносы строк",
  "Структурированные данные: JSON-LD, Microdata, RDFa, ошибки Schema.org",
  "Скорость: Lighthouse mobile и desktop, Core Web Vitals, вес страниц",
  "Адаптивность: desktop, laptop, tablet, mobile, viewport, overflow, тач-таргеты",
  "HTTPS и безопасность: TLS, HSTS, mixed content, заголовки безопасности",
  "Изображения: alt, размер, MIME, OG/Twitter превью, lazy-загрузка",
  "Аналитика: GA4, GTM, Meta Pixel, Яндекс.Метрика — наличие и корректность",
  "Hreflang и локализация: атрибуты lang, hreflang, x-default",
];

const STEPS = [
  {
    icon: Compass,
    title: "1. Вводите домен",
    text: "Указываете URL — Seofriendly нормализует адрес и готовит окружение к проверке.",
  },
  {
    icon: Eye,
    title: "2. Браузер обходит сайт",
    text: "Headless Chromium открывает страницы так же, как их видит пользователь и поисковый робот: рендерит JS, ждёт сети, делает скриншоты.",
  },
  {
    icon: ShieldCheck,
    title: "3. Технические проверки",
    text: "Снимаются HTTP-следы, читаются sitemap.xml и robots.txt, проверяются canonical, мета-теги, разметка и скорость.",
  },
  {
    icon: FileText,
    title: "4. Нейросеть собирает отчёт",
    text: "Нейросеть анализирует найденные факты, отделяет критичные SEO-проблемы от второстепенных и формирует понятный отчёт с приоритетами.",
  },
];

const DELIVERABLES = [
  {
    icon: FileText,
    title: "Отчёт от нейросети",
    text: "Структурированный документ с выводами, приоритетами, конкретными URL и объяснением, почему это важно для SEO.",
  },
  {
    icon: MapIcon,
    title: "Карта обхода",
    text: "Список страниц, на которые зашёл браузер: коды ответов, редиректы, тайтлы, канонические адреса.",
  },
  {
    icon: Camera,
    title: "Скриншоты и OG/Twitter",
    text: "Визуальные срезы для desktop и mobile, превью соцсетей — отдельно от текста отчёта.",
  },
  {
    icon: History,
    title: "История аудитов",
    text: "Каждый запуск сохраняется локально: можно вернуться к прошлому состоянию и сравнить.",
  },
];

const PROOF = [
  { label: "Источников данных", value: "12+" },
  { label: "Проверок на сайт", value: "60+" },
  { label: "Хранилище", value: "локально" },
  { label: "Аккаунт", value: "не нужен" },
];

const FAQ = [
  {
    q: "Что такое Seofriendly и что делает сервис?",
    a: "Seofriendly — это бесплатный онлайн-SEO-аудит сайта. Достаточно ввести URL — headless-браузер обойдёт страницы, соберёт технические факты (HTTP-коды, sitemap.xml, robots.txt, canonical, мета-теги, разметку, скорость), а нейросеть превратит их в структурированный отчёт с приоритетами и доказательствами.",
  },
  {
    q: "Аудит действительно бесплатный? Нужна ли регистрация?",
    a: "Да, бесплатный и без регистрации. Не нужен доступ к Google Search Console, не нужны выгрузки ключевых слов или файлы сайта — только открытый URL. В рамках аудита используется API выбранной нейросети, ключ к которому пользователь вводит локально в настройках и который хранится только в его браузере.",
  },
  {
    q: "Какие данные нужны, чтобы запустить аудит?",
    a: "Только URL проверяемого сайта. Дополнительно в настройках указывается API-ключ провайдера (например, OpenRouter) и модель, которая будет формировать текст отчёта. Эти значения хранятся локально в браузере и не передаются на сторонние серверы, кроме самого запроса к API пользователя.",
  },
  {
    q: "Что именно анализирует нейросеть?",
    a: "Нейросеть получает только те факты, которые собрала браузерная проверка: коды ответов, редиректы, заголовки безопасности, содержимое sitemap.xml и robots.txt, canonical, title/description, Open Graph и Twitter Card, иерархию заголовков, JSON-LD/Microdata/RDFa, скриншоты и оценки Lighthouse. На их основе она формирует отчёт с приоритетами и понятными следующими шагами.",
  },
  {
    q: "Где хранятся результаты аудита и история проверок?",
    a: "История аудитов, скриншоты и отчёты сохраняются локально в браузере пользователя. Сервис не отправляет содержимое аудитов на свой сервер и не хранит API-ключи — всё, что требует приватности, остаётся на устройстве. Очистить историю можно в настройках браузера или в соответствующем разделе интерфейса.",
  },
];

function buildStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        alternateName: "Seofriendly seo-аудит",
        description: SITE_DESCRIPTION,
        inLanguage: "ru-RU",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
        description: SITE_DESCRIPTION,
        inLanguage: "ru-RU",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#webapplication` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon`,
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapplication`,
        name: SITE_NAME,
        url: `${SITE_URL}/audit`,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "SEO Audit Tool",
        operatingSystem: "All",
        browserRequirements: "Requires a modern browser with JavaScript and network access",
        inLanguage: "ru-RU",
        description:
          "Бесплатный SEO-аудит сайта нейросетью: браузерная проверка sitemap.xml, robots.txt, canonical, мета-тегов, скорости и адаптивности с отчётом от нейросети.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "RUB",
          availability: "https://schema.org/InStock",
        },
        featureList: [
          "Бесплатный SEO-аудит без регистрации",
          "Анализ sitemap.xml, robots.txt, canonical",
          "Проверка HTTP, редиректов и заголовков безопасности",
          "Аудит мета-тегов, Open Graph и Twitter Card",
          "Проверка структурированных данных (JSON-LD, Microdata, RDFa)",
          "Оценка Core Web Vitals и адаптивности через Lighthouse",
          "Скриншоты и визуальные доказательства",
          "Отчёт от нейросети с приоритетами",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        url: `${SITE_URL}/`,
        inLanguage: "ru-RU",
        isPartOf: { "@id": `${SITE_URL}/#webpage` },
        mainEntity: FAQ.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: {
            "@type": "Answer",
            text: a,
          },
        })),
      },
    ],
  };
}

export default function HomePage() {
  const structuredData = buildStructuredData();
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AppBar />

      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Hero */}
          <section className="max-w-3xl">
            <span className="eyebrow text-accent">бесплатный seo-аудит нейросетью</span>
            <h1 className="mt-3 text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3rem]">
              Бесплатный SEO-аудит сайта
              <span className="block text-muted">
                нейросетью — по одному URL, без выгрузок и&nbsp;регистрации.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
              Seofriendly проводит бесплатный SEO-аудит нейросетью: браузер
              обходит сайт, читает <span className="font-medium text-ink-soft">sitemap.xml</span> и{" "}
              <span className="font-medium text-ink-soft">robots.txt</span>, проверяет{" "}
              <span className="font-medium text-ink-soft">canonical</span>, редиректы,
              мета-теги, скорость и адаптивность, а нейросеть превращает эти данные
              в структурированный отчёт с приоритетами и доказательствами.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/audit"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink-soft"
              >
                Запустить аудит
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-5 py-3 text-sm font-semibold text-ink-soft transition hover:border-ink hover:text-ink"
              >
                Открыть настройки
              </Link>
            </div>

            <p className="mt-4 text-[13px] text-faint">
              Достаточно открытого URL — нейросеть проанализирует собранные данные
              и покажет, что мешает росту сайта в поиске.
            </p>
          </section>

          {/* Proof stats */}
          <section className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {PROOF.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 bg-surface px-5 py-5"
              >
                <span className="font-mono text-2xl font-semibold tracking-tight text-ink">
                  {stat.value}
                </span>
                <span className="eyebrow text-faint">{stat.label}</span>
              </div>
            ))}
          </section>

          {/* What is checked */}
          <section className="mt-14">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Что проверяется
              </h2>
              <span className="eyebrow text-faint">12 направлений · 60+ проверок</span>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <li
                    key={cap.title}
                    className="flex flex-col gap-2 bg-surface px-5 py-5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="text-[14px] font-semibold text-ink">
                        {cap.title}
                      </h3>
                    </div>
                    <p className="text-[13px] leading-relaxed text-muted">
                      {cap.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Checklist of things checked */}
          <section className="mt-14 grid gap-6 rounded-xl border border-line bg-surface p-6 sm:grid-cols-[1fr_1.1fr] sm:p-8">
            <div>
              <span className="eyebrow text-muted">чек-лист проверок</span>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                Что именно видит Seofriendly на&nbsp;сайте
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Каждый пункт — это конкретное измерение на реальной странице,
                а не оценка «на глаз». Нейросеть получает факты проверки,
                группирует проблемы и объясняет, с чего лучше начать.
              </p>
              <div className="mt-5">
                <Link
                  href="/audit"
                  className="group inline-flex items-center gap-2 rounded-lg border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-paper"
                >
                  Запустить аудит
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CHECKS.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-[13px] leading-snug text-ink-soft"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* How it works */}
          <section className="mt-14">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Как проходит аудит
              </h2>
              <span className="eyebrow text-faint">4 шага</span>
            </div>
            <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-paper text-ink-soft">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="text-[14px] font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted">
                      {step.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Report deliverables */}
          <section className="mt-14">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Что вы получаете в&nbsp;отчёте
              </h2>
              <span className="eyebrow text-faint">deliverables</span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DELIVERABLES.map((d) => {
                const Icon = d.icon;
                return (
                  <li
                    key={d.title}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="text-[14px] font-semibold text-ink">
                      {d.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted">
                      {d.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Evidence note */}
          <section className="mt-14 grid gap-6 rounded-xl border border-line bg-surface p-6 sm:grid-cols-[1fr_1.1fr] sm:p-8">
            <div>
              <span className="eyebrow text-muted">доказательная база</span>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                Каждый вывод подтверждён, а&nbsp;не&nbsp;придуман
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Нейросеть делает выводы только на основе того, что браузерная
                проверка действительно увидела и измерила. Визуальные
                доказательства, коды ответов и фрагменты DOM остаются в галерее,
                а в текст отчёта попадает понятная интерпретация.
              </p>
              <ul className="mt-5 space-y-2 text-[13px] text-ink-soft">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>Headless Chromium рендерит страницу так же, как её увидит пользователь и поисковый робот.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>Скриншоты и визуальные материалы собираются параллельно и не смешиваются с текстом отчёта.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>Сохранённые аудиты остаются локально в браузере — без сервера, без аккаунтов, без выгрузок.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-paper/60 p-5">
              <span className="eyebrow text-faint">фрагмент карты обхода</span>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-[12px] leading-relaxed text-ink-soft">
{`/                         200   ok
/about                     200   ok
/blog                      200   ok
/contacts                  200   ok
/product/example           301   → /products/example
/old-page                  404   missing
/feed.xml                  200   ok
/sitemap.xml               200   ok   142 url
/robots.txt                200   ok`}
              </pre>
              <p className="mt-3 text-[12px] text-faint">
                Пример карты обхода из реального аудита. Полный список страниц
                и HTTP-следов попадает в отчёт.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-14" aria-labelledby="faq-heading">
            <div className="mb-6 flex items-baseline justify-between">
              <h2
                id="faq-heading"
                className="text-lg font-semibold tracking-tight text-ink"
              >
                Частые вопросы
              </h2>
              <span className="eyebrow text-faint">FAQ</span>
            </div>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group bg-surface px-5 py-4 [&[open]]:bg-paper/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-ink">
                    <span>{item.q}</span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-base text-muted transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-ink bg-ink p-8 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-xl">
              <span className="eyebrow text-paper/60">готовы проверить сайт?</span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Запустите бесплатный SEO-аудит за&nbsp;пару&nbsp;минут
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-paper/70">
                Введите URL, нажмите «Запустить аудит» — и через несколько минут
                получите отчёт от нейросети с приоритетами, доказательствами и
                понятными следующими шагами.
              </p>
            </div>
            <Link
              href="/audit"
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-paper px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-soft"
            >
              Запустить аудит
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
