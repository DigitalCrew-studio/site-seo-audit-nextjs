"use client";

import { useAuditStore } from "@/store/auditStore";
import { LogoMark } from "@/components/LogoMark";

export function AppBar() {
  const running = useAuditStore((s) => s.running);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              SEO Audit
            </span>
            <span className="eyebrow text-faint">opencode</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {running ? (
            <span className="pulse-dot" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
          )}
          <span className="eyebrow text-muted">
            {running ? "running" : "idle"}
          </span>
        </div>
      </div>
    </header>
  );
}
