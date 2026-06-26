"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import { Badge, Panel, PanelBody, PanelHeader } from "@/components/ui";

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

export function ProcessLog() {
  const { logs, running, debugMode, setDebugMode } = useAuditStore(
    useShallow((s) => ({
      logs: s.logs,
      running: s.running,
      debugMode: s.debugMode,
      setDebugMode: s.setDebugMode,
    }))
  );
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, open]);

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
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex min-h-8 items-center rounded-md border border-line-strong bg-paper px-2.5 py-1 text-[12px] font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink"
            >
              {visibleLogs.length} событий · {open ? "скрыть" : "показать"}
            </button>
          </div>
        }
      />

      {open && (
        <PanelBody className="terminal-scroll max-h-[22rem] space-y-1.5 overflow-x-auto overflow-y-auto bg-paper/35 font-mono text-[13px] leading-relaxed">
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
          <div ref={logsEndRef} />
        </PanelBody>
      )}
    </Panel>
  );
}
