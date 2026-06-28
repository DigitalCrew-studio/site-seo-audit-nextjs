import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Compass,
  Eye,
  FileText,
  History,
  Map as MapIcon,
  ShieldCheck,
} from "lucide-react";
import { HeroAuditGraphic } from "@/components/HeroAuditGraphic";
import { LinkButton, SectionHeader } from "@/components/ui";
import {
  CAPABILITIES,
  CAPABILITY_CARD_TONES,
  type Capability,
} from "@/lib/capabilities";
import { CapabilityBentoCard } from "@/components/CapabilityBentoCard";
import { SITE_URL, BRAND_EMAIL, BRAND_SOCIAL_URLS, withHreflang } from "@/lib/site";

const SITE_NAME = "Seofriendly";
const SITE_DESCRIPTION =
  "Seofriendly — бесплатный SEO-аудит сайта нейросетью: sitemap.xml, robots.txt, canonical, мета-теги, скорость и адаптивность.";
export const metadata: Metadata = {
  title: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: withHreflang("/"),
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
    a: "Да, бесплатный и без регистрации. Не нужен доступ к Google Search Console, не нужны выгрузки ключевых слов или файлы сайта — только открытый URL.",
  },
  {
    q: "Какие данные нужны, чтобы запустить аудит?",
    a: "Только URL проверяемого сайта. Дополнительно можно выбрать язык отчёта и включить подробные логи, если нужна диагностика процесса.",
  },
  {
    q: "Что именно анализирует нейросеть?",
    a: "Нейросеть получает только те факты, которые собрала браузерная проверка: коды ответов, редиректы, заголовки безопасности, содержимое sitemap.xml и robots.txt, canonical, title/description, Open Graph и Twitter Card, иерархию заголовков, JSON-LD/Microdata/RDFa, скриншоты и оценки Lighthouse. На их основе она формирует отчёт с приоритетами и понятными следующими шагами.",
  },
  {
    q: "Где хранятся результаты аудита и история проверок?",
    a: "История аудитов, скриншоты и отчёты сохраняются локально в браузере пользователя. Очистить историю можно в настройках браузера или в соответствующем разделе интерфейса.",
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
        alternateName: "Seofriendly",
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon`,
        },
        email: BRAND_EMAIL,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: BRAND_EMAIL,
          url: `${SITE_URL}/contacts`,
          availableLanguage: ["Russian"],
        },
        sameAs: BRAND_SOCIAL_URLS,
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
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Hero */}
          <section className="grid min-w-0 items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-10">
            <div className="min-w-0 max-w-3xl">
              <h1 className="text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3rem]">
                Бесплатный SEO-аудит сайта
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
                Проверьте сайт по одному URL, без выгрузок и регистрации:
                индексация, мета-теги, sitemap.xml, robots.txt, canonical,
                редиректы, скорость и адаптивность. Нейросеть превращает факты
                проверки в понятный отчёт с приоритетами.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <LinkButton href="/audit" className="group w-full sm:w-auto">
                  Запустить аудит
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </LinkButton>
                <LinkButton
                  href="/settings"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Открыть настройки
                </LinkButton>
              </div>
            </div>

            <div className="hidden min-w-0 lg:block lg:pl-2">
              <HeroAuditGraphic />
            </div>
          </section>

          {/* Proof stats */}
          <section className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-[0_18px_70px_rgba(27,27,25,0.06)] sm:grid-cols-4">
            {PROOF.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`soft-sheen relative flex flex-col gap-1 overflow-hidden bg-surface p-5 transition duration-300 hover:-translate-y-0.5 ${
                    index === 0
                      ? "bg-[radial-gradient(circle_at_15%_0%,rgba(180,83,9,0.18),transparent_42%),var(--color-surface)]"
                      : index === 2
                        ? "bg-[radial-gradient(circle_at_100%_0%,rgba(21,128,61,0.14),transparent_44%),var(--color-surface)]"
                        : ""
                  }`}
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
            <SectionHeader
              title="Что проверяется"
              description="Двенадцать направлений диагностики: от HTTP-следов до визуальных доказательств и локализации."
              aside={<span className="font-mono text-xs text-faint">12 направлений / 60+ проверок</span>}
            />
            <ul className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((cap, index) => (
                <CapabilityBentoCard
                  key={cap.title}
                  cap={cap}
                  index={index}
                  tones={CAPABILITY_CARD_TONES}
                />
              ))}
            </ul>
          </section>

          {/* Checklist of things checked */}
          <section className="relative mt-14 grid min-w-0 gap-6 overflow-visible rounded-xl border border-line bg-[radial-gradient(circle_at_7%_92%,rgba(180,83,9,0.14),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(21,128,61,0.08),transparent_34%),var(--color-surface)] p-6 shadow-[0_18px_80px_rgba(27,27,25,0.06)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-8">
            <div className="pointer-events-none absolute -left-10 bottom-8 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
            <div className="flex min-w-0 flex-col">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Что именно видит Seofriendly на&nbsp;сайте
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Каждый пункт — это конкретное измерение на реальной странице,
                а не оценка «на глаз». Нейросеть получает факты проверки,
                группирует проблемы и объясняет, с чего лучше начать.
              </p>
              <div className="mt-5">
                <LinkButton
                  href="/audit"
                  variant="outline"
                  className="group"
                >
                  Запустить аудит
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </LinkButton>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                Расшифровки терминов вроде sitemap.xml, canonical, Core Web
                Vitals и HSTS собраны в{" "}
                <Link
                  href="/knowledge"
                  className="font-medium text-ink underline underline-offset-2 hover:text-accent"
                >
                  базе знаний SEO
                </Link>.
              </p>
              <div
                aria-hidden="true"
                className="pointer-events-none relative mt-1 min-h-[220px] sm:mt-auto sm:min-h-[260px] lg:min-h-[320px]"
              >
                <Image
                  src="/what-you-see.webp"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 483px, (min-width: 640px) 300px, calc(100vw - 82px)"
                  className="scale-115 object-contain object-center -translate-y-3 sm:-translate-x-5 sm:-translate-y-5 sm:scale-125 lg:-translate-x-10 lg:-translate-y-8 lg:scale-135 lg:object-left-bottom"
                />
              </div>
            </div>
            <ul className="relative grid min-w-0 gap-2 sm:grid-cols-2">
              {CHECKS.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 gap-2.5 rounded-lg border border-line bg-paper/70 px-3.5 py-2.5 text-[13px] leading-snug text-ink-soft transition duration-200 hover:-translate-y-0.5 hover:border-positive/30 hover:bg-surface"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* How it works */}
          <section className="mt-14">
            <SectionHeader
              title="Как проходит аудит"
              description="Процесс линейный: вы вводите домен, браузер собирает факты, затем нейросеть собирает отчёт."
              aside={<span className="font-mono text-xs text-faint">4 шага</span>}
            />
            <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line shadow-[0_18px_70px_rgba(27,27,25,0.05)] md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className={`relative flex flex-col gap-3 overflow-hidden bg-surface p-5 transition duration-300 hover:-translate-y-0.5 sm:p-6 ${
                      index === 1
                        ? "bg-[radial-gradient(circle_at_80%_0%,rgba(180,83,9,0.16),transparent_38%),var(--color-surface)]"
                        : index === 3
                          ? "bg-[linear-gradient(135deg,var(--color-ink),#3d3d38)] text-paper"
                          : ""
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                        index === 3 ? "bg-paper/10 text-paper" : "bg-paper text-ink-soft"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className={`text-[14px] font-semibold ${index === 3 ? "text-paper" : "text-ink"}`}>
                      {step.title}
                    </h3>
                    <p className={`text-[13px] leading-relaxed ${index === 3 ? "text-paper/70" : "text-muted"}`}>
                      {step.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Report deliverables */}
          <section className="mt-14">
            <SectionHeader
              title="Что вы получаете в&nbsp;отчёте"
              description="Не абстрактную оценку, а набор артефактов, к которым можно вернуться после запуска."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
              {DELIVERABLES.map((d, index) => {
                const Icon = d.icon;
                return (
                  <li
                    key={d.title}
                    className={`soft-sheen flex flex-col gap-2 rounded-xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(27,27,25,0.08)] sm:p-6 ${
                      index === 0
                        ? "border-accent/20 bg-[radial-gradient(circle_at_18%_18%,rgba(180,83,9,0.18),transparent_36%),var(--color-accent-soft)]"
                        : index === 2
                          ? "bg-[radial-gradient(circle_at_85%_0%,rgba(21,128,61,0.12),transparent_42%),var(--color-surface)]"
                          : ""
                    }`}
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
          <section className="relative mt-14 grid gap-6 overflow-hidden rounded-xl border border-line bg-[radial-gradient(circle_at_8%_0%,rgba(180,83,9,0.15),transparent_28%),linear-gradient(135deg,var(--color-surface),var(--color-paper))] p-6 shadow-[0_18px_80px_rgba(27,27,25,0.06)] sm:grid-cols-[1fr_1.1fr] sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-positive/10 blur-3xl" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">
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
                  <span>Сохранённые аудиты остаются локально в браузере — без аккаунтов и выгрузок.</span>
                </li>
              </ul>
            </div>
            <div className="relative min-w-0 rounded-xl border border-line bg-paper/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-6">
              <p className="font-mono text-[12px] font-medium text-faint">
                Фрагмент карты обхода
              </p>
              <pre className="mt-3 max-w-full overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-[12px] leading-relaxed text-ink-soft">
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

          {/* Services CTA */}
          <section className="mt-14 overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_12%_20%,rgba(180,83,9,0.18),transparent_30%),linear-gradient(135deg,var(--color-ink),#34342f)] p-6 text-paper shadow-[0_18px_80px_rgba(27,27,25,0.12)] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow text-paper/55">услуги</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Нужна помощь с внедрением SEO-правок?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-paper/70">
                  Если аудит нашёл проблемы с индексацией, мета-данными,
                  canonical, structured data или скоростью, можно заказать
                  настройку SEO на вашем сайте.
                </p>
              </div>
              <LinkButton
                href="/services"
                variant="inverse"
                className="group w-full sm:w-auto"
              >
                Посмотреть услуги
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </LinkButton>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-14" aria-labelledby="faq-heading">
            <SectionHeader title={<span id="faq-heading">Частые вопросы</span>} />
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group bg-surface px-5 py-4 [&[open]]:bg-paper/40"
                >
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-ink">
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
          <section className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-ink bg-ink p-6 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight">
                Запустите бесплатный SEO-аудит за&nbsp;пару&nbsp;минут
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-paper/70">
                Введите URL, нажмите «Запустить аудит» — и через несколько минут
                получите отчёт от нейросети с приоритетами, доказательствами и
                понятными следующими шагами.
              </p>
            </div>
            <LinkButton
              href="/audit"
              variant="inverse"
              className="group w-full sm:w-auto"
            >
              Запустить аудит
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </LinkButton>
          </section>
        </div>
      </div>
    </main>
  );
}
