import { create } from "zustand";
import { consumeSSE } from "@/lib/sse-client";
import type {
  AuditLanguage,
  LogEntry,
  ModelInfo,
  OpenCodeGroup,
} from "@/lib/types";

const STORAGE_KEY = "opencode_api_key";

// Non-reactive runtime handles (kept outside React/store state).
let abortController: AbortController | null = null;
let runId = 0;

function now(): string {
  return new Date().toLocaleTimeString();
}

type AuditState = {
  // ----- form state -----
  apiKey: string;
  models: Record<OpenCodeGroup, ModelInfo[]>;
  group: OpenCodeGroup;
  modelId: string;
  language: AuditLanguage;
  url: string;
  loadingModels: boolean;
  // ----- audit state -----
  running: boolean;
  logs: LogEntry[];
  report: string;
  reportOpen: boolean;
  error: string;

  // ----- actions -----
  hydrate: () => void;
  setApiKey: (v: string) => void;
  setGroup: (g: OpenCodeGroup) => void;
  setModelId: (id: string) => void;
  setLanguage: (l: AuditLanguage) => void;
  setUrl: (v: string) => void;
  setReportOpen: (open: boolean) => void;
  fetchModels: () => Promise<void>;
  runAudit: () => Promise<void>;
};

export const useAuditStore = create<AuditState>((set, get) => {
  const addLog = (entry: LogEntry) =>
    set((s) => ({ logs: [...s.logs, entry] }));

  return {
    apiKey: "",
    models: { go: [], zen: [] },
    group: "go",
    modelId: "",
    language: "en",
    url: "",
    loadingModels: false,
    running: false,
    logs: [],
    report: "",
    reportOpen: false,
    error: "",

    hydrate: () => {
      if (typeof window === "undefined") return;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) set({ apiKey: saved });
    },

    setApiKey: (v) => set({ apiKey: v }),

    setGroup: (group) => {
      const { models, modelId } = get();
      const list = models[group];
      if (list.length && !list.find((m) => m.id === modelId)) {
        set({ group, modelId: list[0].id });
      } else {
        set({ group });
      }
    },

    setModelId: (id) => set({ modelId: id }),
    setLanguage: (l) => set({ language: l }),
    setUrl: (v) => set({ url: v }),
    setReportOpen: (open) => set({ reportOpen: open }),

    fetchModels: async () => {
      const { apiKey, group } = get();
      if (!apiKey.trim()) return;
      set({ loadingModels: true, error: "" });
      try {
        const res = await fetch("/api/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load models");
        set({ models: { go: data.go || [], zen: data.zen || [] } });
        const { modelId, models } = get();
        if (!modelId) {
          const initial = models[group]?.[0]?.id || "";
          if (initial) set({ modelId: initial });
        }
        localStorage.setItem(STORAGE_KEY, apiKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ error: msg });
      } finally {
        set({ loadingModels: false });
      }
    },

    runAudit: async () => {
      const { apiKey, modelId, url, group, language } = get();
      if (!apiKey.trim() || !modelId || !url.trim()) return;

      // Abort any previous run so a fresh click always starts a new audit.
      abortController?.abort();
      const controller = new AbortController();
      abortController = controller;
      const id = ++runId;

      const setIfCurrent = (fn: () => void) => {
        if (runId === id) fn();
      };

      set({ running: true, report: "", reportOpen: false, error: "", logs: [] });
      addLog({
        type: "status",
        message:
          language === "ru" ? "Подготовка к аудиту..." : "Preparing audit...",
        time: now(),
      });

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, modelId, group, url, language }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error("No response stream");

        await consumeSSE(res.body, {
          onStatus: (p) =>
            addLog({ type: "status", message: p.message, time: now() }),
          onTool: (p) =>
            addLog({ type: "tool", name: p.name, args: p.args, time: now() }),
          onToolError: (p) =>
            addLog({
              type: "tool_error",
              name: p.name,
              args: p.args,
              error: p.error,
              time: now(),
            }),
          onError: (p) => {
            setIfCurrent(() => set({ error: p.message }));
            addLog({ type: "error", message: p.message, time: now() });
          },
          onDone: (p) => setIfCurrent(() => set({ report: p.report })),
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        setIfCurrent(() => set({ error: msg }));
        addLog({ type: "error", message: msg, time: now() });
      } finally {
        setIfCurrent(() => {
          set({ running: false });
          abortController = null;
        });
      }
    },
  };
});
