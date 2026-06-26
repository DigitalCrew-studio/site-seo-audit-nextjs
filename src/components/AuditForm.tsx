"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Settings, AlertTriangle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import {
  Badge,
  Button,
  FieldLabel,
  Input,
  LinkButton,
  Panel,
  PanelBody,
  PanelHeader,
  StatusNotice,
} from "@/components/ui";

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
    <Panel>
      <PanelHeader
        title="Запуск проверки"
        description="Введите домен или URL страницы. Seofriendly сам нормализует адрес перед обходом."
        meta={
          running ? (
            <Badge tone="accent">идёт аудит</Badge>
          ) : settingsIncomplete ? (
            <Badge tone="neutral">нужны настройки</Badge>
          ) : (
            <Badge tone="positive">готово</Badge>
          )
        }
      />

      <PanelBody className="space-y-5">
        {settingsIncomplete && (
          <StatusNotice
            role="alert"
            tone="warning"
            icon={<AlertTriangle className="h-4 w-4 text-accent" />}
            heading={missingApiKey ? "Не указан API-ключ" : "Не выбрана модель"}
          >
            Перед запуском откройте{" "}
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 font-medium text-ink underline-offset-2 hover:underline"
            >
              <Settings className="h-3.5 w-3.5" />
              настройки
            </Link>{" "}
            и заполните ключ доступа и модель.
          </StatusNotice>
        )}

        {running && (
          <StatusNotice
            role="alert"
            tone="warning"
            icon={<AlertTriangle className="h-4 w-4 text-accent" />}
            heading="Не обновляйте вкладку"
          >
            Сейчас идёт аудит. Если обновить или закрыть страницу, текущая
            проверка будет прекращена и её нельзя будет продолжить с того же места.
          </StatusNotice>
        )}

        <div className="space-y-2">
          <FieldLabel htmlFor="audit-url" hint="например: example.com">
            URL сайта
          </FieldLabel>
          <Input
            id="audit-url"
            inputClassName="font-mono"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {error && !running && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}
      </PanelBody>

      <div className="flex flex-col gap-3 border-t border-line bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted">
          {running
            ? "Браузер обходит сайт и снимает технические показатели…"
            : "Аудит запускается в headless Chromium и формирует отчёт с доказательствами."}
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {settingsIncomplete && (
            <LinkButton
              href="/settings"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4" />
              Открыть настройки
            </LinkButton>
          )}
          <Button
            variant="primary"
            className="group w-full sm:w-auto"
            onClick={runAudit}
            disabled={disableRun}
            loading={running}
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
          </Button>
        </div>
      </div>
    </Panel>
  );
}
