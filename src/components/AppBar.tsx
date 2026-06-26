"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import { LogoMark } from "@/components/LogoMark";

export function AppBar() {
  const pathname = usePathname();
  const { running } = useAuditStore(
    useShallow((s) => ({ running: s.running }))
  );
  const isAuditPage = pathname?.startsWith("/audit");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md text-left transition hover:opacity-80"
        >
          <LogoMark />
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              SEO Audit
            </span>
            <span className="eyebrow text-faint">opencode</span>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href={isAuditPage ? "/" : "/audit"}
            className="hidden text-[13px] font-medium text-muted transition hover:text-ink sm:inline-block"
          >
            {isAuditPage ? "Главная" : "Провести аудит"}
          </Link>
          <div className="flex items-center gap-2">
            {running ? (
              <span className="pulse-dot" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
            )}
            <span className="eyebrow text-muted">
              {running ? "идёт аудит" : "готово"}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
