"use client";

import { useEffect } from "react";
import { Loader2, ArrowRight, AlertTriangle, Radio } from "lucide-react";
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
  StatusNotice,
} from "@/components/ui";

export function AuditForm() {
  const {
    url,
    setUrl,
    running,
    backgroundRunActive,
    runAudit,
    cancelBackgroundRun,
    error,
    hydrate,
  } = useAuditStore(
    useShallow((s) => ({
      url: s.url,
      setUrl: s.setUrl,
      running: s.running,
      backgroundRunActive: s.backgroundRunActive,
      runAudit: s.runAudit,
      cancelBackgroundRun: s.cancelBackgroundRun,
      error: s.error,
      hydrate: s.hydrate,
    }))
  );

  // Restore saved language + URL from localStorage.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const missingUrl = !url.trim();
  // While a run is on screen we keep the button busy, but a background run
  // does not block starting a new one (clicking it will cancel the old run).
  const disableRun = running || missingUrl;

  return (
    <Panel>
      <PanelHeader
        title="Запуск проверки"
        description="Введите домен или URL страницы. Seofriendly сам нормализует адрес перед обходом."
        meta={
          running ? (
            <Badge tone="accent">идёт аудит</Badge>
          ) : backgroundRunActive ? (
            <Badge tone="accent">идёт в фоне</Badge>
          ) : (
            <Badge tone="positive">готово</Badge>
          )
        }
      />

      <PanelBody className="space-y-5">
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

        {backgroundRunActive && (
          <StatusNotice
            role="alert"
            tone="info"
            icon={<Radio className="h-4 w-4 text-accent" />}
            heading="Аудит работает в фоне"
            action={
              <Button
                variant="secondary"
                onClick={cancelBackgroundRun}
                className="shrink-0"
              >
                Остановить
              </Button>
            }
          >
            Откройте запущенный аудит в истории слева, чтобы наблюдать за ним
            в реальном времени, либо остановите его и запустите новый.
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
            : backgroundRunActive
              ? "Сейчас идёт другой аудит. Можно запустить новый — текущий будет остановлен."
              : "Аудит запускается в headless Chromium и формирует отчёт с доказательствами."}
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
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
            ) : backgroundRunActive ? (
              <>
                Остановить и запустить новый
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
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
