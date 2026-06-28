import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Breadcrumbs, LinkButton } from "@/components/ui";
import {
  getKnowledgeArticle,
  KNOWLEDGE_ARTICLES,
  type KnowledgeArticle,
} from "@/lib/knowledgeArticles";
import { SITE_URL, withHreflang } from "@/lib/site";
import { breadcrumbSchema, ORG_ID, pageBreadcrumb, webPageSchema } from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getKnowledgeArticle(slug);
  if (!article) return {};
  const path = `/knowledge/${article.slug}`;

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: withHreflang(path),
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${SITE_URL}${path}`,
      type: "article",
      locale: "ru_RU",
      siteName: SITE_NAME,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["/twitter-image"],
    },
  };
}

function buildArticleStructuredData(article: KnowledgeArticle) {
  const path = `/knowledge/${article.slug}`;
  const url = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...webPageSchema({
          path,
          name: article.title,
          description: article.description,
        }),
        mainEntity: { "@id": `${url}#article` },
      },
      breadcrumbSchema([
        { name: "Главная", href: "/" },
        { name: "База знаний", href: "/knowledge" },
        { name: article.shortTitle, href: path },
      ]),
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        url,
        inLanguage: "ru-RU",
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        about: article.keywords,
        citation: article.sources.map((source) => source.href),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url: `${url}#faq`,
        inLanguage: "ru-RU",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeArticle(slug);
  if (!article) notFound();

  const structuredData = buildArticleStructuredData(article);

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs
            items={[
              { label: "База знаний", href: "/knowledge" },
              { label: article.shortTitle },
            ]}
            className="mb-3"
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <article className="min-w-0">
              <header className="rounded-2xl border border-line bg-[radial-gradient(circle_at_12%_0%,rgba(180,83,9,0.16),transparent_34%),var(--color-surface)] p-6 shadow-[0_18px_70px_rgba(27,27,25,0.06)] sm:p-8">
                <p className="eyebrow text-accent">база знаний / {article.readingTime}</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  {article.title}
                </h1>
                <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-ink-soft">
                  {article.intro}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {article.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] font-medium text-muted"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </header>

              <div className="mt-8 space-y-10">
                {article.sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                      {section.title}
                    </h2>
                    {section.lead ? (
                      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                        {section.lead}
                      </p>
                    ) : null}
                    <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted">
                      {section.paragraphs?.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {section.bullets ? (
                      <ul className="mt-4 grid gap-2">
                        {section.bullets.map((item) => (
                          <li
                            key={item}
                            className="rounded-xl border border-line bg-surface px-4 py-3 text-[14px] leading-relaxed text-ink-soft"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {section.sources ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {section.sources.map((source) => (
                          <a
                            key={source.href}
                            href={source.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-ink"
                          >
                            {source.label}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ))}

                <section id="faq" className="scroll-mt-28">
                  <h2 className="text-2xl font-semibold tracking-tight text-ink">
                    Частые вопросы
                  </h2>
                  <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
                    {article.faq.map((item) => (
                      <details
                        key={item.question}
                        className="group bg-surface px-5 py-4 [&[open]]:bg-paper/40"
                      >
                        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-ink">
                          <span>{item.question}</span>
                          <span className="font-mono text-base text-muted transition group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-[13px] leading-relaxed text-muted">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>

                <section id="sources" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-5 sm:p-6">
                  <h2 className="text-xl font-semibold tracking-tight text-ink">
                    Источники
                  </h2>
                  <ul className="mt-4 grid gap-2">
                    {article.sources.map((source) => (
                      <li key={source.href}>
                        <a
                          href={source.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[40px] items-center gap-2 text-[14px] font-medium text-muted underline underline-offset-4 transition hover:text-ink"
                        >
                          {source.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </article>

            <aside className="lg:sticky lg:top-28">
              <nav className="rounded-2xl border border-line bg-surface/90 p-4 shadow-[0_18px_70px_rgba(27,27,25,0.06)]" aria-label="Навигация по статье">
                <p className="eyebrow text-faint">в этой статье</p>
                <div className="mt-3 flex flex-col items-start gap-1">
                  {article.sections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`rounded-lg px-2 py-2 text-left text-[13px] leading-snug transition hover:bg-paper hover:text-ink ${index === 0 ? "font-semibold text-ink" : "text-muted"}`}
                    >
                      {section.title}
                    </a>
                  ))}
                  <a href="#faq" className="rounded-lg px-2 py-2 text-[13px] font-semibold text-ink transition hover:bg-paper">
                    Частые вопросы
                  </a>
                  <a href="#sources" className="rounded-lg px-2 py-2 text-[13px] text-muted transition hover:bg-paper hover:text-ink">
                    Источники
                  </a>
                </div>
              </nav>

              <div className="mt-4 rounded-2xl border border-ink bg-ink p-4 text-paper">
                <p className="eyebrow text-paper/55">проверка сайта</p>
                <p className="mt-3 text-[14px] font-semibold leading-snug">
                  Хотите увидеть эти ошибки на своём сайте?
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-paper/68">
                  Seofriendly проверит индексацию, мета-теги, sitemap.xml,
                  robots.txt, canonical и скорость.
                </p>
                <LinkButton href="/audit" variant="inverse" className="mt-4 w-full">
                  Запустить аудит
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
                <Link
                  href="/services"
                  className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-paper/15 px-4 text-[13px] font-semibold text-paper transition hover:bg-paper/10"
                >
                  Заказать настройку SEO
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
                <p className="eyebrow text-faint">другие статьи</p>
                <div className="mt-3 grid gap-1">
                  {KNOWLEDGE_ARTICLES.filter((item) => item.slug !== article.slug)
                    .slice(0, 4)
                    .map((item) => (
                      <Link
                        key={item.slug}
                        href={`/knowledge/${item.slug}`}
                        className="rounded-lg px-2 py-2 text-[13px] font-medium leading-snug text-muted transition hover:bg-paper hover:text-ink"
                      >
                        {item.shortTitle}
                      </Link>
                    ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
