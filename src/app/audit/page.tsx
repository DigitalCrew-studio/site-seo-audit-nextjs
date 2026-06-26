import type { Metadata } from "next";
import { AppBar } from "@/components/AppBar";
import { AuditForm } from "@/components/AuditForm";
import { AuditHistorySidebar } from "@/components/AuditHistorySidebar";
import { ProcessLog } from "@/components/ProcessLog";
import { ReportCard } from "@/components/ReportCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";

const SITE_URL = "https://seofrendly.ru";

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
      <AppBar />

      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow text-accent">рабочая область</span>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
                Аудит сайта
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                Введите URL, запустите проверку и откройте готовый
                диагностический отчёт.
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-[18rem_1fr]">
            <div className="min-w-0 lg:sticky lg:top-[88px] lg:self-start">
              <AuditHistorySidebar />
            </div>

            <div className="min-w-0 space-y-6">
              <AuditForm />
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
