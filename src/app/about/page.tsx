import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

const SITE_NAME = "Seofriendly";
const SITE_DESCRIPTION =
  "Seofriendly — бесплатный SEO-аудит сайта нейросетью. Браузерная проверка sitemap.xml, robots.txt, canonical, мета-тегов, скорости и адаптивности с отчётом от нейросети.";

export const metadata: Metadata = {
  title: "О сервисе",
  description: `Что такое ${SITE_NAME} и как работает бесплатный SEO-аудит сайта нейросетью: прозрачный процесс, локальное хранение данных, открытые артефакты проверки.`,
  alternates: {
    canonical: `${SITE_URL}/about`,
    languages: {
      "ru-RU": `${SITE_URL}/about`,
    },
  },
  openGraph: {
    title: `О сервисе — ${SITE_NAME}`,
    description: `Что такое ${SITE_NAME} и как работает бесплатный SEO-аудит сайта нейросетью.`,
    url: `${SITE_URL}/about`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `О сервисе — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `О сервисе — ${SITE_NAME}`,
    description: `Что такое ${SITE_NAME} и как работает бесплатный SEO-аудит сайта нейросетью.`,
    images: ["/twitter-image"],
  },
};

const PRINCIPLES = [
  {
    title: "Только публичные данные",
    text: "Аудит работает по открытому URL. Не нужен доступ к Search Console, выгрузкам ключевых слов или файлам сайта — то, что видит поисковый робот, видит и Seofriendly.",
  },
  {
    title: "Браузер, а не парсер",
    text: "Headless Chromium рендерит страницу с JavaScript так же, как её видит пользователь и Googlebot. Это снимает класс ошибок, на которых ловятся обычные SEO-сканеры.",
  },
  {
    title: "Факты, а не оценки",
    text: "Нейросеть получает конкретные измерения: коды ответов, цепочки редиректов, фрагменты DOM, скриншоты. В отчёт попадает интерпретация фактов, а не предположения.",
  },
  {
    title: "Локальное хранение",
    text: "API-ключ, история аудитов и скриншоты остаются в браузере пользователя. Сервис не сохраняет результаты на своей стороне и не требует аккаунта.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <div className="paper-grid">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <PageHeader
            eyebrow="о сервисе"
            title={`Что такое ${SITE_NAME}`}
            description="Бесплатный технический SEO-аудит по одному URL: браузерная проверка, технические факты и понятный отчёт от нейросети."
          />

          <section className="prose prose-neutral max-w-none text-[15px] leading-relaxed text-ink-soft">
            <p>
              {SITE_NAME} (домен: {SITE_URL}) — русскоязычный онлайн-инструмент
              для бесплатного технического SEO-аудита сайта. Пользователь
              вводит URL — headless-браузер обходит страницы, собирает
              технические факты, а нейросеть превращает их в структурированный
              отчёт с приоритетами и доказательствами.
            </p>
            <p>
              Сервис не требует регистрации, доступа к Search Console или
              выгрузок. Достаточно открытого URL.
            </p>
          </section>

          <h2 className="mt-12 text-xl font-semibold tracking-tight text-ink">
            Принципы
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <h3 className="text-[14px] font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 text-xl font-semibold tracking-tight text-ink">
            Что проверяется
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            12 направлений диагностики и более 60 конкретных проверок: HTTP-коды
            и редиректы, sitemap.xml и robots.txt, canonical, мета-теги,
            иерархия заголовков, структурированные данные, скорость и Core Web
            Vitals, адаптивность, HTTPS и заголовки безопасности, изображения и
            Open Graph, аналитика, hreflang. Полный список — на главной и в
            файле <a className="text-ink underline" href="/llms.txt">llms.txt</a>.
          </p>

          <p className="mt-10 text-[13px] leading-relaxed text-faint">
            Полное описание сервиса для машинной обработки — в файле{" "}
            <a className="text-ink underline" href="/llms.txt">llms.txt</a>.
            Канонические ссылки сервиса — в{" "}
            <a className="text-ink underline" href="/sitemap.xml">sitemap.xml</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
