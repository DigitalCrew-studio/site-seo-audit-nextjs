"use client";

import { FileSearch } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import { EmptyState } from "@/components/ui";

export function AuditWorkspaceEmpty() {
  const { running, logs, screenshots, report } = useAuditStore(
    useShallow((s) => ({
      running: s.running,
      logs: s.logs,
      screenshots: s.screenshots,
      report: s.report,
    }))
  );

  if (running || logs.length > 0 || screenshots.length > 0 || report) return null;

  return (
    <EmptyState
      icon={<FileSearch className="h-4 w-4" />}
      title="Рабочая область готова"
      description="После запуска здесь появятся ход проверки, скриншоты страниц и готовый отчёт. История аудитов останется слева."
    />
  );
}
