"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Cog,
  Dot,
  Info,
  MessageSquare,
  Wrench,
  XCircle,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import type { LogEntry } from "@/lib/types";
import {
  CountPill,
  FilterPill,
  Panel,
  StatusPill,
  type PillTone,
} from "@/components/ui";

const STICK_THRESHOLD_PX = 32;
const PROGRAMMATIC_SCROLL_GUARD_MS = 450;

type LogFilter = "all" | "events" | "errors";

const FILTERS: { id: LogFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "events", label: "События" },
  { id: "errors", label: "Ошибки" },
];

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ");
  if (entries.length <= 800) return entries;
  return entries.slice(0, 800).trimEnd() + "…";
}

function pluralizeEvents(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "новое событие";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "новых события";
  return "новых событий";
}

function LogIcon({
  type,
  ok,
}: {
  type: LogEntry["type"];
  ok?: boolean;
}) {
  const cls = "h-3 w-3 shrink-0";
  switch (type) {
    case "tool":
      return <Wrench className={`${cls} text-accent`} />;
    case "tool_end":
      return ok ? (
        <Check className={`${cls} text-positive`} />
      ) : (
        <AlertTriangle className={`${cls} text-red-500`} />
      );
    case "tool_error":
      return <AlertTriangle className={`${cls} text-red-500`} />;
    case "error":
      return <XCircle className={`${cls} text-red-500`} />;
    case "debug":
      return <Dot className={`${cls} text-faint`} />;
    case "status":
    default:
      return <MessageSquare className={`${cls} text-muted`} />;
  }
}

function LogLine({ log }: { log: LogEntry }) {
  if (log.type === "status") {
    return (
      <span className="flex items-center gap-2 text-ink-soft">
        <span className="text-faint font-mono text-[11px]">{log.time}</span>
        <span>{log.message}</span>
      </span>
    );
  }
  if (log.type === "tool") {
    return (
      <span className="flex items-baseline gap-2 text-ink-soft">
        <span className="text-faint font-mono text-[11px]">{log.time}</span>
        <span className="text-faint font-mono text-[11px]">›</span>
        <span className="font-medium text-ink">{log.name}</span>
        <span className="truncate text-faint text-[11px]">
          ({formatArgs(log.args)})
        </span>
      </span>
    );
  }
  if (log.type === "tool_end") {
    return (
      <span className="flex items-baseline gap-2 text-ink-soft">
        <span className="text-faint font-mono text-[11px]">{log.time}</span>
        <span className="text-faint font-mono text-[11px]">↳</span>
        <span className="font-medium text-ink">{log.name}</span>
        <span
          className={log.ok ? "text-positive" : "text-red-700"}
        >
          {log.ok ? "готово" : "ошибка"}
        </span>
        <span className="text-faint text-[11px]">
          {log.durationMs}мс · {log.bytes}B
        </span>
        {log.error ? (
          <span className="truncate text-[11px] text-red-700" title={log.error}>
            — {log.error}
          </span>
        ) : null}
      </span>
    );
  }
  if (log.type === "tool_error") {
    return (
      <span className="flex items-baseline gap-2 text-red-700">
        <span className="text-faint font-mono text-[11px]">{log.time}</span>
        <span className="text-faint font-mono text-[11px]">!</span>
        <span className="font-medium text-ink">{log.name}</span>
        <span>— ошибка: {log.error}</span>
      </span>
    );
  }
  if (log.type === "error") {
    return (
      <span className="flex items-baseline gap-2 text-red-700">
        <span className="text-faint font-mono text-[11px]">{log.time}</span>
        <span className="text-faint font-mono text-[11px]">✕</span>
        <span>{log.message}</span>
      </span>
    );
  }
  if (log.type === "debug") {
    return (
      <span className="flex items-baseline gap-2 text-faint">
        <span className="text-faint font-mono text-[11px]">{log.time}</span>
        <span className="text-faint font-mono text-[11px]">·</span>
        <span>{log.message}</span>
        {log.data && Object.keys(log.data).length > 0 ? (
          <span className="truncate text-[11px] text-faint">
            ({formatArgs(log.data)})
          </span>
        ) : null}
      </span>
    );
  }
  return null;
}

function getPillFromLogs(
  logs: LogEntry[],
  running: boolean,
  auditStatus: "running" | "completed" | "failed" | "interrupted" | "unknown"
): {
  tone: PillTone;
  text: string;
  pulse: boolean;
} {
  if (logs.length === 0) {
    return { tone: "muted", text: "Нет событий", pulse: false };
  }
  if (running || auditStatus === "running") {
    const lastTool = [...logs].reverse().find((l) => l.type === "tool");
    if (lastTool) {
      return { tone: "accent", text: "Идёт инструмент", pulse: true };
    }
    return { tone: "accent", text: "Идёт", pulse: true };
  }
  if (auditStatus === "completed") {
    return { tone: "positive", text: "Готово", pulse: false };
  }
  if (auditStatus === "failed") {
    return { tone: "danger", text: "Ошибка", pulse: false };
  }
  if (auditStatus === "interrupted") {
    return { tone: "muted", text: "Прервано", pulse: false };
  }
  const lastError = [...logs].reverse().find((l) => l.type === "error" || l.type === "tool_error");
  if (lastError) {
    return { tone: "danger", text: "Ошибка", pulse: false };
  }
  const lastTool = [...logs].reverse().find((l) => l.type === "tool");
  if (lastTool) {
    return { tone: "accent", text: "Идёт инструмент", pulse: true };
  }
  return { tone: "positive", text: "Завершён", pulse: false };
}

function isErrorLog(log: LogEntry): boolean {
  return log.type === "error" || log.type === "tool_error";
}

export function ProcessLog() {
  const {
    logs,
    running,
    debugMode,
    setDebugMode,
    isViewingSavedAudit,
    activeSavedAuditId,
    savedAudits,
  } = useAuditStore(
    useShallow((s) => ({
      logs: s.logs,
      running: s.running,
      debugMode: s.debugMode,
      setDebugMode: s.setDebugMode,
      isViewingSavedAudit: s.isViewingSavedAudit,
      activeSavedAuditId: s.activeSavedAuditId,
      savedAudits: s.savedAudits,
    }))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const [filter, setFilter] = useState<LogFilter>("all");

  const scrollContainerToBottom = useCallback((smooth: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    programmaticScrollRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    if (smooth) {
      window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, PROGRAMMATIC_SCROLL_GUARD_MS);
    } else {
      window.requestAnimationFrame(() => {
        programmaticScrollRef.current = false;
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      scrollContainerToBottom(false);
    });
  }, [open, scrollContainerToBottom]);

  const handleToggleOpen = () => {
    if (!open) {
      stickToBottomRef.current = true;
      setPendingNewCount(0);
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    if (logs.length === 0) return;
    if (stickToBottomRef.current) {
      window.requestAnimationFrame(() => {
        scrollContainerToBottom(true);
      });
    } else {
      setPendingNewCount((c) => c + 1);
    }
  }, [logs, open, scrollContainerToBottom]);

  const onContainerScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < STICK_THRESHOLD_PX) {
      if (!stickToBottomRef.current) {
        stickToBottomRef.current = true;
        setPendingNewCount(0);
      }
    } else {
      stickToBottomRef.current = false;
    }
  }, []);

  const jumpToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    setPendingNewCount(0);
    scrollContainerToBottom(true);
  }, [scrollContainerToBottom]);

  // Group logs by "session": a tool line starts a new group, status/error lines
  // stay with the most recent group until another tool line arrives.
  type LogGroup = {
    id: string;
    toolName?: string;
    entries: LogEntry[];
    hasError: boolean;
  };

  const groupedLogs = useMemo<LogGroup[]>(() => {
    const groups: LogGroup[] = [];
    let current: LogGroup = { id: "init", entries: [], hasError: false };
    const seenIds = new Set<string>();
    const makeId = (prefix: string, idx: number) => {
      let candidate = `${prefix}-${idx}`;
      let n = 0;
      while (seenIds.has(candidate)) {
        n += 1;
        candidate = `${prefix}-${idx}-${n}`;
      }
      seenIds.add(candidate);
      return candidate;
    };
    for (let idx = 0; idx < logs.length; idx += 1) {
      const log = logs[idx];
      if (log.type === "tool") {
        if (current.entries.length > 0) groups.push(current);
        current = {
          id: makeId("tool", idx),
          toolName: log.name,
          entries: [log],
          hasError: false,
        };
      } else {
        current.entries.push(log);
        if (isErrorLog(log)) current.hasError = true;
      }
    }
    if (current.entries.length > 0) {
      if (seenIds.has(current.id)) {
        current = { ...current, id: makeId("tail", groups.length) };
      }
      groups.push(current);
    }
    return groups;
  }, [logs]);

  const visibleGroups = useMemo(() => {
    return groupedLogs
      .map((group) => {
        const entries = group.entries.filter((log) => {
          if (log.type === "debug" && !debugMode) return false;
          if (filter === "all") return true;
          if (filter === "errors") return isErrorLog(log);
          if (filter === "events") {
            if (log.type === "debug") return false;
            if (log.type === "tool_end" && !debugMode) return false;
            return true;
          }
          return true;
        });
        return { ...group, entries };
      })
      .filter((group) => group.entries.length > 0);
  }, [groupedLogs, filter, debugMode]);

  const errorCount = logs.filter(isErrorLog).length;
  const debugCount = logs.filter((l) => l.type === "debug").length;
  const activeAudit = isViewingSavedAudit
    ? savedAudits.find((entry) => entry.id === activeSavedAuditId)
    : undefined;
  const auditStatus = running
    ? ("running" as const)
    : activeAudit
      ? (activeAudit.status as "completed" | "failed" | "interrupted" | "running")
      : ("unknown" as const);
  const pill = getPillFromLogs(logs, running, auditStatus);
  const latestLog = logs.at(-1);

  if (!running && logs.length === 0) return null;

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Процесс
        </span>
        {running ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
              aria-hidden="true"
            />
            live
          </span>
        ) : isViewingSavedAudit && activeAudit ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper/60 px-2 py-0.5 text-[11px] font-medium text-faint">
            архив
            <span aria-hidden="true">·</span>
            <span className="truncate font-mono text-faint">
              {activeAudit.domain || activeAudit.title || activeAudit.url}
            </span>
          </span>
        ) : null}
        <StatusPill tone={pill.tone} pulse={pill.pulse}>
          {pill.text}
        </StatusPill>
        <CountPill>
          {logs.length} {logs.length === 1 ? "событие" : "событий"}
        </CountPill>
        {errorCount > 0 ? (
          <CountPill>
            <span className="text-red-700">{errorCount} ошибок</span>
          </CountPill>
        ) : null}
        {debugMode && debugCount > 0 ? (
          <CountPill>
            <span className="text-faint">{debugCount} отладка</span>
          </CountPill>
        ) : null}
        {latestLog ? (
          <span className="min-w-0 flex-1 truncate text-[12px] text-faint">
            {latestLog.type === "status"
              ? latestLog.message
              : latestLog.type === "tool"
                ? `› ${latestLog.name}`
                : latestLog.type === "tool_end"
                  ? `↳ ${latestLog.name} ${latestLog.ok ? "готово" : "ошибка"}`
                  : latestLog.type === "error"
                    ? latestLog.message
                    : latestLog.type === "tool_error"
                      ? `! ${latestLog.name} — ${latestLog.error}`
                      : `· ${latestLog.type}`}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <FilterPill
              key={f.id}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </FilterPill>
          ))}
          <FilterPill
            active={debugMode}
            onClick={() => setDebugMode(!debugMode)}
          >
            подробно
          </FilterPill>
          <button
            type="button"
            onClick={handleToggleOpen}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-faint transition hover:text-ink"
          >
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {open ? "скрыть" : "показать"}
          </button>
        </span>
      </div>

      {open ? (
        <div className="relative">
          <div
            ref={containerRef}
            onScroll={onContainerScroll}
            className="terminal-scroll max-h-[26rem] space-y-1 overflow-x-auto overflow-y-auto border-t border-line bg-paper/30 p-4 text-[12.5px] leading-relaxed sm:p-5"
          >
            {visibleGroups.length === 0 ? (
              <p className="text-[12px] text-faint">
                Нет событий для выбранного фильтра.
              </p>
            ) : null}
            {visibleGroups.map((group) => (
              <LogGroupRow
                key={group.id}
                group={group}
                debugMode={debugMode}
              />
            ))}
            {running ? (
              <div className="flex items-center gap-2 text-faint">
                <span className="inline-block h-3 w-1 animate-pulse bg-faint" />
                <span className="text-[12px]">ожидание…</span>
              </div>
            ) : null}
          </div>
          {pendingNewCount > 0 ? (
            <button
              type="button"
              onClick={jumpToBottom}
              className="absolute right-4 bottom-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11.5px] font-medium text-paper shadow-md transition hover:bg-ink-soft"
            >
              ↓ {pendingNewCount} {pluralizeEvents(pendingNewCount)}
            </button>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function LogGroupRow({
  group,
  debugMode,
}: {
  group: { id: string; toolName?: string; entries: LogEntry[]; hasError: boolean };
  debugMode: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const visibleEntries = group.entries.filter(
    (log) => debugMode || (log.type !== "debug" && log.type !== "tool_end")
  );
  if (visibleEntries.length === 0) return null;
  const headerLabel = group.toolName ?? group.entries[0]?.type ?? "событие";
  const last = visibleEntries[visibleEntries.length - 1];
  const first = visibleEntries[0];
  return (
    <div
      className={`rounded-md border ${
        group.hasError ? "border-red-200" : "border-line/70"
      } bg-surface/40`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11.5px] text-faint transition hover:text-ink"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <LogIcon
          type={first.type}
          ok={first.type === "tool_end" ? first.ok : undefined}
        />
        <span className="font-medium text-ink-soft">{headerLabel}</span>
        <span className="text-faint">
          · {visibleEntries.length}{" "}
          {visibleEntries.length === 1 ? "строка" : "строк"}
        </span>
        {last && last.type === "tool_end" ? (
          <span
            className={last.ok ? "text-positive" : "text-red-700"}
          >
            · {last.ok ? "готово" : "ошибка"}
          </span>
        ) : null}
        {last && last.type === "error" ? (
          <span className="truncate text-red-700">· {last.message}</span>
        ) : null}
      </button>
      {expanded ? (
        <div className="space-y-0.5 border-t border-line/60 px-3 py-2 text-[12.5px]">
          {visibleEntries.map((log, idx) => (
            <Fragment key={`${idx}-${log.type}-${log.time}`}>
              <LogLine log={log} />
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}
