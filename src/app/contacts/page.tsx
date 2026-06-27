import type { Metadata } from "next";
import { Mail, MessageSquare, Globe, Send } from "lucide-react";
import { Breadcrumbs, PageHeader } from "@/components/ui";
import {
  SITE_URL,
  BRAND_EMAIL,
  BRAND_TELEGRAM_URL,
  withHreflang,
} from "@/lib/site";
import {
  pageBreadcrumb,
  webPageSchema,
} from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";

const PAGE_TITLE = "Контакты Seofriendly — как связаться";
const PAGE_DESCRIPTION = `Как связаться с командой ${SITE_NAME}: электронная почта, обратная связь по работе сервиса, сообщения об ошибках.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/contacts`,
    languages: withHreflang("/contacts"),
  },
  openGraph: {
    title: `Контакты — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/contacts`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `Контакты — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Контакты — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

function buildContactsStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        path: "/contacts",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        pageType: "ContactPage",
      }),
      pageBreadcrumb("Контакты", "/contacts"),
    ],
  };
}

const CHANNELS = [
  {
    icon: Mail,
    title: "Электронная почта",
    value: BRAND_EMAIL,
    href: `mailto:${BRAND_EMAIL}`,
    text: "По вопросам работы сервиса, сообщениям об ошибках и предложениям по улучшению.",
  },
  {
    icon: Globe,
    title: "Домен сервиса",
    value: SITE_URL,
    href: SITE_URL,
    text: "Главная страница, точка входа в аудит и справочные материалы.",
  },
  {
    icon: Send,
    title: "Telegram для сотрудничества",
    value: "@BBYagah",
    href: BRAND_TELEGRAM_URL,
    text: "Быстрый канал для партнёрств, интеграций и коммерческих предложений.",
  },
];

const FAQ = [
  {
    q: "Где можно задать вопрос по работе аудита?",
    a: `Напишите на ${BRAND_EMAIL}. В теме укажите URL сайта, по которому запускали аудит, и краткое описание ситуации — так ответ будет быстрее.`,
  },
  {
    q: "Принимаете ли вы сообщения об ошибках и идеи?",
    a: "Да. Любые наблюдения по работе сервиса, найденные неточности и предложения по новым проверкам принимаются на эту же почту.",
  },
  {
    q: "Есть ли у сервиса аккаунт в соцсетях?",
    a: `Да. Для сотрудничества доступен Telegram @BBYagah, для остальных обращений — почта ${BRAND_EMAIL}.`,
  },
  {
    q: "Как быстро вы отвечаете?",
    a: "Обычно в течение нескольких рабочих дней. Если вопрос требует воспроизведения конкретного аудита — может понадобиться дополнительное время, мы сообщим о ходе работы.",
  },
  {
    q: "Подходит ли эта почта для коммерческих предложений?",
    a: "Да, мы открыты к партнёрствам и интеграциям. Опишите кратко задачу и контактные данные — вернёмся с ответом.",
  },
];

export default function ContactsPage() {
  const structuredData = buildContactsStructuredData();
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs items={[{ label: "Контакты" }]} className="mb-3" />
          <PageHeader
            title="Связаться с командой"
            description="Каналы обратной связи для вопросов, сообщений об ошибках и предложений по улучшению сервиса."
          />

          <section className="prose prose-neutral max-w-3xl text-[15px] leading-relaxed text-ink-soft">
            <p>
              {SITE_NAME} — небольшой авторский проект, и обратная связь от
              пользователей для нас главный источник идей по развитию
              сервиса. Если вы нашли неточность в отчёте, заметили ошибку в
              работе аудита или хотите предложить новую проверку — напишите,
              мы читаем каждое письмо и отвечаем на значимые обращения.
            </p>
          </section>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <li
                  key={channel.title}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="mt-3 text-[14px] font-semibold text-ink">
                    {channel.title}
                  </h2>
                  <a
                    href={channel.href}
                    className="mt-1 inline-flex min-h-[48px] items-center text-[14px] font-medium text-ink underline-offset-2 hover:underline"
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {channel.value}
                  </a>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    {channel.text}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="max-w-3xl">
            <section className="mt-12" aria-labelledby="contacts-faq-heading">
              <h2
                id="contacts-faq-heading"
                className="text-xl font-semibold tracking-tight text-ink"
              >
                Частые вопросы
              </h2>
              <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-line bg-line">
                {FAQ.map((item) => (
                  <details
                    key={item.q}
                    className="group bg-surface px-5 py-4 [&[open]]:bg-paper/40"
                  >
                    <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-ink">
                      <span>{item.q}</span>
                      <span
                        aria-hidden="true"
                        className="font-mono text-base text-muted transition group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <p className="mt-10 inline-flex items-center gap-2 text-[13px] leading-relaxed text-faint">
              <MessageSquare className="h-3.5 w-3.5" />
              Среднее время ответа — несколько рабочих дней.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
