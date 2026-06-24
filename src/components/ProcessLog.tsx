"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";

export function ProcessLog() {
  const { logs, running } = useAuditStore(
    useShallow((s) => ({ logs: s.logs, running: s.running }))
  );
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the log panel as new entries arrive.
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
          <span className="ml-auto flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="eyebrow text-white/45">auditing</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className="terminal-scroll max-h-[22rem] space-y-1.5 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed">
        {logs.map((log, idx) => (
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
