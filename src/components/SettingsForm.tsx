"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import {
  Badge,
  Button,
  FieldLabel,
  Input,
  Panel,
  PanelBody,
  PanelHeader,
  SegmentedControl,
  Select,
  StatusNotice,
  SwitchRow,
} from "@/components/ui";

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
      <Panel>
        <PanelHeader
          title="Доступ к модели"
          description="API-ключ, провайдер и модель, которая будет собирать текст отчёта."
          meta={<Badge tone="neutral">локально</Badge>}
        />

        <PanelBody className="space-y-5">
          <div className="space-y-2">
            <FieldLabel htmlFor="api-key" hint="хранится локально">
              API-ключ
            </FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input
                id="api-key"
                className="w-full sm:flex-1"
                inputClassName="font-mono"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                leftSlot={<KeyRound className="h-4 w-4" aria-hidden="true" />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? "Скрыть ключ" : "Показать ключ"}
                    aria-pressed={showKey}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-paper hover:text-ink"
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                }
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => void fetchModels()}
                disabled={loadingModels || !apiKey.trim()}
                loading={loadingModels}
              >
                {loadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Загрузить модели"
                )}
              </Button>
            </div>
            <p className="text-[12px] leading-relaxed text-muted">
              Не знаете, что вводить?{" "}
              <a
                href="#api-key-guide"
                className="text-ink underline underline-offset-2"
              >
                Где взять ключ и что это такое
              </a>
              .
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Провайдер</FieldLabel>
              <SegmentedControl
                ariaLabel="Провайдер"
                value={group}
                onChange={setGroup}
                labelClassName="font-mono text-[11px] uppercase tracking-wider"
                options={[
                  { value: "go", label: "opencode go" },
                  {
                    value: "zen",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        opencode zen
                        <span className="rounded-full border border-positive/30 bg-positive/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wider text-positive">
                          free
                        </span>
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="model-select">Модель</FieldLabel>
              <Select
                id="model-select"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
              >
                {groupedModels.length === 0 && (
                  <option value="">Сначала загрузите модели…</option>
                )}
                {groupedModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Отчёт и диагностика"
          description="Язык результата и подробность технического журнала во время проверки."
        />

        <PanelBody className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Язык отчёта</FieldLabel>
            <SegmentedControl
              ariaLabel="Язык отчёта"
              value={language}
              onChange={setLanguage}
              options={[
                { value: "ru", label: "Русский" },
                { value: "en", label: "English" },
              ]}
            />
          </div>

          <SwitchRow
            label="Расширенные логи"
            description="Показывать в журнале отладочные события и подробности по каждому вызову инструмента."
            checked={debugMode}
            onChange={setDebugMode}
          />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Аккаунт"
          description="Позже здесь появятся профиль пользователя, синхронизация аудитов и командные настройки."
          meta={<Badge tone="neutral">планируется</Badge>}
        />
        <PanelBody>
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-line bg-paper/45 px-4 py-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
              <UserRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Аккаунт пока не требуется</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Сейчас все настройки и история хранятся в браузере. Будущий аккаунт
                добавит синхронизацию, но локальный режим останется понятным.
              </p>
            </div>
          </div>
        </PanelBody>
      </Panel>

      <StatusNotice tone="info" heading="Автосохранение">
        Значения сохраняются автоматически при изменении. API-ключ остаётся в
        локальном хранилище браузера.
      </StatusNotice>
    </section>
  );
}
