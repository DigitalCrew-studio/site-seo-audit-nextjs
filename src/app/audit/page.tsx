import type { Metadata } from "next";
import { AuditForm } from "@/components/AuditForm";
import { AuditHistorySidebar } from "@/components/AuditHistorySidebar";
import { AuditWorkspaceEmpty } from "@/components/AuditWorkspaceEmpty";
import { ProcessLog } from "@/components/ProcessLog";
import { ReportCard } from "@/components/ReportCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { PageHeader } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

// /audit is indexable: it carries a static Russian description of what the
// audit does and is the main public tool page. History and API key are
// client-side and never sent to the server, so there is nothing sensitive
// to keep out of crawlers.
export const metadata: Metadata = {
  title: "Запустить бесплатный SEO-аудит",
  description:
    "Введите URL сайта — Seofriendly проведёт бесплатный SEO-аудит нейросетью: проверит HTTP, sitemap.xml, robots.txt, canonical, мета-теги, скорость и адаптивность и сформирует структурированный отчёт.",
  alternates: {
    canonical: `${SITE_URL}/audit`,
    languages: {
      "ru-RU": `${SITE_URL}/audit`,
    },
  },
  openGraph: {
    title: "Запустить бесплатный SEO-аудит",
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
    title: "Запустить бесплатный SEO-аудит",
    description:
      "Введите URL — получите структурированный отчёт от нейросети: HTTP, sitemap, robots, canonical, мета-теги, скорость.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuditPage() {
  return (
    <main className="min-h-screen">
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <PageHeader
            eyebrow="рабочая область"
            title="Аудит сайта"
            description="Введите URL, запустите проверку и откройте готовый диагностический отчёт."
          />

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
