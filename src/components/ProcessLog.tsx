"use client";

import { useEffect, useMemo, useRef } from "react";
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

  // Auto-scroll the log panel as new entries arrive.
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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

  if (!running && logs.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-line-strong bg-[#0f0f0e]">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        <span className="eyebrow ml-2 text-white/35">
          process — {running ? "live" : "ended"}
        </span>
        {running && (
          <span className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="eyebrow text-white/45">auditing</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => setDebugMode(!debugMode)}
          aria-pressed={debugMode}
          title={
            debugMode
              ? "Hide debug events and tool completion details"
              : "Show debug events and tool completion details"
          }
          className={`ml-auto inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
            debugMode
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
              : "border-white/15 text-white/55 hover:border-white/30 hover:text-white/80"
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full transition ${
              debugMode ? "bg-emerald-300" : "bg-white/40"
            }`}
          />
          debug
        </button>
      </div>

      {/* Body */}
      <div className="terminal-scroll max-h-[22rem] space-y-1.5 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed">
        {visibleLogs.map((log, idx) => (
          <div key={idx} className="flex gap-3">
            <span className="shrink-0 select-none text-white/25">{log.time}</span>
            {log.type === "status" && (
              <span className="text-white/70">{log.message}</span>
            )}
            {log.type === "tool" && (
              <span>
                <span className="text-white/30">$</span>{" "}
                <span className="text-emerald-300/90">{log.name}</span>
                <span className="text-white/45">
                  (
                  {Object.entries(log.args)
                    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                    .join(", ")}
                  )
                </span>
              </span>
            )}
            {log.type === "tool_end" && (
              <span className="text-sky-300/90">
                <span className="text-white/30">↳</span> {log.name}{" "}
                <span
                  className={
                    log.ok ? "text-emerald-300/90" : "text-amber-300/90"
                  }
                >
                  {log.ok ? "ok" : "failed"}
                </span>
                <span className="text-white/45">
                  {" "}· {log.durationMs}ms · {log.bytes}B
                </span>
                {log.error && (
                  <span className="text-amber-300/90"> — {log.error}</span>
                )}
              </span>
            )}
            {log.type === "debug" && (
              <span className="text-sky-300/80">
                <span className="text-white/30">·</span> {log.message}
                {log.data && Object.keys(log.data).length > 0 && (
                  <span className="text-white/35">
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
              <span className="text-amber-300">
                <span className="text-white/30">!</span> {log.name} failed —{" "}
                {log.error}
              </span>
            )}
            {log.type === "error" && (
              <span className="text-red-300">
                <span className="text-white/30">✕</span> {log.message}
              </span>
            )}
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-white/35">
            <span className="inline-block h-3.5 w-1.5 animate-pulse bg-white/40" />
            <span>waiting…</span>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
    </section>
  );
}
