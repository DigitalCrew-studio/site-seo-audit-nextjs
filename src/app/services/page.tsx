import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, SearchCheck, Send } from "lucide-react";
import { Breadcrumbs, LinkButton, PageHeader } from "@/components/ui";
import {
  BRAND_EMAIL,
  BRAND_TELEGRAM_URL,
  SITE_URL,
  withHreflang,
} from "@/lib/site";
import { pageBreadcrumb, webPageSchema } from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";
const PAGE_TITLE = "Услуги SEO — настройка SEO на вашем сайте";
const PAGE_DESCRIPTION =
  "SEO-услуги и настройка SEO на сайте: техническая оптимизация, sitemap.xml, robots.txt, canonical, мета-теги, структурированные данные, скорость и аналитика.";

const SERVICE_POINTS = [
  "Исправление технических проблем после аудита: индексация, canonical, robots.txt, sitemap.xml, редиректы.",
  "Настройка title, description, Open Graph, Twitter Card и базовой структуры заголовков.",
  "Добавление или исправление JSON-LD разметки Organization, WebSite, BreadcrumbList, Article, Product или LocalBusiness.",
  "Проверка Core Web Vitals, Lighthouse-диагностики, изображений, веса страницы и мобильной пригодности.",
  "Настройка базовой аналитики: GA4, GTM, Яндекс.Метрика, цели и ключевые события.",
  "Финальная проверка результата: повторный аудит, список изменений и рекомендации на следующий этап.",
] as const;

const SERVICE_SCOPES = [
  {
    title: "Техническая SEO-оптимизация",
    text: "Исправляем препятствия для обхода и индексации: статусы страниц, редиректы, robots.txt, sitemap.xml, canonical, noindex и внутренние ссылки.",
  },
  {
    title: "Мета-теги и структура страниц",
    text: "Настраиваем title, description, H1-H3, Open Graph и Twitter Card так, чтобы страница была понятна пользователю и поисковой системе.",
  },
  {
    title: "Микроразметка и доверие",
    text: "Добавляем JSON-LD для Organization, WebSite, BreadcrumbList, Article, Service, Product или LocalBusiness, если разметка соответствует видимому контенту.",
  },
  {
    title: "Скорость, мобильная версия и аналитика",
    text: "Проверяем Core Web Vitals, Lighthouse, изображения, мобильный layout, Яндекс.Метрику, GA4, цели и ключевые события.",
  },
] as const;

const RESULT_ITEMS = [
  "Список внедрённых SEO-правок с объяснением, зачем они нужны.",
  "Повторная проверка ключевых страниц после изменений.",
  "Рекомендации, что делать дальше: контент, индексация, скорость или аналитика.",
] as const;

const PROCESS = [
  {
    title: "1. Быстрый разбор",
    text: "Смотрим сайт, текущий аудит и приоритеты бизнеса: какие страницы важнее всего и где риск для индексации или конверсий.",
  },
  {
    title: "2. План правок",
    text: "Формируем короткий список работ: что исправить сразу, что можно отложить, какие данные или доступы нужны.",
  },
  {
    title: "3. Настройка",
    text: "Вносим SEO-правки в код, CMS или конфигурацию сайта либо готовим точное ТЗ для вашей команды.",
  },
  {
    title: "4. Проверка",
    text: "Повторно проверяем сайт, фиксируем результат и оставляем понятный список дальнейших действий.",
  },
] as const;

const FAQ = [
  {
    q: "Что нужно для старта настройки SEO?",
    a: "Достаточно URL сайта и короткого описания задачи. Если уже есть отчёт Seofriendly, пришлите его вместе со ссылкой на сайт — так быстрее определить приоритеты.",
  },
  {
    q: "Можно ли начать с бесплатного аудита?",
    a: "Да. Сначала можно запустить бесплатный аудит, посмотреть список проблем и после этого обратиться за внедрением конкретных SEO-правок.",
  },
  {
    q: "Нужен ли доступ к сайту?",
    a: "Для внедрения правок нужен доступ к коду, CMS или репозиторию. Если доступа нет, можно подготовить техническое задание для вашей команды.",
  },
  {
    q: "Что входит в результат работы?",
    a: "Список выполненных изменений, повторная проверка ключевых страниц и рекомендации на следующий этап: индексация, мета-данные, structured data, скорость или аналитика.",
  },
  {
    q: "Какие SEO-услуги можно заказать после аудита?",
    a: "Можно заказать внедрение технических SEO-правок: sitemap.xml, robots.txt, canonical, редиректы, мета-теги, структура заголовков, JSON-LD, Open Graph, скорость, мобильная версия и базовая аналитика.",
  },
  {
    q: "Можно ли настроить SEO только для Яндекса?",
    a: "Базовая техническая настройка обычно полезна и для Яндекса, и для Google: индексируемость, видимый текст, title, description, canonical, sitemap.xml и robots.txt. Для Яндекса дополнительно проверяем сниппеты, Яндекс.Вебмастер и Яндекс.Метрику.",
  },
] as const;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/services`,
    languages: withHreflang("/services"),
  },
  openGraph: {
    title: `Услуги SEO — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/services`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `Услуги SEO — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Услуги SEO — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

function buildServicesStructuredData() {
  const serviceId = `${SITE_URL}/services#seo-setup-service`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...webPageSchema({
        path: "/services",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        }),
        mainEntity: { "@id": serviceId },
      },
      pageBreadcrumb("Услуги", "/services"),
      {
        "@type": "Service",
        "@id": serviceId,
        name: "Настройка SEO на вашем сайте",
        description: PAGE_DESCRIPTION,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: "RU",
        serviceType: "SEO setup and technical SEO optimization",
        serviceOutput: "Технически настроенный сайт, список внедрённых SEO-правок и повторная проверка результата",
        url: `${SITE_URL}/services`,
        availableChannel: [
          {
            "@type": "ServiceChannel",
            serviceUrl: BRAND_TELEGRAM_URL,
          },
          {
            "@type": "ServiceChannel",
            serviceUrl: `mailto:${BRAND_EMAIL}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/services#faq`,
        url: `${SITE_URL}/services`,
        inLanguage: "ru-RU",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}

export default function ServicesPage() {
  const structuredData = buildServicesStructuredData();

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs items={[{ label: "Услуги" }]} className="mb-3" />
          <PageHeader
            eyebrow="Услуги SEO"
            title="Настройка SEO на вашем сайте"
            description="Помогаем не только найти проблемы в аудите, но и довести сайт до технически здорового состояния."
          />

          <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="relative overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_10%_0%,rgba(180,83,9,0.17),transparent_34%),var(--color-surface)] p-6 shadow-[0_18px_80px_rgba(27,27,25,0.07)] sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <SearchCheck className="h-5 w-5" />
              </span>
              <p className="eyebrow mt-5 text-faint">основная услуга</p>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                SEO-услуги и настройка SEO на вашем сайте
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
                Берём результаты аудита и превращаем их в реальные изменения:
                исправляем технические ошибки, настраиваем мета-данные,
                структурированные данные, индексацию, скорость и аналитику.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <LinkButton href={`mailto:${BRAND_EMAIL}`} className="group w-full sm:w-auto">
                  Написать на почту
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </LinkButton>
                <LinkButton
                  href={BRAND_TELEGRAM_URL}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Telegram
                </LinkButton>
              </div>
            </article>

            <aside className="rounded-2xl border border-line bg-ink p-6 text-paper shadow-[0_18px_80px_rgba(27,27,25,0.12)] sm:p-8">
              <p className="eyebrow text-paper/55">контакты</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                Как связаться
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-paper/70">
                Пришлите URL сайта и коротко опишите задачу: нужен разбор,
                внедрение правок после аудита или постоянная SEO-поддержка.
              </p>
              <div className="mt-5 grid gap-3">
                <a
                  href={`mailto:${BRAND_EMAIL}`}
                  className="flex min-h-[56px] items-center gap-3 rounded-xl border border-paper/10 bg-paper/7 px-4 text-[14px] font-medium text-paper transition hover:bg-paper/12"
                >
                  <Mail className="h-4.5 w-4.5 text-accent" />
                  {BRAND_EMAIL}
                </a>
                <a
                  href={BRAND_TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[56px] items-center gap-3 rounded-xl border border-paper/10 bg-paper/7 px-4 text-[14px] font-medium text-paper transition hover:bg-paper/12"
                >
                  <Send className="h-4.5 w-4.5 text-accent" />
                  Telegram @BBYagah
                </a>
              </div>
            </aside>
          </section>

          <section className="mt-12" aria-labelledby="services-included-heading">
            <div className="max-w-3xl">
              <p className="eyebrow text-faint">что входит</p>
              <h2
                id="services-included-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-ink"
              >
                Что можно настроить
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Объём зависит от сайта, CMS и текущих ограничений. Если нужен
                только аудит без внедрения, используйте{" "}
                <a className="text-ink underline" href="/audit">
                  бесплатную проверку
                </a>
                . Термины вроде{" "}
                <Link className="text-ink underline" href="/knowledge/seo-terms#canonical">
                  canonical
                </Link>
                ,{" "}
                <Link className="text-ink underline" href="/knowledge/seo-terms#robots-txt">
                  robots.txt
                </Link>{" "}
                и{" "}
                <Link className="text-ink underline" href="/knowledge/seo-terms#core-web-vitals">
                  Core Web Vitals
                </Link>{" "}
                разобраны в базе знаний.
              </p>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {SERVICE_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-xl border border-line bg-surface p-5 text-[13px] leading-relaxed text-muted sm:p-6"
                >
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-positive" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="services-scope-heading">
            <div className="max-w-3xl">
              <p className="eyebrow text-faint">направления работ</p>
              <h2
                id="services-scope-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-ink"
              >
                Какие SEO-услуги можно заказать
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Обычно начинаем с бесплатного аудита, затем выбираем правки с
                максимальным эффектом для индексации, сниппетов и технического
                состояния сайта. Если нужен только список задач для вашей
                команды, можно подготовить подробное техническое задание.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {SERVICE_SCOPES.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_45px_rgba(27,27,25,0.045)] sm:p-6"
                >
                  <h3 className="text-[15px] font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-5 rounded-2xl border border-line bg-[radial-gradient(circle_at_8%_0%,rgba(180,83,9,0.14),transparent_30%),var(--color-surface)] p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="eyebrow text-faint">результат</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Что вы получаете после настройки SEO
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Цель работы — не просто “поставить галочки”, а убрать реальные
                препятствия для поиска: страницы должны открываться, быть
                понятными, каноническими, связанными внутренними ссылками и
                корректно описанными в мета-данных.
              </p>
            </div>
            <ul className="grid gap-3">
              {RESULT_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-line bg-paper/75 p-4 text-[13px] leading-relaxed text-muted"
                >
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-positive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="services-process-heading">
            <div className="max-w-3xl">
              <p className="eyebrow text-faint">процесс</p>
              <h2
                id="services-process-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-ink"
              >
                Как проходит работа
              </h2>
            </div>
            <ol className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
              {PROCESS.map((step, index) => (
                <li
                  key={step.title}
                  className={`bg-surface p-5 sm:p-6 ${index === 0 ? "bg-[radial-gradient(circle_at_15%_0%,rgba(180,83,9,0.16),transparent_40%),var(--color-surface)]" : ""}`}
                >
                  <h3 className="text-[14px] font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12" aria-labelledby="services-faq-heading">
            <div className="max-w-3xl">
              <p className="eyebrow text-faint">faq</p>
              <h2
                id="services-faq-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-ink"
              >
                Частые вопросы по SEO-настройке
              </h2>
            </div>
            <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
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
        </div>
      </div>
    </main>
  );
}
