import { AppBar } from "@/components/AppBar";
import { AuditForm } from "@/components/AuditForm";
import { ProcessLog } from "@/components/ProcessLog";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { ReportCard } from "@/components/ReportCard";
import { ReportDialog } from "@/components/ReportDialog";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <AppBar />

      {/* Backdrop + content */}
      <div className="paper-grid">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Intro */}
          <div className="mb-8 max-w-2xl">
            <span className="eyebrow text-accent">evidence-based · agentic</span>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-[2.5rem]">
              Audit any website&apos;s SEO the way a senior auditor would.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted">
              An OpenCode model drives headless Chromium to crawl pages, inspect
              metadata, render output, and read robots &amp; sitemaps — then
              writes a structured, prioritized report using the{" "}
              <code className="rounded bg-line px-1.5 py-0.5 font-mono text-[13px] text-ink-soft">
                site-seo-audit
              </code>{" "}
              skill.
            </p>
          </div>

          <div className="space-y-6">
            <AuditForm />
            <ProcessLog />
            <ScreenshotGallery />
            <ReportCard />
          </div>

          {/* Footer */}
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
