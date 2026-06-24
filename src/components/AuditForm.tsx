"use client";

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Loader2, ArrowRight } from "lucide-react";
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

export function AuditForm() {
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
    url,
    setUrl,
    running,
    runAudit,
    error,
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
      url: s.url,
      setUrl: s.setUrl,
      running: s.running,
      runAudit: s.runAudit,
      error: s.error,
      hydrate: s.hydrate,
    }))
  );

  // Restore the saved API key from localStorage once on mount.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const groupedModels = useMemo(() => models[group], [models, group]);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="eyebrow text-muted">Configuration</span>
        <span className="eyebrow text-faint">step 01</span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* API key */}
        <div className="space-y-2">
          <FieldLabel hint="stored locally">OpenCode API key</FieldLabel>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="field font-mono"
            />
            <button
              onClick={fetchModels}
              disabled={loadingModels || !apiKey.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line-strong bg-paper px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingModels ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load models"
              )}
            </button>
          </div>
        </div>

        {/* Group + Model */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Provider</FieldLabel>
            <div className="grid grid-cols-2 gap-0 rounded-lg border border-line p-1">
              {(["go", "zen"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`rounded-md py-2 text-sm font-medium transition ${
                    group === g
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-paper hover:text-ink-soft"
                  }`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-wider">
                    opencode {g}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel>Model</FieldLabel>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="field"
            >
              {groupedModels.length === 0 && (
                <option value="">Load models first…</option>
              )}
              {groupedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language + URL */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Report language</FieldLabel>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "ru")}
              className="field"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          <div className="space-y-2">
            <FieldLabel>Target URL</FieldLabel>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="field font-mono"
            />
          </div>
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
            ? "The model is inspecting the site with browser tools…"
            : "The audit runs headless Chromium and reports findings with evidence."}
        </p>
        <button
          onClick={runAudit}
          disabled={running || !apiKey.trim() || !modelId || !url.trim()}
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running audit…
            </>
          ) : (
            <>
              Run audit
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
