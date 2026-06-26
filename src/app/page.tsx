import Link from "next/link";
import { ArrowRight, Globe2, ShieldCheck, FileSearch, BarChart3, Camera, Link2, Activity, Building2 } from "lucide-react";
import { AppBar } from "@/components/AppBar";

type Capability = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CAPABILITIES: Capability[] = [
  {
    title: "HTTP, редиректы, заголовки",
    description:
      "Проверяем коды ответов, цепочки редиректов, заголовки безопасности и сжатие, чтобы в отчёте были только реальные сетевые следы сайта.",
    icon: ShieldCheck,
  },
  {
    title: "Метаданные, canonical, заголовки",
    description:
      "Считываем title, description, OG/Twitter, canonical, robots и иерархию заголовков с реальной страницы, отрендеренной в headless Chromium.",
    icon: FileSearch,
  },
  {
    title: "Sitemap и выборка страниц",
    description:
      "Парсим sitemap.xml, контрольные URL и небольшую выборку внутренних страниц, чтобы видеть структуру сайта, а не одну точку входа.",
    icon: Globe2,
  },
  {
    title: "Hreflang и локализация",
    description:
      "Сверяем hreflang-аннотации и атрибуты lang с реальными языками страниц и находим противоречия между заявленной и фактической локализацией.",
    icon: Link2,
  },
  {
    title: "Структурированные данные",
    description:
      "Извлекаем JSON-LD, Microdata и RDFa, проверяем их валидность и соответствие типа страницы — без загрузки чужих отчётов.",
    icon: BarChart3,
  },
  {
    title: "OG и Twitter превью",
    description:
      "Загружаем Open Graph и Twitter Card изображения, фиксируем размеры, MIME-тип и доступность, чтобы превью в соцсетях не были битыми.",
    icon: Camera,
  },
  {
    title: "Lighthouse и адаптивность интерфейса",
    description:
      "Запускаем Lighthouse для mobile и desktop, а также отдельные проверки responsive rendering на desktop / laptop / tablet / mobile: Core Web Vitals, viewport, overflow, touch-targets и адаптивность в реальных условиях.",
    icon: Activity,
  },
  {
    title: "Здоровье ссылок",
    description:
      "Проверяем внутренние ссылки пачками: коды ответов, редиректы, тайтлы и контентные изменения, чтобы в отчёте были только живые URL.",
    icon: Link2,
  },
  {
    title: "Аналитика и сторонние теги",
    description:
      "Находим GA4, GTM, Meta Pixel, Яндекс.Метрику и другие счётчики прямо в DOM, с фиксацией загрузки и видимости в headless-режиме.",
    icon: Activity,
  },
  {
    title: "Сущности, DNS, безопасность",
    description:
      "Смотрим на DNS, TLS, whois-сигналы и упоминания бренда, чтобы отличить технические SEO-проблемы от доверительных сигналов домена.",
    icon: Building2,
  },
  {
    title: "Скриншоты и визуальные доказательства",
    description:
      "Сохраняем визуальные срезы страниц как доказательства, не отправляя их в контекст модели — картинки остаются в галерее отчёта.",
    icon: Camera,
  },
  {
    title: "Только URL",
    description:
      "Не требуется доступ к Search Console, не нужны выгрузки и файлы. Достаточно ввести домен и получить полный диагностический отчёт.",
    icon: Globe2,
  },
];

const EVIDENCE_BULLETS = [
  "Headless Chromium загружает страницу так же, как её увидит пользователь и поисковый робот.",
  "Скриншоты и визуальные материалы собираются параллельно и не попадают в контекст модели.",
  "Логи показывают, какие инструменты были вызваны, с какими аргументами и каков результат.",
  "Сохранённые аудиты остаются локально в браузере — без сервера, без аккаунтов, без выгрузок.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <AppBar />

      <div className="paper-grid">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          {/* Hero */}
          <section className="max-w-3xl">
            <span className="eyebrow text-accent">evidence-based · agentic</span>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.75rem]">
              Диагностический SEO-аудит по&nbsp;одному&nbsp;URL
              <span className="block text-muted">— без Search Console, без выгрузок, без&nbsp;регистрации.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              OpenCode-модель гоняет headless Chromium по сайту, снимает реальные сетевые следы,
              рендерит страницы, читает sitemap, robots и структурированные данные — и собирает
              структурированный диагностический отчёт. Без загрузки чужих выгрузок, без доступа к
              вашему Search Console, без отправки файлов.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/audit"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink-soft"
              >
                Провести аудит
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <span className="text-sm text-muted">
                Достаточно открытого URL — модель сама обойдёт сайт и принесёт доказательства.
              </span>
            </div>
          </section>

          {/* Capability grid */}
          <section className="mt-14">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Что именно проверяет инструмент
              </h2>
              <span className="eyebrow text-faint">12 направлений</span>
            </div>

            <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <li
                    key={cap.title}
                    className="flex flex-col gap-2 bg-surface px-5 py-5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="text-[14px] font-semibold text-ink">
                        {cap.title}
                      </h3>
                    </div>
                    <p className="text-[13px] leading-relaxed text-muted">
                      {cap.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Evidence section */}
          <section className="mt-14 grid gap-6 rounded-xl border border-line bg-surface p-6 sm:grid-cols-[1fr_1.1fr] sm:p-8">
            <div>
              <span className="eyebrow text-muted">Доказательная база</span>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                Каждый вывод подтверждён, а не придуман
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Отчёт строится только на том, что инструменты действительно увидели и измерили.
                Визуальные доказательства, коды ответов и фрагменты DOM остаются в галерее, а в
                текст отчёта попадают только интерпретации.
              </p>
              <div className="mt-5">
                <Link
                  href="/audit"
                  className="group inline-flex items-center gap-2 rounded-lg border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-paper"
                >
                  Провести аудит
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
            <ul className="space-y-3">
              {EVIDENCE_BULLETS.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 rounded-lg border border-line bg-paper/60 px-4 py-3 text-[13px] leading-relaxed text-ink-soft"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Footer */}
          <footer className="mt-14 flex flex-col gap-1 border-t border-line pt-6 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
            <span>
              Powered by OpenCode · Playwright ·{" "}
              <span className="font-mono text-[12px]">site-seo-audit skill</span>
            </span>
            <span className="font-mono text-[12px] uppercase tracking-wider">
              v1
            </span>
          </footer>
        </div>
      </div>
    </main>
  );
}
