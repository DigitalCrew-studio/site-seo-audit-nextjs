"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  FileClock,
  Plus,
  Trash2,
  Globe2,
  Radio,
  Square,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuditStore } from "@/store/auditStore";
import type { SavedAudit, SavedAuditStatus } from "@/store/auditStore";
import { Badge, Panel } from "@/components/ui";

const LOCALE = "ru-RU";

function groupKeyForAudit(audit: SavedAudit): string {
  return (audit.domain || audit.title || audit.url || "").toLowerCase();
}

function groupLabelForAudit(audit: SavedAudit): string {
  return audit.domain || audit.title || audit.url;
}

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

function statusTone(status: SavedAuditStatus): ComponentProps<typeof Badge>["tone"] {
  switch (status) {
    case "running":
      return "accent";
    case "completed":
      return "positive";
    case "failed":
      return "danger";
    case "interrupted":
      return "neutral";
  }
}

function displayUrl(audit: SavedAudit): string {
  return audit.domain || audit.title || audit.url;
}

function ConfirmDelete({
  onCancel,
  onConfirm,
}: {
  onCancel: (e: MouseEvent) => void;
  onConfirm: (e: MouseEvent) => void;
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
  isLiveRunInBackground,
  onOpen,
  onDelete,
  onStopRun,
}: {
  audit: SavedAudit;
  isActive: boolean;
  isLiveRunInBackground: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onStopRun: (id: string) => void;
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

  const isLiveRun = audit.status === "running";

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
            : isLiveRunInBackground
              ? "border-accent/30 ring-1 ring-accent/15"
              : "border-line hover:border-line-strong"
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted ${
              isLiveRun ? "bg-accent-soft text-accent" : "bg-paper"
            }`}
          >
            {isLiveRun ? (
              <Radio className="h-3.5 w-3.5" />
            ) : (
              <Globe2 className="h-3.5 w-3.5" />
            )}
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
          ) : isLiveRunInBackground ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStopRun(audit.id);
              }}
              title="Остановить аудит"
              aria-label="Остановить аудит"
              className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-faint opacity-0 transition group-hover:opacity-100 hover:bg-paper hover:text-red-700 focus:opacity-100"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
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
          {isLiveRun ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-accent">
              <span className="pulse-dot" />
              {isLiveRunInBackground ? "В фоне" : "Идёт"}
            </span>
          ) : (
            <Badge tone={statusTone(audit.status)} className="px-1.5 py-0.5">
              {statusLabel(audit.status)}
            </Badge>
          )}
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

function GroupSection({
  label,
  count,
  summary,
  expanded,
  forcedExpanded,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  summary: { status: SavedAuditStatus; label: string };
  expanded: boolean;
  forcedExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const isOpen = expanded || forcedExpanded;
  const Chevron = isOpen ? ChevronDown : ChevronRight;
  return (
    <li className="rounded-lg border border-line bg-surface/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        disabled={forcedExpanded}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
          forcedExpanded
            ? "cursor-default"
            : "hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
        }`}
      >
        <Chevron
          className={`h-3.5 w-3.5 shrink-0 text-muted transition ${
            forcedExpanded ? "opacity-70" : ""
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
          {label}
        </span>
        <Badge tone="neutral" className="px-1.5 py-0.5">
          {count}
        </Badge>
        <Badge tone={statusTone(summary.status)} className="px-1.5 py-0.5">
          {summary.label}
        </Badge>
      </button>
      {isOpen ? (
        <ul className="space-y-1.5 border-t border-line/70 px-2 py-2">
          {children}
        </ul>
      ) : null}
    </li>
  );
}

function summarizeGroup(audits: SavedAudit[]): {
  status: SavedAuditStatus;
  label: string;
} {
  if (audits.some((a) => a.status === "running")) {
    return { status: "running", label: "Идёт" };
  }
  if (audits.some((a) => a.status === "failed")) {
    return { status: "failed", label: "Ошибка" };
  }
  if (audits.some((a) => a.status === "interrupted")) {
    return { status: "interrupted", label: "Прервано" };
  }
  return { status: "completed", label: "Готово" };
}

export function AuditHistorySidebar() {
  const {
    savedAudits,
    activeSavedAuditId,
    backgroundRunActive,
    newAudit,
    loadSavedAudit,
    deleteSavedAudit,
    cancelBackgroundRun,
    hydrateSavedAudits,
  } = useAuditStore(
    useShallow((s) => ({
      savedAudits: s.savedAudits,
      activeSavedAuditId: s.activeSavedAuditId,
      backgroundRunActive: s.backgroundRunActive,
      newAudit: s.newAudit,
      loadSavedAudit: s.loadSavedAudit,
      deleteSavedAudit: s.deleteSavedAudit,
      cancelBackgroundRun: s.cancelBackgroundRun,
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

  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        audits: SavedAudit[];
        latestUpdatedAt: number;
      }
    >();
    for (const audit of sorted) {
      const key = groupKeyForAudit(audit) || "_";
      const label = groupLabelForAudit(audit) || "Без адреса";
      const existing = map.get(key);
      const updatedAt = new Date(audit.updatedAt).getTime();
      if (existing) {
        existing.audits.push(audit);
        if (updatedAt > existing.latestUpdatedAt) {
          existing.latestUpdatedAt = updatedAt;
          existing.label = label;
        }
      } else {
        map.set(key, { key, label, audits: [audit], latestUpdatedAt: updatedAt });
      }
    }
    return [...map.values()].sort(
      (a, b) => b.latestUpdatedAt - a.latestUpdatedAt
    );
  }, [sorted]);

  const activeGroupKey = useMemo(() => {
    if (!activeSavedAuditId) return null;
    const active = sorted.find((a) => a.id === activeSavedAuditId);
    if (!active) return null;
    return groupKeyForAudit(active) || "_";
  }, [activeSavedAuditId, sorted]);

  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) => {
    setCollapsedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // The audit that is currently streaming is the one with status === "running".
  // It lives "in the background" if the user is viewing a different audit.
  const liveRun = sorted.find((a) => a.status === "running");
  const isLiveRunInBackground =
    !!liveRun && backgroundRunActive && liveRun.id !== activeSavedAuditId;

  return (
    <Panel as="aside" className="flex h-full max-h-[calc(100vh-120px)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-ink">Аудиты</h2>
          {groups.length > 0 ? (
            <Badge tone="neutral">{groups.length}</Badge>
          ) : null}
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
        {groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-muted">
            История аудитов появится после первого запуска.
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              const isActiveGroup = group.key === activeGroupKey;
              const expanded = !collapsedKeys[group.key];
              const summary = summarizeGroup(group.audits);
              return (
                <GroupSection
                  key={group.key}
                  label={group.label}
                  count={group.audits.length}
                  summary={summary}
                  expanded={expanded}
                  forcedExpanded={isActiveGroup}
                  onToggle={() => toggleGroup(group.key)}
                >
                  {group.audits.map((audit) => (
                    <SavedAuditCard
                      key={audit.id}
                      audit={audit}
                      isActive={audit.id === activeSavedAuditId}
                      isLiveRunInBackground={
                        isLiveRunInBackground && audit.id === liveRun?.id
                      }
                      onOpen={loadSavedAudit}
                      onDelete={deleteSavedAudit}
                      onStopRun={() => cancelBackgroundRun()}
                    />
                  ))}
                </GroupSection>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
