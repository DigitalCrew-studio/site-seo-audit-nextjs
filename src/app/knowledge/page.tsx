import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Breadcrumbs, LinkButton, PageHeader } from "@/components/ui";
import { KNOWLEDGE_ARTICLES } from "@/lib/knowledgeArticles";
import { SITE_URL, withHreflang } from "@/lib/site";
import { pageBreadcrumb, webPageSchema } from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";
const PAGE_TITLE = "База знаний SEO — что такое SEO и как настроить сайт";
const PAGE_DESCRIPTION =
  "Статьи о SEO простыми словами: что такое SEO, что значит SEO-friendly сайт, как настроить индексацию, title, description, sitemap.xml, robots.txt, canonical и SEO для Яндекса.";

const HUB_POINTS = [
  "Отдельные индексируемые статьи под реальные вопросы пользователей.",
  "Ссылки на официальные источники: Google Search Central, Яндекс.Вебмастер, Schema.org, web.dev и MDN.",
  "Практические чеклисты: что проверить на сайте и какие ошибки исправлять первыми.",
] as const;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "что такое SEO",
    "как настроить SEO",
    "SEO-friendly сайт",
    "техническое SEO",
    "SEO для Яндекса",
    "SEO чеклист",
  ],
  alternates: {
    canonical: `${SITE_URL}/knowledge`,
    languages: withHreflang("/knowledge"),
  },
  openGraph: {
    title: `База знаний SEO — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/knowledge`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `База знаний SEO — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `База знаний SEO — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

function buildKnowledgeHubStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...webPageSchema({
          path: "/knowledge",
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
        }),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: KNOWLEDGE_ARTICLES.map((article, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: article.title,
            url: `${SITE_URL}/knowledge/${article.slug}`,
          })),
        },
      },
      pageBreadcrumb("База знаний", "/knowledge"),
    ],
  };
}

export default function KnowledgePage() {
  const structuredData = buildKnowledgeHubStructuredData();

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs items={[{ label: "База знаний" }]} className="mb-3" />
          <PageHeader
            eyebrow="SEO-гайд"
            title="База знаний SEO"
            description="Подробные статьи о SEO, SEO-friendly сайтах, технической настройке, индексации и Яндексе — с практическими чеклистами и ссылками на первоисточники."
          />

          <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="relative overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_10%_0%,rgba(180,83,9,0.17),transparent_34%),var(--color-surface)] p-6 shadow-[0_18px_80px_rgba(27,27,25,0.07)] sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <BookOpen className="h-5 w-5" />
              </span>
              <h2 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Что читать, если нужно разобраться в SEO
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
                Начните с базовой статьи о том, что такое SEO, затем переходите
                к SEO-friendly сайту, пошаговой настройке, техническому чеклисту
                и отдельной статье про Яндекс. Словарь терминов оставлен как
                справочник для быстрых уточнений.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <LinkButton href="/knowledge/what-is-seo" className="group w-full sm:w-auto">
                  Начать с основ
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </LinkButton>
                <LinkButton href="/knowledge/seo-terms" variant="secondary" className="w-full sm:w-auto">
                  Открыть словарь
                </LinkButton>
              </div>
            </article>

            <aside className="rounded-2xl border border-line bg-ink p-6 text-paper shadow-[0_18px_80px_rgba(27,27,25,0.12)] sm:p-8">
              <p className="eyebrow text-paper/55">как устроено</p>
              <ul className="mt-4 grid gap-3 text-[13px] leading-relaxed text-paper/78">
                {HUB_POINTS.map((point) => (
                  <li key={point} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          <section className="mt-12" aria-labelledby="knowledge-articles-heading">
            <div className="max-w-3xl">
              <p className="eyebrow text-faint">статьи</p>
              <h2 id="knowledge-articles-heading" className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Основные темы
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Начните с базовых понятий, если только разбираетесь в SEO, или
                переходите сразу к пошаговой настройке, техническому чеклисту и
                особенностям индексации в Яндексе.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {KNOWLEDGE_ARTICLES.map((article, index) => (
                <Link
                  key={article.slug}
                  href={`/knowledge/${article.slug}`}
                  className={`group rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_45px_rgba(27,27,25,0.045)] transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_18px_60px_rgba(27,27,25,0.08)] sm:p-6 ${
                    index === 0
                      ? "md:col-span-2 bg-[radial-gradient(circle_at_10%_0%,rgba(180,83,9,0.13),transparent_34%),var(--color-surface)]"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow text-faint">{article.readingTime}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink group-hover:text-accent">
                        {article.shortTitle}
                      </h3>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">
                    {article.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-medium text-faint"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="max-w-3xl">
              <p className="eyebrow text-faint">справочник</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Словарь SEO-терминов
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Если нужен конкретный термин — robots.txt, sitemap.xml,
                canonical, Core Web Vitals, JSON-LD, Open Graph, Яндекс.Метрика
                или SPF/DKIM/DMARC — откройте отдельный словарь.
              </p>
              <LinkButton href="/knowledge/seo-terms" variant="outline" className="mt-5">
                Перейти в словарь
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
