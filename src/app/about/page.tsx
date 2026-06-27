import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/ui";
import { SITE_URL, withHreflang } from "@/lib/site";
import {
  pageBreadcrumb,
  webPageSchema,
} from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";
const SITE_DESCRIPTION =
  "Seofriendly — бесплатный SEO-аудит сайта нейросетью. Браузерная проверка sitemap.xml, robots.txt, canonical, мета-тегов, скорости и адаптивности с отчётом от нейросети.";

const PAGE_TITLE = "О сервисе Seofriendly — что проверяет SEO-аудит";
const PAGE_DESCRIPTION = `Что такое ${SITE_NAME} и как работает бесплатный SEO-аудит сайта нейросетью: прозрачный процесс, локальное хранение данных, открытые артефакты проверки.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/about`,
    languages: withHreflang("/about"),
  },
  openGraph: {
    title: `О сервисе — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
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
    description: PAGE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

function buildAboutStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        path: "/about",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        pageType: "AboutPage",
      }),
      pageBreadcrumb("О сервисе", "/about"),
    ],
  };
}

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
    text: "История аудитов и скриншоты остаются в браузере пользователя. Сервис не требует аккаунта и не показывает технические параметры обработки в интерфейсе.",
  },
];

export default function AboutPage() {
  const structuredData = buildAboutStructuredData();
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs items={[{ label: "О сервисе" }]} className="mb-3" />
          <PageHeader
            title={`Что такое ${SITE_NAME}`}
            description="Бесплатный технический SEO-аудит по одному URL: браузерная проверка, технические факты и понятный отчёт от нейросети."
          />

          <section className="prose prose-neutral max-w-3xl text-[15px] leading-relaxed text-ink-soft">
            <p>
              {SITE_NAME} (домен: {SITE_URL}) — русскоязычный онлайн-инструмент
              для бесплатного технического SEO-аудита сайта. Пользователь
              вводит URL — headless-браузер обходит страницы, собирает
              технические факты, а нейросеть превращает их в структурированный
              отчёт с приоритетами и доказательствами.
            </p>
            <p>
              Сервис не требует регистрации, доступа к{" "}
              <a className="text-ink underline" href="/knowledge#gsc">
                Search Console
              </a>{" "}
              или
              выгрузок. Достаточно открытого URL.
            </p>
          </section>

          <h2 className="mt-12 max-w-3xl text-xl font-semibold tracking-tight text-ink">
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

          <div className="max-w-3xl">
            <h2 className="mt-12 text-xl font-semibold tracking-tight text-ink">
              Что проверяется
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              12 направлений диагностики и более 60 конкретных проверок: HTTP-коды
              и редиректы,{" "}
              <a className="text-ink underline" href="/knowledge#sitemap-xml">
                sitemap.xml
              </a>{" "}
              и{" "}
              <a className="text-ink underline" href="/knowledge#robots-txt">
                robots.txt
              </a>{", "}
              <a className="text-ink underline" href="/knowledge#canonical">
                canonical
              </a>{", "}
              мета-теги, иерархия заголовков,{" "}
              <a className="text-ink underline" href="/knowledge#structured-data-term">
                структурированные данные
              </a>{", "}
              скорость и{" "}
              <a className="text-ink underline" href="/knowledge#core-web-vitals">
                Core Web Vitals
              </a>{", "}
              адаптивность, HTTPS и заголовки безопасности, изображения и{" "}
              <a className="text-ink underline" href="/knowledge#open-graph">
                Open Graph
              </a>{", "}
              аналитика,{" "}
              <a className="text-ink underline" href="/knowledge#hreflang">
                hreflang
              </a>.
              {" "}Полный список — на главной и в
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
      </div>
    </main>
  );
}
