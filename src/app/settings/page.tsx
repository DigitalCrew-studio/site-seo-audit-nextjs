import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

const SITE_NAME = "Seofriendly";

// /settings is private: it stores the user's language and report preferences
// in localStorage. It must not be indexed, surfaced in search results, or
// distributed via the sitemap. It remains crawlable so crawlers can see the
// noindex directive; API routes are blocked in robots.ts.
export const metadata: Metadata = {
  title: "Настройки",
  description:
    "Настройки Seofriendly: язык отчёта, подробность логов и локальные параметры интерфейса.",
  alternates: {
    canonical: `${SITE_URL}/settings`,
  },
  openGraph: {
    title: "Настройки",
    description:
      "Настройки Seofriendly: язык отчёта, подробность логов и локальные параметры интерфейса.",
    url: `${SITE_URL}/settings`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `Настройки — ${SITE_NAME}`,
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      nocache: true,
    },
  },
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen">
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <PageHeader
            eyebrow="конфигурация"
            title="Настройки Seofriendly"
            description="Язык отчёта, подробность логов и локальные параметры интерфейса. Для запуска аудита достаточно URL сайта."
          />

          <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
            <div className="min-w-0 lg:sticky lg:top-[88px] lg:self-start">
              <Panel as="aside" className="p-4">
                <p className="text-sm font-semibold text-ink">Разделы</p>
                <div className="mt-4 space-y-2 text-[13px]">
                  <div className="rounded-lg border border-line bg-paper/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">Локальная конфигурация</span>
                      <Badge tone="positive">активно</Badge>
                    </div>
                    <p className="mt-1 leading-relaxed text-muted">
                      Язык отчёта и подробность логов.
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashed border-line bg-surface px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-muted">Аккаунт</span>
                      <Badge tone="neutral">позже</Badge>
                    </div>
                    <p className="mt-1 leading-relaxed text-faint">
                      Профиль и синхронизация появятся отдельным этапом.
                    </p>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="min-w-0 space-y-6">
              <SettingsForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
