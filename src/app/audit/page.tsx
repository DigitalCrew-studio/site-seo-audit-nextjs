import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Camera, FileText, Route, Wrench } from "lucide-react";
import { AuditForm } from "@/components/AuditForm";
import { AuditHistorySidebar } from "@/components/AuditHistorySidebar";
import { AuditWorkspaceEmpty } from "@/components/AuditWorkspaceEmpty";
import { ProcessLog } from "@/components/ProcessLog";
import { ReportCard } from "@/components/ReportCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { Breadcrumbs, PageHeader } from "@/components/ui";
import { SITE_URL, withHreflang } from "@/lib/site";
import {
  pageBreadcrumb,
  webPageSchema,
} from "@/lib/structuredData";

const PAGE_TITLE = "Запустить бесплатный SEO-аудит";
// 158 символов — влезает в SERP без обрезки (лимит ~160).
const PAGE_DESCRIPTION =
  "Введите URL — Seofriendly проведёт бесплатный SEO-аудит нейросетью: HTTP, sitemap.xml, robots.txt, canonical, мета-теги, скорость. Отчёт с приоритетами.";

const AUDIT_ARTIFACTS = [
  {
    icon: FileText,
    title: "Отчёт с приоритетами",
    text: "Нейросеть превращает факты проверки в структурированный список проблем и следующих шагов.",
  },
  {
    icon: Camera,
    title: "Скриншоты страниц",
    text: "Ключевые экраны сохраняются отдельно, чтобы видеть не только HTML, но и реальный визуальный результат.",
  },
  {
    icon: Route,
    title: "Карта обхода",
    text: "HTTP-следы, редиректы, sitemap.xml, robots.txt, canonical и другие технические сигналы.",
  },
] as const;

// /audit is indexable: it carries a static Russian description of what the
// audit does and is the main public tool page. Audit history is client-side
// and never sent to the server, so there is nothing sensitive to keep out
// of crawlers.
export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/audit`,
    languages: withHreflang("/audit"),
  },
  openGraph: {
    title: PAGE_TITLE,
    description:
      "Введите URL сайта — Seofriendly проведёт бесплатный SEO-аудит нейросетью и сформирует структурированный отчёт с приоритетами.",
    url: `${SITE_URL}/audit`,
    type: "website",
    locale: "ru_RU",
    siteName: "Seofriendly",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Seofriendly — бесплатный SEO-аудит нейросетью",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description:
      "Введите URL — получите структурированный отчёт от нейросети: HTTP, sitemap, robots, canonical, мета-теги, скорость.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

function buildAuditStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        path: "/audit",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        pageType: "WebApplication",
      }),
      pageBreadcrumb("Аудит", "/audit"),
    ],
  };
}

export default function AuditPage() {
  const structuredData = buildAuditStructuredData();
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs items={[{ label: "Аудит" }]} className="mb-3" />
          <PageHeader
            title="Аудит сайта"
            description="Введите URL, запустите проверку и откройте готовый диагностический отчёт."
          />

          <section className="mb-6 overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_10%_0%,rgba(180,83,9,0.16),transparent_32%),radial-gradient(circle_at_92%_100%,rgba(21,128,61,0.10),transparent_34%),var(--color-surface)] p-5 shadow-[0_18px_70px_rgba(27,27,25,0.06)] sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
              <div className="min-w-0">
                <p className="eyebrow text-faint">как работает аудит</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                  Что произойдёт после запуска
                </h2>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
                  Введите публичный URL сайта — headless-браузер обойдёт
                  страницы, соберёт технические факты: HTTP, sitemap.xml,
                  robots.txt, canonical, мета-теги, разметку и скорость. Затем
                  нейросеть превратит эти данные в отчёт с приоритетами.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-faint">
                  История проверок хранится локально в вашем браузере.
                  Обработка запускается автоматически и не требует ручной
                  технической настройки.
                </p>
              </div>

              <ul className="grid min-w-0 gap-2">
                {AUDIT_ARTIFACTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.title}
                      className="flex min-w-0 gap-3 rounded-xl border border-line bg-paper/75 p-4"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[12px] leading-relaxed text-muted">
                          {item.text}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
              <Link
                href="/knowledge"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-ink transition hover:border-line-strong hover:bg-paper"
              >
                <BookOpen className="h-4 w-4 text-accent" />
                Разобраться в терминах SEO
              </Link>
              <Link
                href="/services"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-ink transition hover:border-line-strong hover:bg-paper"
              >
                <Wrench className="h-4 w-4 text-accent" />
                Заказать внедрение правок
              </Link>
            </div>
          </section>

          <div className="grid min-w-0 gap-6 lg:grid-cols-[18rem_1fr]">
            <div className="min-w-0 lg:sticky lg:top-[88px] lg:self-start">
              <AuditHistorySidebar />
            </div>

            <div className="min-w-0 space-y-6">
              <AuditForm />
              <AuditWorkspaceEmpty />
              <ProcessLog />
              <ScreenshotGallery />
              <ReportCard />
            </div>
          </div>
        </div>
      </div>

      <ReportDialog />
    </main>
  );
}
