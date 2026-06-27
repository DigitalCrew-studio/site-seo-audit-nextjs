"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useAuditStore } from "@/store/auditStore";
import { Badge, Button, Panel } from "@/components/ui";

export function ReportCard() {
  const report = useAuditStore((s) => s.report);
  const setReportOpen = useAuditStore((s) => s.setReportOpen);

  if (!report) return null;

  return (
    <Panel className="flex flex-col items-start justify-between gap-4 border-positive/30 bg-positive/5 p-5 sm:p-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-positive/10 text-positive">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-ink">Аудит завершён</p>
            <Badge tone="positive">отчёт готов</Badge>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Отчёт сохранён локально и доступен в истории аудитов.
          </p>
        </div>
      </div>
      <Button
        onClick={() => setReportOpen(true)}
        className="group w-full sm:w-auto"
      >
        Открыть отчёт
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Button>
    </Panel>
  );
}
