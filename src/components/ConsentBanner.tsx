"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { useConsentStore } from "@/store/consentStore";
import { Button } from "@/components/ui";

const YANDEX_METRIKA_ID = (
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? ""
).trim();
const ENABLE_WEBVISOR = process.env.NEXT_PUBLIC_ENABLE_WEBVISOR === "true";
const ENABLE_CLICKMAP = process.env.NEXT_PUBLIC_ENABLE_CLICKMAP === "true";
const YANDEX_METRIKA_ENABLED = /^\d+$/.test(YANDEX_METRIKA_ID);

// SSR-safe подписка на состояние гидрации zustand-persist. До гидрации
// возвращаем false — баннер не показывается, Metrika не грузится. После
// гидрации возвращаем фактическое значение, и UI догоняет без flash.
function useHasHydrated() {
  return useSyncExternalStore(
    (cb) => useConsentStore.persist.onFinishHydration(cb),
    () => useConsentStore.persist.hasHydrated(),
    () => false
  );
}

/**
 * Показывает баннер согласия на аналитику (152-ФЗ / GDPR). Согласие
 * сохраняется в localStorage через zustand persist. Пока пользователь
 * не принял — Yandex.Metrika не загружается ни в каком виде.
 *
 * После `accepted` Metrika грузится через `lazyOnload` (не блокирует
 * FCP/LCP). Кнопка «Отклонить» фиксирует отказ — баннер больше не
 * показывается, Metrika не грузится.
 */
export function ConsentBanner() {
  const analytics = useConsentStore((s) => s.analytics);
  const setAnalytics = useConsentStore((s) => s.setAnalytics);
  const hydrated = useHasHydrated();

  const shouldShow =
    YANDEX_METRIKA_ENABLED && hydrated && analytics === null;
  const shouldLoadMetrika =
    YANDEX_METRIKA_ENABLED && analytics === "accepted";

  return (
    <>
      {shouldLoadMetrika ? (
        <Script id="yandex-metrika" strategy="lazyOnload">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');

            ym(${YANDEX_METRIKA_ID}, 'init', {ssr:true, webvisor:${ENABLE_WEBVISOR}, clickmap:${ENABLE_CLICKMAP}, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
      ) : null}

      {shouldShow ? (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Согласие на сбор аналитики"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-line bg-surface/95 p-4 shadow-[0_18px_70px_rgba(27,27,25,0.18)] backdrop-blur sm:bottom-4 sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">
                Аналитика и cookie
              </p>
              <p className="mt-1">
                Мы используем Яндекс.Метрику для сбора обезличенной
                статистики посещений. Cookie и данные о визитах
                обрабатываются только при вашем согласии. Подробнее — в{" "}
                <a
                  href="/privacy"
                  className="text-ink underline underline-offset-2"
                >
                  Политике конфиденциальности
                </a>
                .
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                onClick={() => setAnalytics("declined")}
              >
                Отклонить
              </Button>
              <Button onClick={() => setAnalytics("accepted")}>
                Принять
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
