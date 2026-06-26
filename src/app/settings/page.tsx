import type { Metadata } from "next";
import { AppBar } from "@/components/AppBar";
import { SettingsForm } from "@/components/SettingsForm";

const SITE_URL = "https://seofrendly.ru";
const SITE_NAME = "Seofriendly";

// /settings is private: it stores the user's API key, model, language and
// report preferences in localStorage. It must not be indexed, surfaced in
// search results, or distributed via the sitemap. It remains crawlable so
// crawlers can see the noindex directive; API routes are blocked in robots.ts.
export const metadata: Metadata = {
  title: "Настройки",
  description: "Локальные настройки Seofriendly: API-ключ, провайдер, модель.",
  alternates: {
    canonical: `${SITE_URL}/settings`,
  },
  openGraph: {
    title: "Настройки",
    description: "Локальные настройки Seofriendly: API-ключ, провайдер, модель.",
    url: `${SITE_URL}/settings`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
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
      <AppBar />

      <div className="paper-grid">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6">
            <span className="eyebrow text-accent">конфигурация</span>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
              Настройки Seofriendly
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Ключ доступа, провайдер, модель и язык отчёта. Все значения
              хранятся локально в браузере и не передаются на сторонние серверы.
            </p>
          </div>

          <SettingsForm />
        </div>
      </div>
    </main>
  );
}
