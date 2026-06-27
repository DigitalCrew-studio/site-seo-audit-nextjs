import type { Metadata } from "next";
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

// /audit is indexable: it carries a static Russian description of what the
// audit does and is the main public tool page. History and API key are
// client-side and never sent to the server, so there is nothing sensitive
// to keep out of crawlers.
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
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Breadcrumbs items={[{ label: "Аудит" }]} className="mb-3" />
          <PageHeader
            title="Аудит сайта"
            description="Введите URL, запустите проверку и откройте готовый диагностический отчёт."
          />

          <section className="prose prose-neutral mb-6 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
            <p>
              Введите публичный URL сайта — headless-браузер обойдёт
              страницы, соберёт технические факты (HTTP, sitemap.xml,
              robots.txt, canonical, мета-теги, разметку, скорость), а
              нейросеть превратит их в структурированный отчёт с
              приоритетами. В результате вы получите три артефакта: текст
              отчёта с приоритетами, скриншоты ключевых страниц и карту
              обхода с HTTP-следами. История проверок и API-ключ
              хранятся локально в вашем браузере, сервер аудита не
              сохраняет результаты.
            </p>
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
