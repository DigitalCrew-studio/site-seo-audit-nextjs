import { AppBar } from "@/components/AppBar";
import { SettingsForm } from "@/components/SettingsForm";

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
