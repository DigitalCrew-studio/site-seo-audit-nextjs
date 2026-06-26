"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="eyebrow text-muted">{children}</label>
      {hint && <span className="eyebrow text-faint">{hint}</span>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-paper/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? "bg-ink" : "bg-line-strong"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-paper transition ${
            checked ? "translate-x-[18px]" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsForm() {
  const {
    apiKey,
    setApiKey,
    loadingModels,
    fetchModels,
    group,
    setGroup,
    models,
    modelId,
    setModelId,
    language,
    setLanguage,
    debugMode,
    setDebugMode,
    hydrate,
  } = useAuditStore(
    useShallow((s) => ({
      apiKey: s.apiKey,
      setApiKey: s.setApiKey,
      loadingModels: s.loadingModels,
      fetchModels: s.fetchModels,
      group: s.group,
      setGroup: s.setGroup,
      models: s.models,
      modelId: s.modelId,
      setModelId: s.setModelId,
      language: s.language,
      setLanguage: s.setLanguage,
      debugMode: s.debugMode,
      setDebugMode: s.setDebugMode,
      hydrate: s.hydrate,
    }))
  );

  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    hydrate();
    const { apiKey: storedKey } = useAuditStore.getState();
    if (storedKey.trim()) {
      void fetchModels();
    }
  }, [hydrate, fetchModels]);

  const groupedModels = useMemo(() => models[group], [models, group]);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="eyebrow text-muted">доступ и модель</span>
          <span className="eyebrow text-faint">локально</span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* API key */}
          <div className="space-y-2">
            <FieldLabel hint="хранится локально">API-ключ</FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="field font-mono pl-10 pr-12"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Скрыть ключ" : "Показать ключ"}
                  className="absolute inset-y-0 right-2.5 flex items-center px-2 text-muted transition hover:text-ink"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void fetchModels()}
                disabled={loadingModels || !apiKey.trim()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line-strong bg-paper px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Загрузить модели"
                )}
              </button>
            </div>
          </div>

          {/* Group + Model */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Провайдер</FieldLabel>
              <div className="grid grid-cols-2 gap-0 rounded-lg border border-line p-1">
                {(
                  [
                    { value: "go", label: "opencode go" },
                    { value: "zen", label: "opencode zen" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGroup(opt.value)}
                    className={`rounded-md py-2 text-sm font-medium transition ${
                      group === opt.value
                        ? "bg-ink text-paper"
                        : "text-muted hover:bg-paper hover:text-ink-soft"
                    }`}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-wider">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel>Модель</FieldLabel>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="field"
              >
                {groupedModels.length === 0 && (
                  <option value="">Сначала загрузите модели…</option>
                )}
                {groupedModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="eyebrow text-muted">отчёт и логи</span>
          <span className="eyebrow text-faint">шаг 02</span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <FieldLabel>Язык отчёта</FieldLabel>
            <div className="grid grid-cols-2 gap-0 rounded-lg border border-line p-1">
              {(
                [
                  { value: "ru", label: "Русский" },
                  { value: "en", label: "English" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLanguage(opt.value)}
                  className={`rounded-md py-2 text-sm font-medium transition ${
                    language === opt.value
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-paper hover:text-ink-soft"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Расширенные логи"
            description="Показывать в журнале отладочные события и подробности по каждому вызову инструмента."
            checked={debugMode}
            onChange={setDebugMode}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-[13px] text-muted">
          Значения сохраняются автоматически при изменении.
        </p>
      </div>
    </section>
  );
}
