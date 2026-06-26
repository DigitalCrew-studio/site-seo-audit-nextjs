"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import { Badge, Panel, PanelHeader } from "@/components/ui";

const STICK_THRESHOLD_PX = 32;
const PROGRAMMATIC_SCROLL_GUARD_MS = 450;

function formatLogSummary(
  log: ReturnType<typeof useAuditStore.getState>["logs"][number]
): string {
  switch (log.type) {
    case "status":
      return log.message;
    case "tool":
      return `$ ${log.name}`;
    case "tool_end":
      return `${log.name} ${log.ok ? "готово" : "ошибка"} · ${log.durationMs}мс`;
    case "debug":
      return `· ${log.message}`;
    case "tool_error":
      return `! ${log.name} — ошибка: ${log.error}`;
    case "error":
      return `✕ ${log.message}`;
  }
}

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

export function ProcessLog() {
  const { logs, running, debugMode, setDebugMode } = useAuditStore(
    useShallow((s) => ({
      logs: s.logs,
      running: s.running,
      debugMode: s.debugMode,
      setDebugMode: s.setDebugMode,
    }))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  // Whether the viewport should follow the tail of the log. Flipped to false
  // when the user scrolls up to read older entries, and back to true when they
  // return to the bottom (or click the "new events" pill).
  const stickToBottomRef = useRef(true);
  // Guard so onScroll events fired by our own scrollTo() don't flip the stick
  // state mid-animation.
  const programmaticScrollRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pendingNewCount, setPendingNewCount] = useState(0);

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

  // When the panel opens, snap to the tail so the latest events are visible.
  // The stick/counter reset happens in the click handler (where the user
  // intent lives); the effect only needs to do the DOM-side scroll once the
  // container is mounted.
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

  // On new log entries: if the user is already at the bottom, follow along;
  // otherwise leave them where they are and bump the unread counter.
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

  const visibleLogs = useMemo(
    () =>
      debugMode
        ? logs
        : logs.filter((l) => l.type !== "debug" && l.type !== "tool_end"),
    [logs, debugMode]
  );

  const latestLog = visibleLogs.at(-1);
  const latestText = latestLog
    ? formatLogSummary(latestLog)
    : running
      ? "Запуск…"
      : "Нет событий";

  if (!running && logs.length === 0) return null;

  return (
    <Panel>
      <PanelHeader
        title="Процесс аудита"
        description={
          <span className="block truncate font-mono text-[12px] text-muted">
            {latestText}
          </span>
        }
        meta={
          running ? (
            <Badge tone="accent">
              <span className="mr-1 pulse-dot" /> идёт
            </Badge>
          ) : (
            <Badge tone="neutral">завершён</Badge>
          )
        }
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDebugMode(!debugMode)}
              aria-pressed={debugMode}
              title={
                debugMode
                  ? "Скрыть отладочные события"
                  : "Показать отладочные события"
              }
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
                debugMode
                  ? "border-positive/30 bg-positive/5 text-positive hover:bg-positive/10"
                  : "border-line text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full transition ${
                  debugMode ? "bg-positive" : "bg-faint"
                }`}
              />
              подробно
            </button>
            <button
              type="button"
              onClick={handleToggleOpen}
              aria-expanded={open}
              className="inline-flex min-h-8 items-center rounded-md border border-line-strong bg-paper px-2.5 py-1 text-[12px] font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
            >
              {visibleLogs.length} событий · {open ? "скрыть" : "показать"}
            </button>
          </div>
        }
      />

      {open && (
        <div className="relative">
          <div
            ref={containerRef}
            onScroll={onContainerScroll}
            className="terminal-scroll max-h-[22rem] space-y-1.5 overflow-x-auto overflow-y-auto bg-paper/35 p-5 font-mono text-[13px] leading-relaxed sm:p-6"
          >
            {visibleLogs.map((log, idx) => (
              <div key={idx} className="flex min-w-0 gap-3">
                <span className="shrink-0 select-none text-faint">{log.time}</span>
                <span className="min-w-0 break-words">
                  {log.type === "status" && (
                    <span className="text-muted">{log.message}</span>
                  )}
                  {log.type === "tool" && (
                    <span>
                      <span className="text-faint">$</span>{" "}
                      <span className="text-positive">{log.name}</span>
                      <span className="text-muted">
                        ({formatArgs(log.args)})
                      </span>
                    </span>
                  )}
                  {log.type === "tool_end" && (
                    <span className="text-ink-soft">
                      <span className="text-faint">↳</span> {log.name}{" "}
                      <span
                        className={log.ok ? "text-positive" : "text-accent"}
                      >
                        {log.ok ? "готово" : "ошибка"}
                      </span>
                      <span className="text-muted">
                        {" "}
                        · {log.durationMs}мс · {log.bytes}B
                      </span>
                      {log.error && (
                        <span className="text-accent"> — {log.error}</span>
                      )}
                    </span>
                  )}
                  {log.type === "debug" && (
                    <span className="text-ink-soft">
                      <span className="text-faint">·</span> {log.message}
                      {log.data && Object.keys(log.data).length > 0 && (
                        <span className="text-muted">
                          {" "}
                          ({formatArgs(log.data)})
                        </span>
                      )}
                    </span>
                  )}
                  {log.type === "tool_error" && (
                    <span className="text-accent">
                      <span className="text-faint">!</span> {log.name} — ошибка:{" "}
                      {log.error}
                    </span>
                  )}
                  {log.type === "error" && (
                    <span className="text-red-700">
                      <span className="text-faint">✕</span> {log.message}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {running && (
              <div className="flex items-center gap-2 text-faint">
                <span className="inline-block h-3.5 w-1.5 animate-pulse bg-faint" />
                <span>ожидание…</span>
              </div>
            )}
          </div>
          {pendingNewCount > 0 && (
            <button
              type="button"
              onClick={jumpToBottom}
              className="absolute right-4 bottom-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-paper px-3 py-1.5 text-[12px] font-medium text-ink-soft shadow-sm transition hover:border-ink/30 hover:text-ink"
            >
              ↓ {pendingNewCount} {pluralizeEvents(pendingNewCount)}
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}
