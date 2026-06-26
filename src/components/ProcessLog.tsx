"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";

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

  // Auto-scroll the log panel as new entries arrive.
  useEffect(() => {
    if (!open) return;
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, open]);

  // Keep every log in the store; the UI filters debug-only entries based on
  // the live toggle so a flip during the run is reflected immediately.
  const visibleLogs = useMemo(
    () =>
      debugMode
        ? logs
        : logs.filter(
            (l) => l.type !== "debug" && l.type !== "tool_end"
          ),
    [logs, debugMode]
  );

  const latestLog = visibleLogs.at(-1);
  const latestText = latestLog ? formatLogSummary(latestLog) : running ? "Starting..." : "No events";

  if (!running && logs.length === 0) return null;

  return (
    <section className="border-y border-line py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="eyebrow shrink-0 text-faint">
          process — {running ? "live" : "ended"}
        </span>
        {running && (
          <span className="flex shrink-0 items-center gap-2">
            <span className="pulse-dot" />
            <span className="eyebrow text-accent">auditing</span>
          </span>
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted">
          {latestText}
        </span>
        <span className="eyebrow shrink-0 text-faint">
          {visibleLogs.length} events · {open ? "hide" : "show"}
        </span>
      </button>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDebugMode(!debugMode);
          }}
          aria-pressed={debugMode}
          title={
            debugMode
              ? "Hide debug events and tool completion details"
              : "Show debug events and tool completion details"
          }
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
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
          debug
        </button>
      </div>

      {/* Body */}
      {open && <div className="terminal-scroll mt-3 max-h-[22rem] space-y-1.5 overflow-y-auto font-mono text-[13px] leading-relaxed">
        {visibleLogs.map((log, idx) => (
          <div key={idx} className="flex gap-3">
            <span className="shrink-0 select-none text-faint">{log.time}</span>
            {log.type === "status" && (
              <span className="text-muted">{log.message}</span>
            )}
            {log.type === "tool" && (
              <span>
                <span className="text-faint">$</span>{" "}
                <span className="text-positive">{log.name}</span>
                <span className="text-muted">
                  (
                  {Object.entries(log.args)
                    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                    .join(", ")}
                  )
                </span>
              </span>
            )}
            {log.type === "tool_end" && (
              <span className="text-ink-soft">
                <span className="text-faint">↳</span> {log.name}{" "}
                <span
                  className={
                    log.ok ? "text-positive" : "text-accent"
                  }
                >
                  {log.ok ? "ok" : "failed"}
                </span>
                <span className="text-muted">
                  {" "}· {log.durationMs}ms · {log.bytes}B
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
                    {" "}(
                    {Object.entries(log.data)
                      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                      .join(", ")}
                    )
                  </span>
                )}
              </span>
            )}
            {log.type === "tool_error" && (
              <span className="text-accent">
                <span className="text-faint">!</span> {log.name} failed —{" "}
                {log.error}
              </span>
            )}
            {log.type === "error" && (
              <span className="text-red-700">
                <span className="text-faint">✕</span> {log.message}
              </span>
            )}
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-faint">
            <span className="inline-block h-3.5 w-1.5 animate-pulse bg-faint" />
            <span>waiting…</span>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>}
    </section>
  );
}

function formatLogSummary(log: ReturnType<typeof useAuditStore.getState>["logs"][number]): string {
  switch (log.type) {
    case "status":
      return log.message;
    case "tool":
      return `$ ${log.name}`;
    case "tool_end":
      return `${log.name} ${log.ok ? "ok" : "failed"} · ${log.durationMs}ms`;
    case "debug":
      return `· ${log.message}`;
    case "tool_error":
      return `! ${log.name} failed — ${log.error}`;
    case "error":
      return `✕ ${log.message}`;
  }
}
