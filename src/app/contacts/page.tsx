import type { Metadata } from "next";
import { Mail, MessageSquare, Globe } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { SITE_URL, BRAND_EMAIL } from "@/lib/site";

const SITE_NAME = "Seofriendly";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Как связаться с командой ${SITE_NAME}: электронная почта, обратная связь, новости сервиса.`,
  alternates: {
    canonical: `${SITE_URL}/contacts`,
    languages: {
      "ru-RU": `${SITE_URL}/contacts`,
    },
  },
  openGraph: {
    title: `Контакты — ${SITE_NAME}`,
    description: `Как связаться с командой ${SITE_NAME}.`,
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
    description: `Как связаться с командой ${SITE_NAME}.`,
    images: ["/twitter-image"],
  },
};

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
    a: "Каналы появятся позже. Пока основной и единственный канал связи — электронная почта.",
  },
];

export default function ContactsPage() {
  return (
    <main className="min-h-screen">
      <div className="paper-grid">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <PageHeader
            eyebrow="контакты"
            title="Связаться с командой"
            description="Каналы обратной связи для вопросов, сообщений об ошибках и предложений по улучшению сервиса."
          />

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
                    className="mt-1 inline-block text-[14px] font-medium text-ink underline-offset-2 hover:underline"
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
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold text-ink">
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
    </main>
  );
}
