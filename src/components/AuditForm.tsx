"use client";

import { Fragment, useEffect, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import type { SavedAudit, SavedAuditStatus } from "@/store/auditStore";
import {
  Button,
  FieldLabel,
  Input,
  Panel,
  PILL_TONE_TEXT,
  PILL_TONE_TEXT_DOT,
  StatusPill,
  type PillTone,
} from "@/components/ui";

function pillToneForStatus(status: SavedAuditStatus): PillTone {
  switch (status) {
    case "running":
      return "accent";
    case "completed":
      return "positive";
    case "failed":
      return "danger";
    case "interrupted":
    default:
      return "muted";
  }
}

function statusLabel(status: SavedAuditStatus): string {
  switch (status) {
    case "completed":
      return "Готово";
    case "failed":
      return "Ошибка";
    case "running":
      return "Идёт";
    case "interrupted":
    default:
      return "Прервано";
  }
}

function formatDateTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatDuration(ms?: number): string | undefined {
  if (!ms || ms <= 0) return undefined;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}с`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}м ${s}с`;
  const h = Math.floor(m / 60);
  return `${h}ч ${m % 60}м`;
}

type MetaPart = {
  text: ReactNode;
  tone?: "muted" | "status";
  status?: SavedAuditStatus;
};

function JoinedMeta({ parts }: { parts: MetaPart[] }) {
  const visible = parts.filter((p) => p.text !== undefined && p.text !== "");
  if (visible.length === 0) return null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 text-[12px] text-faint">
      {visible.map((part, i) => {
        const className =
          part.tone === "status" && part.status
            ? PILL_TONE_TEXT[pillToneForStatus(part.status)]
            : part.tone === "muted"
              ? "text-faint"
              : undefined;
        return (
          <Fragment key={i}>
            {i > 0 ? <span aria-hidden="true">·</span> : null}
            <span className={className}>{part.text}</span>
          </Fragment>
        );
      })}
    </span>
  );
}

export function AuditForm() {
  const {
    url,
    setUrl,
    running,
    backgroundRunActive,
    runAudit,
    cancelBackgroundRun,
    liveError,
    savedError,
    isViewingSavedAudit,
    activeSavedAuditId,
    savedAudits,
    report,
    setReportOpen,
    dismissSavedError,
    hydrate,
  } = useAuditStore(
    useShallow((s) => ({
      url: s.url,
      setUrl: s.setUrl,
      running: s.running,
      backgroundRunActive: s.backgroundRunActive,
      runAudit: s.runAudit,
      cancelBackgroundRun: s.cancelBackgroundRun,
      liveError: s.liveError,
      savedError: s.savedError,
      isViewingSavedAudit: s.isViewingSavedAudit,
      activeSavedAuditId: s.activeSavedAuditId,
      savedAudits: s.savedAudits,
      report: s.report,
      setReportOpen: s.setReportOpen,
      dismissSavedError: s.dismissSavedError,
      hydrate: s.hydrate,
    }))
  );

  // Restore saved language + URL from localStorage.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const missingUrl = !url.trim();
  const disableRun = running || missingUrl;

  const audit: SavedAudit | undefined = isViewingSavedAudit
    ? savedAudits.find((entry) => entry.id === activeSavedAuditId)
    : undefined;

  const status: SavedAuditStatus = running
    ? "running"
    : audit
      ? audit.status
      : "interrupted";

  const logCount = audit?.logCount ?? audit?.logs.length ?? 0;
  const screenshotCount =
    audit?.screenshotCount ?? audit?.screenshots.length ?? 0;
  const reportImageCount =
    audit?.reportImageCount ?? audit?.reportImages.length ?? 0;
  const hasReport = Boolean(audit?.report?.trim());

  const visibleError =
    running || backgroundRunActive
      ? liveError
      : audit
        ? audit.error ?? savedError
        : savedError;

  const showWorkspace = Boolean(audit) || running || backgroundRunActive;

  const updatedLabel = formatDateTime(audit?.updatedAt);
  const duration = formatDuration(audit?.durationMs);
  const headerTitle = running
    ? "Текущий аудит"
    : audit
      ? audit.domain || audit.title || audit.url
      : null;

  const isWaitingForDocument = running || (audit !== undefined && !hasReport);

  const caption = running
    ? "Идёт обход и анализ. Не закрывайте вкладку."
    : backgroundRunActive
      ? "В фоне идёт другой аудит. Можно запустить новый — текущий остановится."
      : isViewingSavedAudit
        ? "Архивный аудит. Кнопка ниже запустит новый."
        : "Аудит запускается в headless Chromium и формирует отчёт с доказательствами.";

  const primaryLine: MetaPart[] = [
    ...(headerTitle
      ? [{ text: <span className="font-medium text-ink">{headerTitle}</span> }]
      : []),
    { text: statusLabel(status), tone: "status", status },
  ];

  const secondaryLine: MetaPart[] = [
    ...(isViewingSavedAudit && audit
      ? [{ text: "архив", tone: "muted" as const }]
      : []),
    ...(updatedLabel
      ? [{ text: `обновлён ${updatedLabel}`, tone: "muted" as const }]
      : []),
    ...(duration ? [{ text: duration, tone: "muted" as const }] : []),
    ...(logCount > 0
      ? [{ text: `${logCount} логов`, tone: "muted" as const }]
      : []),
    ...(screenshotCount + reportImageCount > 0
      ? [
          {
            text: `${screenshotCount + reportImageCount} изобр.`,
            tone: "muted" as const,
          },
        ]
      : []),
    ...(hasReport ? [{ text: "отчёт", tone: "muted" as const }] : []),
  ];

  return (
    <Panel>
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-ink">
            {isViewingSavedAudit ? "Архивный аудит" : "Запуск проверки"}
          </span>
          {showWorkspace ? (
            <>
              <span aria-hidden="true" className="text-faint">·</span>
              <span
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${PILL_TONE_TEXT_DOT[pillToneForStatus(status)]} ${
                  status === "running" ? "animate-pulse" : ""
                }`}
                aria-hidden="true"
              />
              <JoinedMeta parts={primaryLine} />
            </>
          ) : null}
        </div>
        <p className="text-[12px] text-faint">{caption}</p>
        {secondaryLine.length > 0 ? (
          <JoinedMeta parts={secondaryLine} />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-line px-4 py-3">
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
        {isWaitingForDocument ? (
          <p className="text-[12px] text-faint">
            Подождите немного, тут появится документ
          </p>
        ) : null}
        {liveError && !running && !isViewingSavedAudit ? (
          <p className="text-[12px] text-red-700">{liveError}</p>
        ) : null}
      </div>

      {report && !running ? (
        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive/10 text-positive">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink">Аудит завершён</p>
            <p className="text-[11px] text-faint">
              Отчёт сохранён локально и доступен в истории аудитов.
            </p>
          </div>
          <span className="hidden rounded-full border border-positive/20 bg-positive/5 px-2 py-0.5 text-[11px] font-medium text-positive sm:inline-flex">
            отчёт готов
          </span>
          <Button
            variant="secondary"
            onClick={() => setReportOpen(true)}
            className="group shrink-0"
          >
            Открыть отчёт
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {backgroundRunActive && !running ? (
          <button
            type="button"
            onClick={cancelBackgroundRun}
            className="text-[12px] text-faint underline-offset-2 hover:text-ink hover:underline"
          >
            Остановить фоновый аудит
          </button>
        ) : (
          <span className="text-[12px] text-faint">
            {isViewingSavedAudit
              ? "Измените URL или нажмите «Запустить новый аудит»."
              : "Введите URL и нажмите «Запустить новый аудит»."}
          </span>
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
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Идёт…
            </>
          ) : (
            <>
              Запустить новый аудит
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>

      {visibleError && (running || backgroundRunActive || audit) ? (
        <div className="flex items-start gap-2 border-t border-line px-4 py-2.5 text-[12px] text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="flex-1 break-words">
            <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-700/70">
              Ошибка
            </span>
            {visibleError}
          </p>
          {!running && !backgroundRunActive && audit ? (
            <button
              type="button"
              onClick={dismissSavedError}
              title="Скрыть ошибку"
              aria-label="Скрыть ошибку"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-red-700/70 transition hover:bg-red-50 hover:text-red-800"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
