"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, FileText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";

export function ReportDialog() {
  const { report, reportOpen, setReportOpen } = useAuditStore(
    useShallow((s) => ({
      report: s.report,
      reportOpen: s.reportOpen,
      setReportOpen: s.setReportOpen,
    }))
  );

  useEffect(() => {
    if (!reportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReportOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [reportOpen, setReportOpen]);

  if (!reportOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="SEO audit report"
      onClick={() => setReportOpen(false)}
    >
      <div
        className="mx-auto flex h-full w-full max-w-4xl flex-col px-4 py-4 sm:px-6 sm:py-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-line-strong bg-surface px-5 py-3">
          <div className="flex items-center gap-2.5 text-ink">
            <FileText className="h-4 w-4 text-muted" />
            <span className="text-sm font-semibold">SEO Audit Report</span>
            <span className="eyebrow ml-1 text-faint">markdown</span>
          </div>
          <button
            onClick={() => setReportOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            Close
            <span className="eyebrow rounded border border-line px-1 py-0.5 text-faint">
              esc
            </span>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Document */}
        <div className="terminal-scroll flex-1 overflow-y-auto overflow-x-hidden rounded-b-xl border border-line-strong bg-surface shadow-2xl">
          <article className="mx-auto max-w-3xl px-6 py-10 sm:px-12 sm:py-14">
            <div className="prose prose-stone prose-headings:tracking-tight prose-headings:scroll-mt-4 prose-th:font-mono prose-th:text-[12px] prose-th:uppercase prose-th:tracking-wider prose-pre:rounded-lg prose-pre:border prose-pre:border-line">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
