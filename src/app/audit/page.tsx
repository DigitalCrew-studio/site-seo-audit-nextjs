import { AppBar } from "@/components/AppBar";
import { AuditForm } from "@/components/AuditForm";
import { AuditHistorySidebar } from "@/components/AuditHistorySidebar";
import { ProcessLog } from "@/components/ProcessLog";
import { ReportCard } from "@/components/ReportCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";

export default function AuditPage() {
  return (
    <main className="min-h-screen">
      <AppBar />

      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow text-accent">Рабочая область</span>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
                Аудит сайта
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                Введите URL, запустите проверку и откройте готовый диагностический отчёт.
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-[18rem_1fr]">
            <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
              <AuditHistorySidebar />
            </div>

            <div className="min-w-0 space-y-6">
              <AuditForm />
              <ProcessLog />
              <ScreenshotGallery />
              <ReportCard />
            </div>
          </div>

          <footer className="mt-12 flex flex-col gap-1 border-t border-line pt-6 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
            <span>
              Powered by OpenCode · Playwright ·{" "}
              <span className="font-mono text-[12px]">site-seo-audit skill</span>
            </span>
            <span className="font-mono text-[12px] uppercase tracking-wider">
              v1
            </span>
          </footer>
        </div>
      </div>

      <ReportDialog />
    </main>
  );
}
