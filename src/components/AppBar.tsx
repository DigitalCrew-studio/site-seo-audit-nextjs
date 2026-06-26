"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import { LogoMark } from "@/components/LogoMark";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string | null) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", match: (p) => p === "/" },
  { href: "/audit", label: "Аудит", match: (p) => Boolean(p?.startsWith("/audit")) },
  { href: "/settings", label: "Настройки", match: (p) => Boolean(p?.startsWith("/settings")) },
];

export function AppBar() {
  const pathname = usePathname();
  const { running } = useAuditStore(
    useShallow((s) => ({ running: s.running }))
  );

  useEffect(() => {
    if (!running) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [running]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md text-left transition hover:opacity-80"
        >
          <LogoMark size={32} />
          <div className="flex items-baseline gap-2">
            <span className="text-[19px] font-semibold tracking-tight text-ink">
              Seofriendly
            </span>
            <span className="hidden eyebrow text-faint sm:inline">
              seo-аудит
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-[14px] font-medium transition ${
                  active
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="ml-2 hidden items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5 sm:ml-3 sm:flex">
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
