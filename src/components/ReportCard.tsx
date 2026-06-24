"use client";

import { ArrowUpRight } from "lucide-react";
import { useAuditStore } from "@/store/auditStore";

export function ReportCard() {
  const report = useAuditStore((s) => s.report);
  const setReportOpen = useAuditStore((s) => s.setReportOpen);

  if (!report) return null;

  return (
    <section className="flex flex-col items-start justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-positive/10 text-positive">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m3.5 8.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Audit complete</p>
          <p className="eyebrow mt-0.5 text-faint">report ready to review</p>
        </div>
      </div>
      <button
        onClick={() => setReportOpen(true)}
        className="group inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink-soft"
      >
        Open report
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </section>
  );
}
