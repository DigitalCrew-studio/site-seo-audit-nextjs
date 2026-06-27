"use client";

import { useEffect, useState } from "react";
import { ChevronDown, KeyRound, ShieldCheck, ExternalLink } from "lucide-react";
import { Badge, Panel, PanelBody, PanelHeader } from "@/components/ui";

const OPENCODE_URL = "https://opencode.ai";

const API_STEPS = [
  {
    title: "Откройте opencode.ai",
    text: "Перейдите на сайт провайдера и зарегистрируйтесь — это занимает пару минут.",
    href: OPENCODE_URL,
  },
  {
    title: "Создайте API-ключ",
    text: "В личном кабинете откройте раздел Keys или API, нажмите «Create key», задайте имя и скопируйте сгенерированную строку.",
  },
  {
    title: "Выберите провайдера и модель",
    text: "Вернитесь сюда, выберите opencode go или opencode zen, вставьте ключ и нажмите «Загрузить модели». После загрузки выберите модель из списка.",
  },
  {
    title: "Запустите аудит",
    text: "Перейдите в раздел «Аудит», введите URL сайта и нажмите «Запустить аудит». Отчёт сгенерирует выбранная модель.",
  },
];

export function ApiKeyGuide() {
  // Lazy initializer: при первом рендере на клиенте сразу открываемся,
  // если пользователь пришёл по якорю. На SSR window недоступен —
  // возвращаем false, hydration mismatch не возникает (hash на сервере
  // пустой, состояние свернётся после mount и тут же раскроется по
  // hashchange-листенеру ниже).
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#api-key-guide";
  });

  // Реакция на смену hash в уже открытой странице (например, юзер
  // кликнул якорную ссылку в SettingsForm, не уезжая со /settings).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHashChange = () => {
      if (window.location.hash === "#api-key-guide") {
        setOpen(true);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <Panel id="api-key-guide">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="api-key-guide-body"
        className="group block w-full cursor-pointer text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              Что такое API-ключ и как его получить
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              API-ключ — это персональный токен, который разрешает выбранной
              модели генерировать текст отчёта от вашего имени. Без ключа
              запустить аудит нельзя.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone="neutral">3 минуты</Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      {open ? (
        <PanelBody id="api-key-guide-body" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-paper/60 p-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-[14px] font-semibold text-ink">
                Что это такое
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                API-ключ — это уникальная строка вида{" "}
                <code className="rounded bg-line px-1 py-0.5 font-mono text-[12px] text-ink-soft">
                  sk-...
                </code>
                , которая выдаётся провайдером модели. Ключ
                идентифицирует вас как платящего (или бесплатного)
                пользователя и списывает стоимость генерации.
                Seofriendly не имеет к нему доступа и не взимает свою
                комиссию.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-paper/60 p-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-positive/10 text-positive">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-[14px] font-semibold text-ink">
                Безопасность
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Ключ сохраняется только в{" "}
                <code className="rounded bg-line px-1 py-0.5 font-mono text-[12px] text-ink-soft">
                  localStorage
                </code>{" "}
                вашего браузера. Сервер Seofriendly использует его
                только для проксирования запроса к API и не сохраняет в
                БД. Удалить ключ можно кнопкой «Очистить» в форме ниже
                или сбросив данные сайта в браузере.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              Пошаговая инструкция
            </h3>
            <ol className="mt-3 space-y-3 text-[13px] leading-relaxed text-ink-soft">
              {API_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex min-h-[48px] items-start gap-3"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-[12px] font-semibold text-ink">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {step.href ? (
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                        >
                          {step.title}
                          <ExternalLink
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        step.title
                      )}
                    </p>
                    <p className="mt-0.5 text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-line bg-[radial-gradient(circle_at_8%_0%,rgba(180,83,9,0.12),transparent_28%),var(--color-surface)] p-4">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">
                Совет по бюджету.
              </span>{" "}
              В группе{" "}
              <code className="rounded bg-line px-1 py-0.5 font-mono text-[12px] text-ink-soft">
                zen
              </code>{" "}
              есть <span className="font-medium text-positive">бесплатные</span> модели
              (например,{" "}
              <code className="rounded bg-line px-1 py-0.5 font-mono text-[12px] text-ink-soft">
                kimi-k2.5-free
              </code>
              ) — с них можно начать без оплаты. Группа{" "}
              <code className="rounded bg-line px-1 py-0.5 font-mono text-[12px] text-ink-soft">
                go
              </code>{" "}
              — бюджетные платные модели для большинства проверок.
              Премиальные zen-модели дают лучшее качество рассуждений,
              но расходуют больше токенов.
            </p>
          </div>
        </PanelBody>
      ) : null}
    </Panel>
  );
}
