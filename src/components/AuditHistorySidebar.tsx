"use client";

import type { MouseEvent, ReactNode } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  ChevronDown,
  ChevronRight,
  FileClock,
  MoreHorizontal,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { useAuditStore } from "@/store/auditStore";
import type { SavedAudit, SavedAuditStatus } from "@/store/auditStore";
import { Panel } from "@/components/ui";

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

function statusDotClass(status: SavedAuditStatus): string {
  switch (status) {
    case "running":
      return "bg-accent";
    case "completed":
      return "bg-positive";
    case "failed":
      return "bg-red-500";
    case "interrupted":
    default:
      return "bg-faint";
  }
}

function statusTextClass(status: SavedAuditStatus): string {
  switch (status) {
    case "running":
      return "text-accent";
    case "completed":
      return "text-positive";
    case "failed":
      return "text-red-700";
    case "interrupted":
    default:
      return "text-faint";
  }
}

type MetaItem = { text: string; tone?: "muted" | "status"; status?: SavedAuditStatus };

function JoinedMeta({ items }: { items: MetaItem[] }) {
  const visible = items.filter((item): item is MetaItem => Boolean(item.text));
  if (visible.length === 0) return null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-faint">
      {visible.map((item, i) => {
        const toneClass =
          item.tone === "status" && item.status
            ? statusTextClass(item.status)
            : undefined;
        return (
          <Fragment key={`${item.text}-${i}`}>
            {i > 0 ? <span aria-hidden="true">·</span> : null}
            <span className={toneClass}>{item.text}</span>
          </Fragment>
        );
      })}
    </span>
  );
}

function formatDuration(ms?: number): string | undefined {
  if (!ms || ms <= 0) return undefined;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}с`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}м ${s}с`;
  const h = Math.floor(m / 60);
  return `${h}ч ${m % 60}м`;
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
  const isLiveRun = audit.status === "running";
  const hasError = Boolean(audit.error);
  const logCount = audit.logCount ?? audit.logs.length;
  const screenshotCount = audit.screenshotCount ?? audit.screenshots.length;
  const reportImageCount = audit.reportImageCount ?? audit.reportImages.length;
  const duration = formatDuration(audit.durationMs);

  const metaItems: MetaItem[] = [
    { text: formatDateTime(audit.updatedAt) },
    ...(duration ? [{ text: duration }] : []),
    ...(logCount ? [{ text: `${logCount} логов` }] : []),
    ...(screenshotCount + reportImageCount > 0
      ? [{ text: `${screenshotCount + reportImageCount} изобр.` }]
      : []),
    {
      text: statusLabel(audit.status),
      tone: "status",
      status: audit.status,
    },
  ];

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
        className={`group flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition focus:outline-none focus-visible:ring-1 focus-visible:ring-ink/20 ${
          isActive
            ? "bg-paper"
            : "hover:bg-paper/60"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(audit.status)} ${
              isLiveRun ? "animate-pulse" : ""
            }`}
            aria-hidden="true"
          />
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink"
            title={audit.url}
          >
            {audit.domain || audit.title || audit.url}
          </span>
          <CardActions
            isLiveRunInBackground={isLiveRunInBackground}
            onStopRun={(e) => {
              e.stopPropagation();
              onStopRun(audit.id);
            }}
            onDelete={(e) => {
              e.stopPropagation();
              onDelete(audit.id);
            }}
          />
        </div>
        <JoinedMeta items={metaItems} />
        {hasError && audit.error ? (
          <p
            className="truncate text-[11px] text-red-700/80"
            title={audit.error}
          >
            {audit.error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function CardActions({
  isLiveRunInBackground,
  onStopRun,
  onDelete,
}: {
  isLiveRunInBackground: boolean;
  onStopRun: (e: MouseEvent) => void;
  onDelete: (e: MouseEvent) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen && !confirming) return;
    const onDoc = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-card-actions]")) return;
      setMenuOpen(false);
      setConfirming(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, confirming]);

  if (confirming) {
    return (
      <span
        data-card-actions
        className="ml-1 inline-flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
          className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:text-ink"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
            onDelete(e);
          }}
          className="rounded px-1.5 py-0.5 text-[10px] text-red-700 hover:text-red-800"
        >
          Удалить
        </button>
      </span>
    );
  }

  return (
    <span
      data-card-actions
      className="relative ml-1 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label="Действия"
        className="inline-flex h-5 w-5 items-center justify-center rounded text-faint opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-ink"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {menuOpen ? (
        <span
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 flex min-w-[140px] flex-col rounded-md border border-line bg-surface py-1 text-[12px] shadow-md"
        >
          {isLiveRunInBackground ? (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onStopRun(e);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-left text-ink-soft hover:bg-paper"
            >
              <Square className="h-3 w-3 fill-current" />
              Остановить
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setConfirming(true);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 text-left text-red-700 hover:bg-paper"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Удалить
          </button>
        </span>
      ) : null}
    </span>
  );
}

function GroupSection({
  label,
  count,
  summary,
  expanded,
  onToggle,
  onDeleteAll,
  children,
}: {
  label: string;
  count: number;
  summary: {
    status: SavedAuditStatus;
    failedCount: number;
    runningCount: number;
  };
  expanded: boolean;
  onToggle: () => void;
  onDeleteAll: () => void;
  children: React.ReactNode;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const onDoc = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-group-actions]")) return;
      setConfirming(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [confirming]);

  const summaryParts: string[] = [];
  summaryParts.push(`${count}`);
  if (summary.runningCount > 0) summaryParts.push(`${summary.runningCount} идёт`);
  if (summary.failedCount > 0) summaryParts.push(`${summary.failedCount} ош.`);

  return (
    <li>
      <div className="group flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] text-muted transition hover:text-ink">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ink/20"
        >
          <Chevron className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-semibold uppercase tracking-wider">
            {label}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-faint">
            {summaryParts.join(" · ")}
          </span>
        </button>
        <span
          data-group-actions
          className="ml-1 inline-flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {confirming ? (
            <>
              <span className="text-[10px] text-faint">Удалить {count}?</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                }}
                className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:text-ink"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                  onDeleteAll();
                }}
                className="rounded px-1.5 py-0.5 text-[10px] text-red-700 hover:text-red-800"
              >
                Удалить
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              title={`Удалить все аудиты для ${label}`}
              aria-label={`Удалить все аудиты для ${label}`}
              className="inline-flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-medium text-faint opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
              Удалить все
            </button>
          )}
        </span>
      </div>
      {expanded ? <ul className="space-y-0.5 pb-1">{children}</ul> : null}
    </li>
  );
}

function summarizeGroup(
  audits: SavedAudit[]
): {
  status: SavedAuditStatus;
  failedCount: number;
  runningCount: number;
} {
  const sorted = [...audits].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const runningCount = audits.filter((a) => a.status === "running").length;
  const failedCount = audits.filter((a) => a.status === "failed").length;
  const latest = sorted[0];
  const status: SavedAuditStatus = latest ? latest.status : "completed";
  return { status, failedCount, runningCount };
}

export function AuditHistorySidebar() {
  const {
    savedAudits,
    activeSavedAuditId,
    backgroundRunActive,
    newAudit,
    loadSavedAudit,
    deleteSavedAudit,
    deleteSavedAuditsByDomain,
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
      deleteSavedAuditsByDomain: s.deleteSavedAuditsByDomain,
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
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted">
          <FileClock className="h-3.5 w-3.5" />
          История
          {groups.length > 0 ? (
            <span className="font-mono text-[10px] text-faint">
              {groups.length}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={newAudit}
          className="inline-flex items-center gap-1 rounded text-[12px] text-muted transition hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Новый
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <p className="px-2 py-4 text-center text-[12px] text-faint">
            История появится после первого запуска.
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              const expanded = !collapsedKeys[group.key];
              const summary = summarizeGroup(group.audits);
              return (
                <GroupSection
                  key={group.key}
                  label={group.label}
                  count={group.audits.length}
                  summary={summary}
                  expanded={expanded}
                  onToggle={() => toggleGroup(group.key)}
                  onDeleteAll={() => {
                    if (group.audits.length === 0) return;
                    const domain =
                      group.audits[0]?.domain || group.label || group.key;
                    deleteSavedAuditsByDomain(domain);
                  }}
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
