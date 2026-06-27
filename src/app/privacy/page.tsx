import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/ui";
import { SITE_URL, BRAND_EMAIL, withHreflang } from "@/lib/site";
import {
  pageBreadcrumb,
  webPageSchema,
} from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";
const POLICY_EFFECTIVE = "27 июня 2026";
// Используется в JSON-LD PrivacyPolicy.dateModified — обязателен валидный
// ISO 8601. Парсить "27 июня 2026" через new Date() нельзя (Invalid Date
// на русской локали), поэтому храним ISO явно рядом с человекочитаемой
// датой.
const POLICY_EFFECTIVE_ISO = "2026-06-27T00:00:00.000Z";

const PAGE_TITLE = "Политика конфиденциальности";
const PAGE_DESCRIPTION = `Как ${SITE_NAME} обрабатывает данные пользователей: что хранится локально, что отправляется на сервер, какие cookie и аналитика используются.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/privacy`,
    languages: withHreflang("/privacy"),
  },
  openGraph: {
    title: `${PAGE_TITLE} — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/privacy`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${PAGE_TITLE} — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

function buildPrivacyStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        path: "/privacy",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        pageType: "PrivacyPolicy",
        dateModified: POLICY_EFFECTIVE_ISO,
      }),
      pageBreadcrumb("Политика конфиденциальности", "/privacy"),
    ],
  };
}

export default function PrivacyPage() {
  const structuredData = buildPrivacyStructuredData();
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs
            items={[{ label: "Политика конфиденциальности" }]}
            className="mb-3"
          />
          <PageHeader
            title="Политика конфиденциальности"
            description={`Как ${SITE_NAME} обрабатывает данные пользователей и какие возможности управления этими данными есть у вас.`}
          />

          <p className="max-w-3xl text-[13px] text-faint">
            Дата вступления в силу: {POLICY_EFFECTIVE}
          </p>

          <section className="mt-8 max-w-3xl space-y-6 text-[14px] leading-relaxed text-ink-soft">
            <div>
              <h2 className="text-base font-semibold text-ink">
                1. Какие данные мы обрабатываем
              </h2>
              <p className="mt-2">
                {SITE_NAME} — клиентский инструмент технического SEO-аудита.
                Сервис работает по открытому URL, который вводит пользователь.
                Для генерации текста отчёта используется внешний API
                (провайдера и модель выбирает пользователь в настройках);
                запрос к API отправляется только когда пользователь явно
                запускает аудит.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">
                2. Что хранится локально в вашем браузере
              </h2>
              <p className="mt-2">
                Следующие данные хранятся исключительно в браузере пользователя
                (localStorage и IndexedDB) и не передаются на сервер{" "}
                {SITE_NAME}:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>API-ключ провайдера модели и идентификатор модели;</li>
                <li>язык отчёта и параметры подробности логов;</li>
                <li>история аудитов: URL, отчёт, логи, скриншоты;</li>
                <li>последний введённый URL для удобства повторного запуска.</li>
              </ul>
              <p className="mt-2">
                Очистить эти данные можно из настроек браузера либо из
                интерфейса {SITE_NAME} (на будущих итерациях — кнопка полной
                очистки истории).
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">
                3. Что отправляется на сервер {SITE_NAME}
              </h2>
              <p className="mt-2">
                На сервер {SITE_NAME} не отправляются API-ключ, история
                аудитов и скриншоты. Запрос к API {SITE_URL}/api/audit
                содержит только технические параметры запуска: URL сайта,
                идентификатор модели, язык и флаг отладочного режима. Сам
                API-ключ остаётся в браузере и подставляется в заголовок
                запроса к провайдеру модели на стороне сервера только для
                проксирования вызова.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">
                4. Cookie и аналитика
              </h2>
              <p className="mt-2">
                Сервис не использует cookie и не устанавливает идентификаторы
                сессий. На страницах может быть загружен счётчик Яндекс.Метрики
                (если в окружении указан идентификатор). Этот счётчик
                обрабатывает обезличенные события просмотра страниц и кликов и
                использует cookie только на стороне Яндекса. Отключить загрузку
                счётчика можно через блокировщик скриптов в браузере.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">
                5. Сторонние сервисы
              </h2>
              <p className="mt-2">
                Аудит использует headless Chromium для обхода проверяемого
                сайта и обращается к внешнему API выбранной пользователем
                модели. Провайдеры моделей получают промпт, который состоит из
                технических фактов проверки и инструкции по составлению
                отчёта; в промпт не включаются идентификаторы пользователя.
                Политику обработки данных провайдера модели смотрите в
                документации выбранного сервиса.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">
                6. Безопасность
              </h2>
              <p className="mt-2">
                Соединение с сайтом защищено HTTPS и заголовком HSTS сроком на
                один год. Передача между браузером и {SITE_NAME} также идёт по
                HTTPS. Локально сохранённый API-ключ доступен только из кода
                {SITE_NAME} в вашем браузере; серверная часть его не
                сохраняет.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">
                7. Изменения политики
              </h2>
              <p className="mt-2">
                При существенных изменениях условий обработки данных дата
                вступления в силу и текст выше будут обновлены. Текущая версия
                документа всегда доступна по адресу{" "}
                <a className="text-ink underline" href="/privacy">
                  {SITE_URL}/privacy
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-ink">8. Контакты</h2>
              <p className="mt-2">
                По вопросам обработки данных и реализации прав пишите на{" "}
                <a
                  className="text-ink underline"
                  href={`mailto:${BRAND_EMAIL}`}
                >
                  {BRAND_EMAIL}
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
