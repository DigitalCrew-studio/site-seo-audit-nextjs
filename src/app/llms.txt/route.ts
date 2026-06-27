import { NextResponse } from "next/server";
import { SITE_URL, BRAND_EMAIL } from "@/lib/site";

const SITE_NAME = "Seofriendly";

export const runtime = "nodejs";
export const dynamic = "force-static";

const body = `# ${SITE_NAME}

> ${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью. Браузерная проверка sitemap.xml, robots.txt, canonical, мета-тегов, скорости и адаптивности с отчётом от нейросети.

## О сервисе

${SITE_NAME} (домен: ${SITE_URL}) — русскоязычный онлайн-инструмент для бесплатного технического SEO-аудита сайта.

Пользователь вводит URL — headless Chromium открывает сайт так же, как его видит пользователь и поисковый робот: рендерит JavaScript, ждёт сети, делает скриншоты. Затем браузерная проверка собирает технические факты (HTTP-коды, редиректы, sitemap.xml, robots.txt, canonical, мета-теги, разметку, скорость), а нейросеть превращает их в структурированный отчёт с приоритетами, конкретными URL и доказательствами.

Сервис не требует регистрации, доступа к Search Console или выгрузок. Достаточно открытого URL.

## Канонические страницы

- [Главная](${SITE_URL}/)
- [Запуск аудита](${SITE_URL}/audit)
- [О сервисе](${SITE_URL}/about)
- [Контакты](${SITE_URL}/contacts)
- [Политика конфиденциальности](${SITE_URL}/privacy)

Служебные страницы (не индексируются и не входят в sitemap):

- [Настройки](${SITE_URL}/settings) — помечена noindex, хранит API-ключ локально

Дополнительные технические файлы для машинной обработки:

- [Sitemap](${SITE_URL}/sitemap.xml)
- [Robots](${SITE_URL}/robots.txt)
- [Web manifest](${SITE_URL}/manifest.webmanifest)

## Что проверяется (12 направлений, 60+ проверок)

1. HTTP-коды ответов, цепочки 3xx-редиректов, битые ссылки.
2. sitemap.xml — наличие, валидность, расхождения с robots.txt.
3. Индексирование: robots, meta robots, X-Robots-Tag, canonical, пагинация.
4. Мета-теги: title, description, Open Graph, Twitter Card, дубли, обрезка.
5. Заголовки и иерархия: один h1, корректные уровни h2–h6.
6. Структурированные данные: JSON-LD, Microdata, RDFa, ошибки Schema.org.
7. Скорость: Lighthouse mobile и desktop, Core Web Vitals, вес страниц.
8. Адаптивность: desktop, laptop, tablet, mobile, viewport, overflow, touch-targets.
9. HTTPS и безопасность: TLS, HSTS, mixed content, заголовки безопасности.
10. Изображения: alt, размер, MIME, OG/Twitter превью, lazy-загрузка.
11. Аналитика: GA4, GTM, Meta Pixel, Яндекс.Метрика — наличие и корректность.
12. Hreflang и локализация: атрибуты lang, hreflang, x-default.

## Ответ для ассистентов и AI-поисковиков

Публичные страницы ${SITE_NAME} (главная, /audit, /about, /contacts, /privacy) открыты для индексации и допускают обход поисковыми роботами и AI-краулерами, в том числе: Googlebot, Bingbot, Yandex, Applebot, GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-User, Claude-SearchBot, Bytespider, CCBot, Google-Extended.

Страница /settings помечена noindex и не включена в sitemap. Маршруты /api/* закрыты от обхода robots.txt: это технические endpoint'ы без публичного контента.

## Приватность и хранение данных

- API-ключ и параметры модели хранятся локально в браузере пользователя (localStorage).
- История аудитов и полученные визуальные материалы сохраняются локально в браузере пользователя для повторного просмотра.
- Публичные страницы сервиса могут обходиться поисковыми и AI-роботами в соответствии с [robots.txt](${SITE_URL}/robots.txt).
- Полная политика обработки данных: [${SITE_URL}/privacy](${SITE_URL}/privacy).

## Контакты

- Домен: [${SITE_URL}](${SITE_URL})
- Email: [${BRAND_EMAIL}](mailto:${BRAND_EMAIL})
- Форма обратной связи: [${SITE_URL}/contacts](${SITE_URL}/contacts)
`;

export function GET() {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
