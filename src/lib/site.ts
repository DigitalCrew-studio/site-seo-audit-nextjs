// Брендовые константы, читаемые из env. Доступны и в server, и в client
// components благодаря префиксу NEXT_PUBLIC_. Никаких секретов тут нет —
// значения попадают в rendered HTML (canonical, JSON-LD, footer, OG).
// Дефолты держат локальный dev работоспособным без заполненного .env.

const DEFAULT_SITE_URL = "https://seofrendly.ru";
const DEFAULT_BRAND_EMAIL = "mail.seofriendly@proton.me";
const DEFAULT_BRAND_TELEGRAM_USERNAME = "BBYagah";

function readSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (!raw) return DEFAULT_SITE_URL;
  // Лёгкая защита от мусора в env: требуем абсолютный http(s) URL. Падать
  // не хочется — пусть лучше рендерится дефолт, чем валится вся страница.
  if (!/^https?:\/\//i.test(raw)) return DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

function readBrandEmail(): string {
  const raw = (process.env.NEXT_PUBLIC_BRAND_EMAIL ?? "").trim();
  if (!raw || !raw.includes("@")) return DEFAULT_BRAND_EMAIL;
  return raw;
}

export const SITE_URL = readSiteUrl();
export const BRAND_EMAIL = readBrandEmail();
export const BRAND_TELEGRAM_USERNAME = DEFAULT_BRAND_TELEGRAM_USERNAME;
export const BRAND_TELEGRAM_URL = `https://t.me/${BRAND_TELEGRAM_USERNAME}`;
export const BRAND_SOCIAL_URLS = [BRAND_TELEGRAM_URL] as const;

// Единая фабрика hreflang-languages. Возвращает объект, пригодный для
// Next.js Metadata.alternates.languages: ru-RU с самоссылающимся URL плюс
// x-default, который ведёт на ту же страницу. Поисковики рекомендуют
// x-default даже на одноязычных сайтах — это снимает неоднозначность,
// когда язык пользователя не определён.
// Использование: alternates: { canonical: ..., languages: withHreflang("/about") }
export function withHreflang(path: string): {
  "ru-RU": string;
  "x-default": string;
} {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}${normalized}`;
  return {
    "ru-RU": url,
    "x-default": url,
  };
}
