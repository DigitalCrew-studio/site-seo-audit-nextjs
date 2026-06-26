"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Settings, AlertTriangle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";

export function AuditForm() {
  const {
    apiKey,
    modelId,
    url,
    setUrl,
    running,
    runAudit,
    error,
    hydrate,
    fetchModels,
  } = useAuditStore(
    useShallow((s) => ({
      apiKey: s.apiKey,
      modelId: s.modelId,
      url: s.url,
      setUrl: s.setUrl,
      running: s.running,
      runAudit: s.runAudit,
      error: s.error,
      hydrate: s.hydrate,
      fetchModels: s.fetchModels,
    }))
  );

  // Restore saved settings from localStorage and reload models if an API key exists.
  useEffect(() => {
    hydrate();
    const { apiKey: storedKey } = useAuditStore.getState();
    if (storedKey.trim()) {
      void fetchModels();
    }
  }, [hydrate, fetchModels]);

  const missingApiKey = !apiKey.trim();
  const missingModel = !modelId;
  const missingUrl = !url.trim();
  const settingsIncomplete = missingApiKey || missingModel;
  const disableRun = running || settingsIncomplete || missingUrl;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="eyebrow text-muted">запуск аудита</span>
        <span className="eyebrow text-faint">шаг 01</span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {settingsIncomplete && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-ink"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="flex-1">
              <p className="font-medium text-ink">
                {missingApiKey
                  ? "Не указан API-ключ"
                  : "Не выбрана модель"}
              </p>
              <p className="mt-1 text-muted">
                Перед запуском аудита откройте{" "}
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1 font-medium text-ink underline-offset-2 hover:underline"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Настройки
                </Link>{" "}
                и заполните ключ доступа и модель.
              </p>
            </div>
          </div>
        )}

        {running && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-ink"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="font-medium text-ink">Не обновляйте вкладку</p>
              <p className="mt-1 text-muted">
                Сейчас идёт аудит. Если обновить или закрыть страницу, текущая
                проверка будет прекращена и её нельзя будет продолжить с того же
                места.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="eyebrow text-muted" htmlFor="audit-url">
              URL сайта
            </label>
            <span className="eyebrow text-faint">например: example.com</span>
          </div>
          <input
            id="audit-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            className="field font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {error && !running && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* Run action */}
      <div className="flex flex-col gap-3 border-t border-line bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted">
          {running
            ? "Браузер обходит сайт и снимает технические показатели…"
            : "Аудит запускается в headless Chromium и формирует отчёт с доказательствами."}
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {settingsIncomplete && (
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:border-ink hover:text-ink"
            >
              <Settings className="h-4 w-4" />
              Открыть настройки
            </Link>
          )}
          <button
            onClick={runAudit}
            disabled={disableRun}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Идёт аудит…
              </>
            ) : (
              <>
                Запустить аудит
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
