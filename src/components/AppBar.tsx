"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

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

// Только в мобильном меню: информационные разделы. В десктопной шапке
// оставляем 3 основных ссылки, чтобы не перегружать верхнюю навигацию.
const MOBILE_INFO_ITEMS: { href: string; label: string }[] = [
  { href: "/about", label: "О сервисе" },
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика конфиденциальности" },
];

export function AppBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compacted, setCompacted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let collapseTimer: number | null = null;

    const apply = () => {
      const isDown = window.scrollY > 12;
      if (isDown) {
        if (collapseTimer !== null) {
          window.clearTimeout(collapseTimer);
          collapseTimer = null;
        }
        setCompacted(true);
        setScrolled(true);
      } else if (compacted) {
        if (collapseTimer === null) {
          setScrolled(false);
          collapseTimer = window.setTimeout(() => {
            setCompacted(false);
            collapseTimer = null;
          }, 600);
        }
      } else {
        setScrolled(false);
        setCompacted(false);
      }
    };

    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => {
      window.removeEventListener("scroll", apply);
      if (collapseTimer !== null) window.clearTimeout(collapseTimer);
    };
  }, [compacted]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-out ${compacted ? "py-2" : "border-b border-line bg-surface/85 backdrop-blur"
        }`}
    >
      <div
        className={`mx-auto flex items-center justify-between gap-4 px-4 transition-all duration-500 ease-out sm:px-6 ${compacted
          ? "h-[76px] max-w-[min(68rem,calc(100%_-_1rem))] rounded-full border border-line/70 bg-surface/58 shadow-[0_18px_70px_rgba(27,27,25,0.12)] backdrop-blur-xl backdrop-saturate-150"
          : "h-[108px] max-w-6xl"
          }`}
      >
        <Link
          href="/"
          aria-label="Seofriendly — на главную"
          className="group flex items-center gap-3 rounded-full text-left transition hover:opacity-85"
        >
          <Logo
            variant="full"
            height={compacted ? 48 : 64}
            preload
            className="w-auto transition-all duration-500 ease-out"
          />
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group/link relative inline-flex min-h-[48px] items-center py-3 text-[14px] font-medium transition-colors ${active
                  ? "text-ink"
                  : "text-muted hover:text-ink"
                  }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-ink transition-all duration-300 ${active ? "w-full" : "w-0 group-hover/link:w-full"
                    }`}
                />
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent opacity-0 transition duration-300 group-hover/link:opacity-100" />
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-paper/75 text-ink-soft transition hover:border-line-strong hover:text-ink sm:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className={`mx-auto mt-2 max-w-[calc(100%_-_1rem)] overflow-hidden rounded-2xl border border-line bg-surface/88 shadow-[0_18px_70px_rgba(27,27,25,0.12)] backdrop-blur-xl sm:hidden ${scrolled ? "" : "mb-2"
            }`}
        >
          <nav className="flex flex-col gap-1 px-3 py-3">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group/mobile relative flex min-h-[48px] items-center rounded-xl px-3 py-3 text-[15px] font-medium transition ${active
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                >
                  {item.label}
                  {!active && (
                    <span className="absolute inset-y-2 left-1 w-0.5 rounded-full bg-accent opacity-0 transition group-hover/mobile:opacity-100" />
                  )}
                </Link>
              );
            })}
            <div
              aria-hidden="true"
              className="my-2 h-px w-full bg-line"
            />
            <p className="eyebrow px-3 pb-1 text-faint">информация</p>
            {MOBILE_INFO_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[48px] items-center rounded-xl px-3 py-3 text-[15px] font-medium text-muted transition hover:bg-paper hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
