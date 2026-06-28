import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BRAND_EMAIL, BRAND_TELEGRAM_URL } from "@/lib/site";

const NAV_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/audit", label: "Аудит" },
  { href: "/services", label: "Услуги" },
  { href: "/settings", label: "Настройки" },
] as const;

const INFO_LINKS = [
  { href: "/knowledge", label: "База знаний" },
  { href: "/about", label: "О сервисе" },
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика конфиденциальности" },
] as const;

const TECH_LINKS = [
  { href: "/robots.txt", label: "robots.txt" },
  { href: "/sitemap.xml", label: "sitemap.xml" },
  { href: "/llms.txt", label: "llms.txt" },
] as const;

const CONTACT_LINKS = [
  { href: `mailto:${BRAND_EMAIL}`, label: BRAND_EMAIL },
  { href: BRAND_TELEGRAM_URL, label: "Telegram @BBYagah" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/70">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 md:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div className="max-w-md">
            <Link
              href="/"
              aria-label="Seofriendly — на главную"
              className="inline-flex items-center rounded-md transition hover:opacity-80"
            >
              <Logo variant="full" height={32} className="transition-all duration-500 ease-out" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Бесплатный SEO-аудит сайта нейросетью: технические факты,
              визуальные доказательства и отчёт с приоритетами.
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-faint">
              История аудитов и настройки интерфейса хранятся локально в браузере.
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-faint">
              Официальный адрес сервиса: seofrendly.ru
            </p>
          </div>

          <div>
            <p className="eyebrow text-faint">навигация</p>
            <nav className="mt-3 flex flex-col items-start">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[48px] items-center text-sm font-medium text-muted transition hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="eyebrow text-faint">информация</p>
            <nav className="mt-3 flex flex-col items-start">
              {INFO_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[48px] items-center text-sm font-medium text-muted transition hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="eyebrow text-faint">техническое</p>
            <nav className="mt-3 flex flex-col items-start">
              {TECH_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[48px] items-center font-mono text-[13px] text-muted transition hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="eyebrow text-faint">контакты</p>
            <nav className="mt-3 flex flex-col items-start">
              {CONTACT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[48px] items-center text-sm font-medium text-muted transition hover:text-ink"
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-[12px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Seofriendly</span>
          <span>Работает без регистрации и серверного хранения аудитов.</span>
        </div>
      </div>
    </footer>
  );
}
