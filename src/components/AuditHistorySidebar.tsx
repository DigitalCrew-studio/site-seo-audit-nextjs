"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { FileClock, Plus, Trash2, Globe2 } from "lucide-react";
import { useAuditStore } from "@/store/auditStore";
import type { SavedAudit, SavedAuditStatus } from "@/store/auditStore";

const LOCALE = "ru-RU";

function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(LOCALE, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function statusLabel(status: SavedAuditStatus): string {
  switch (status) {
    case "running":
      return "Идёт";
    case "completed":
      return "Готово";
    case "failed":
      return "Ошибка";
    case "interrupted":
      return "Прервано";
  }
}

function languageLabel(language: SavedAudit["language"]): string {
  return language === "ru" ? "RU" : "EN";
}

function statusClasses(status: SavedAuditStatus): string {
  switch (status) {
    case "running":
      return "border-accent/30 bg-accent-soft text-accent";
    case "completed":
      return "border-positive/30 bg-positive/10 text-positive";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "interrupted":
      return "border-line-strong bg-paper text-muted";
  }
}

function displayUrl(audit: SavedAudit): string {
  return audit.domain || audit.title || audit.url;
}

function ConfirmDelete({
  onCancel,
  onConfirm,
}: {
  onCancel: (e: React.MouseEvent) => void;
  onConfirm: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      role="group"
      className="ml-1 inline-flex shrink-0 items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted transition hover:border-line-strong hover:text-ink"
      >
        Отмена
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 transition hover:bg-red-100"
      >
        Удалить
      </button>
    </span>
  );
}

function SavedAuditCard({
  audit,
  isActive,
  onOpen,
  onDelete,
}: {
  audit: SavedAudit;
  isActive: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(audit.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(audit.id);
          }
        }}
        className={`group flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border bg-surface px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 ${
          isActive
            ? "border-ink/40 shadow-[0_1px_0_0_rgba(27,27,25,0.06)]"
            : "border-line hover:border-line-strong"
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-paper text-muted">
            <Globe2 className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[13px] font-medium text-ink"
              title={audit.url}
            >
              {displayUrl(audit)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-faint">
              {formatDateTime(audit.updatedAt)} · {languageLabel(audit.language)}
            </p>
          </div>
          {confirming ? (
            <ConfirmDelete
              onCancel={(e) => {
                e.stopPropagation();
                setConfirming(false);
              }}
              onConfirm={(e) => {
                e.stopPropagation();
                setConfirming(false);
                onDelete(audit.id);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              title="Удалить аудит"
              aria-label="Удалить аудит"
              className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100 hover:bg-paper hover:text-red-700 focus:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusClasses(audit.status)}`}
          >
            {statusLabel(audit.status)}
          </span>
          {audit.summary && (
            <span className="truncate text-[12px] text-muted" title={audit.summary}>
              {audit.summary}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export function AuditHistorySidebar() {
  const { savedAudits, activeSavedAuditId, newAudit, loadSavedAudit, deleteSavedAudit, hydrateSavedAudits } =
    useAuditStore(
      useShallow((s) => ({
        savedAudits: s.savedAudits,
        activeSavedAuditId: s.activeSavedAuditId,
        newAudit: s.newAudit,
        loadSavedAudit: s.loadSavedAudit,
        deleteSavedAudit: s.deleteSavedAudit,
        hydrateSavedAudits: s.hydrateSavedAudits,
      }))
    );

  useEffect(() => {
    hydrateSavedAudits();
  }, [hydrateSavedAudits]);

  const sorted = useMemo(
    () =>
      [...savedAudits].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [savedAudits]
  );

  return (
    <aside className="flex h-full flex-col rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-ink">Аудиты</h2>
          <span className="eyebrow text-faint">
            {sorted.length > 0 ? `— ${sorted.length}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={newAudit}
          className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-paper px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Новый аудит
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {sorted.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-muted">
            История аудитов появится после первого запуска.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((audit) => (
              <SavedAuditCard
                key={audit.id}
                audit={audit}
                isActive={audit.id === activeSavedAuditId}
                onOpen={loadSavedAudit}
                onDelete={deleteSavedAudit}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
