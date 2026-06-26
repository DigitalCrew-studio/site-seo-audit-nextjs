import { create } from "zustand";
import { consumeSSE } from "@/lib/sse-client";
import type {
  AuditLanguage,
  LogEntry,
  ModelInfo,
  OpenCodeGroup,
  ReportImageEntry,
  ScreenshotEntry,
} from "@/lib/types";
import {
  base64ToBlob,
  deleteAuditImage,
  deleteAuditImages,
  saveAuditImage,
} from "@/lib/audit-image-store";

const STORAGE_KEY = "opencode_api_key";
const GROUP_STORAGE_KEY = "opencode_group";
const MODEL_ID_STORAGE_KEY = "opencode_model_id";
const LANGUAGE_STORAGE_KEY = "opencode_language";
const LAST_URL_STORAGE_KEY = "opencode_last_url";
const SAVED_AUDITS_STORAGE_KEY = "opencode_saved_audits";
const MAX_LOG_ENTRIES = 2000;
const MAX_SCREENSHOTS = 20;
const MAX_REPORT_IMAGES = 30;

// ----- Saved audit (local history) limits -----
export const MAX_SAVED_AUDITS = 20;
export const MAX_SAVED_SCREENSHOTS_PER_AUDIT = 5;
export const MAX_SAVED_REPORT_IMAGES_PER_AUDIT = 10;
export const MAX_SAVED_LOG_ENTRIES_PER_AUDIT = 200;
const MAX_SUMMARY_CHARS = 220;
const MAX_REPORT_CHARS_PER_AUDIT = 60_000;
const MAX_REPORT_IMAGE_BYTES_PER_AUDIT = 4_000_000;

// Non-reactive runtime handles (kept outside React/store state).
let abortController: AbortController | null = null;
let runId = 0;

function now(): string {
  return new Date().toLocaleTimeString();
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function hostnameFromUrl(value: string): string | undefined {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return undefined;
  }
}

function summarizeReport(report: string): string | undefined {
  if (!report) return undefined;
  const stripped = report
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[`*_>#~|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return undefined;
  if (stripped.length <= MAX_SUMMARY_CHARS) return stripped;
  return stripped.slice(0, MAX_SUMMARY_CHARS - 1).trimEnd() + "…";
}

export type SavedAuditStatus = "running" | "completed" | "failed" | "interrupted";

export type SavedAuditImageMeta = {
  id: string;
  storage: "remote" | "indexeddb";
  imageId?: string;
  kind: "screenshot" | "social" | "schema";
  source: string;
  url: string;
  pageUrl?: string;
  alt?: string;
  mimeType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  status?: number;
  takenAt: string;
  profile?: "desktop" | "laptop" | "tablet" | "mobile";
  viewport?: { width: number; height: number };
};

export type SavedAudit = {
  id: string;
  url: string;
  domain?: string;
  title?: string;
  language: AuditLanguage;
  createdAt: string;
  updatedAt: string;
  status: SavedAuditStatus;
  report: string;
  reportImages: SavedAuditImageMeta[];
  screenshots: SavedAuditImageMeta[];
  logs: LogEntry[];
  error?: string;
  summary?: string;
};

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
  screenshots: ScreenshotEntry[];
  reportImages: ReportImageEntry[];
  report: string;
  reportOpen: boolean;
  error: string;
  // ----- debug mode (toggleable live during an audit) -----
  debugMode: boolean;
  // ----- saved audits (local history) -----
  savedAudits: SavedAudit[];
  activeSavedAuditId?: string;

  // ----- actions -----
  hydrate: () => void;
  hydrateSavedAudits: () => void;
  setApiKey: (v: string) => void;
  setGroup: (g: OpenCodeGroup) => void;
  setModelId: (id: string) => void;
  setLanguage: (l: AuditLanguage) => void;
  setUrl: (v: string) => void;
  setReportOpen: (open: boolean) => void;
  setDebugMode: (v: boolean) => void;
  fetchModels: () => Promise<void>;
  runAudit: () => Promise<void>;
  newAudit: () => void;
  loadSavedAudit: (id: string) => void;
  deleteSavedAudit: (id: string) => void;
};

function readSavedAuditsFromStorage(): SavedAudit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_AUDITS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is SavedAudit => {
        return (
          entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.url === "string" &&
          typeof entry.createdAt === "string"
        );
      })
      .slice(0, MAX_SAVED_AUDITS);
  } catch {
    return [];
  }
}

function writeSavedAuditsToStorage(audits: SavedAudit[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = audits.slice(0, MAX_SAVED_AUDITS);
    localStorage.setItem(SAVED_AUDITS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be full or disabled; silently ignore so the UI keeps working.
  }
}

function collectImageIds(audit: SavedAudit): string[] {
  const ids: string[] = [];
  for (const shot of audit.screenshots) {
    if (shot.imageId) ids.push(shot.imageId);
  }
  for (const image of audit.reportImages) {
    if (image.imageId) ids.push(image.imageId);
  }
  return ids;
}

function isUsableForStatus(
  status: SavedAuditStatus,
  state: { error: string; logs: LogEntry[]; report: string }
): boolean {
  if (status === "running") return true;
  if (status === "completed") return Boolean(state.report.trim());
  if (status === "failed")
    return Boolean(state.error.trim()) || state.logs.length > 0 || state.report.trim().length > 0;
  return state.logs.length > 0 || state.report.trim().length > 0;
}

function trimReportImagesForStorage(images: ReportImageEntry[]): ReportImageEntry[] {
  const taken = images.slice(-MAX_SAVED_REPORT_IMAGES_PER_AUDIT);
  let budget = MAX_REPORT_IMAGE_BYTES_PER_AUDIT;
  const out: ReportImageEntry[] = [];
  for (let i = taken.length - 1; i >= 0; i -= 1) {
    const image = taken[i];
    if (!image) continue;
    if (image.kind === "screenshot" && image.storage !== "remote") {
      const bytes = typeof image.bytes === "number" ? image.bytes : 0;
      if (bytes > budget) continue;
      budget -= bytes;
    }
    out.unshift(image);
  }
  return out;
}

function toSavedImageMeta(image: ReportImageEntry): SavedAuditImageMeta {
  return {
    id: image.id,
    storage: image.storage === "remote" ? "remote" : "indexeddb",
    imageId: image.imageId,
    kind: image.kind,
    source: image.source,
    url: image.url,
    pageUrl: image.pageUrl,
    alt: image.alt,
    mimeType: image.mimeType,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    status: image.status,
    takenAt: image.takenAt,
    profile: image.profile,
    viewport: image.viewport,
  };
}

function toSavedScreenshotMeta(shot: ScreenshotEntry): SavedAuditImageMeta {
  return {
    id: shot.id,
    storage: "indexeddb",
    imageId: shot.imageId,
    kind: "screenshot",
    source: shot.source ?? "screenshot",
    url: shot.url ?? "",
    mimeType: shot.mimeType,
    bytes: shot.bytes,
    takenAt: shot.takenAt,
    profile: shot.profile,
    viewport: shot.viewport,
  };
}

function buildSavedAuditSnapshot(
  state: AuditState,
  status: SavedAuditStatus,
  explicitId?: string
): SavedAudit | null {
  const url = state.url.trim();
  if (!url) return null;
  if (!isUsableForStatus(status, state)) return null;

  const logs = state.logs.slice(-MAX_SAVED_LOG_ENTRIES_PER_AUDIT);
  const reportImages = trimReportImagesForStorage(state.reportImages).map(toSavedImageMeta);
  const screenshots = state.screenshots
    .slice(-MAX_SAVED_SCREENSHOTS_PER_AUDIT)
    .map(toSavedScreenshotMeta);
  const report =
    state.report.length > MAX_REPORT_CHARS_PER_AUDIT
      ? state.report.slice(0, MAX_REPORT_CHARS_PER_AUDIT) + "\n\n[…truncated for local history]"
      : state.report;

  const domain = hostnameFromUrl(url);
  const nowStamp = nowIso();
  const existing = explicitId
    ? state.savedAudits.find((entry) => entry.id === explicitId)
    : state.activeSavedAuditId
      ? state.savedAudits.find((entry) => entry.id === state.activeSavedAuditId)
      : undefined;

  return {
    id: existing?.id ?? randomId(),
    url,
    domain,
    title: domain ?? url,
    language: state.language,
    createdAt: existing?.createdAt ?? nowStamp,
    updatedAt: nowStamp,
    status,
    report,
    reportImages,
    screenshots,
    logs,
    error: state.error || undefined,
    summary: summarizeReport(report),
  };
}

export const useAuditStore = create<AuditState>((set, get) => {
  const addLog = (entry: LogEntry) =>
    set((s) => ({ logs: [...s.logs, entry].slice(-MAX_LOG_ENTRIES) }));

  const persistAudit = (snapshot: SavedAudit, opts?: { pruneOrphans?: boolean }) => {
    set((s) => {
      const without = s.savedAudits.filter((entry) => entry.id !== snapshot.id);
      const next = [snapshot, ...without].slice(0, MAX_SAVED_AUDITS);
      // If we trimmed by max count, fire-and-forget the orphaned image cleanup.
      if (opts?.pruneOrphans) {
        const liveIds = new Set<string>();
        for (const audit of next) {
          for (const id of collectImageIds(audit)) liveIds.add(id);
        }
        const removed = without.slice(next.length - without.length);
        for (const dropped of removed) {
          const droppedIds = collectImageIds(dropped).filter((id) => !liveIds.has(id));
          if (droppedIds.length > 0) {
            void deleteAuditImages(droppedIds);
          }
        }
      }
      writeSavedAuditsToStorage(next);
      return { savedAudits: next, activeSavedAuditId: snapshot.id };
    });
  };

  const persistImmediateRunning = (snapshot: SavedAudit) => {
    set((s) => {
      const without = s.savedAudits.filter((entry) => entry.id !== snapshot.id);
      const next = [snapshot, ...without].slice(0, MAX_SAVED_AUDITS);
      writeSavedAuditsToStorage(next);
      return { savedAudits: next, activeSavedAuditId: snapshot.id };
    });
  };

  // Persist terminal states from the same state patch that updates the UI.
  const persistTerminalSnapshot = (
    patch: Partial<AuditState>,
    status: SavedAuditStatus
  ) => {
    set((s) => {
      const nextState: AuditState = { ...s, ...patch };
      const snapshot = buildSavedAuditSnapshot(nextState, status);
      if (!snapshot) return patch;
      const without = s.savedAudits.filter(
        (entry) => entry.id !== snapshot.id
      );
      const next = [snapshot, ...without].slice(0, MAX_SAVED_AUDITS);
      if (next.length < without.length + 1) {
        const liveIds = new Set<string>();
        for (const audit of next) {
          for (const id of collectImageIds(audit)) liveIds.add(id);
        }
        const removed = without.slice(next.length - without.length);
        for (const dropped of removed) {
          const droppedIds = collectImageIds(dropped).filter(
            (id) => !liveIds.has(id)
          );
          if (droppedIds.length > 0) void deleteAuditImages(droppedIds);
        }
      }
      writeSavedAuditsToStorage(next);
      return {
        ...patch,
        savedAudits: next,
        activeSavedAuditId: snapshot.id,
      };
    });
  };

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
    screenshots: [],
    reportImages: [],
    report: "",
    reportOpen: false,
    error: "",
    debugMode: false,
    savedAudits: [],
    activeSavedAuditId: undefined,

    setApiKey: (v) => {
      set({ apiKey: v });
      if (typeof window !== "undefined" && v.trim()) {
        localStorage.setItem(STORAGE_KEY, v);
      }
    },

    setGroup: (group) => {
      const { models, modelId } = get();
      const list = models[group];
      if (list.length && !list.find((m) => m.id === modelId)) {
        set({ group, modelId: list[0].id });
      } else {
        set({ group });
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(GROUP_STORAGE_KEY, group);
      }
    },

    setModelId: (id) => {
      set({ modelId: id });
      if (typeof window !== "undefined" && id) {
        localStorage.setItem(MODEL_ID_STORAGE_KEY, id);
      }
    },

    setLanguage: (l) => {
      set({ language: l });
      if (typeof window !== "undefined") {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, l);
      }
    },

    setUrl: (v) => {
      set({ url: v });
      if (typeof window !== "undefined" && v.trim()) {
        localStorage.setItem(LAST_URL_STORAGE_KEY, v);
      }
    },

    setReportOpen: (open) => set({ reportOpen: open }),
    setDebugMode: (v) => set({ debugMode: v }),

    hydrate: () => {
      if (typeof window === "undefined") return;
      const apiKey = localStorage.getItem(STORAGE_KEY) ?? "";
      const group = (localStorage.getItem(GROUP_STORAGE_KEY) as OpenCodeGroup) || "go";
      const modelId = localStorage.getItem(MODEL_ID_STORAGE_KEY) ?? "";
      const language = (localStorage.getItem(LANGUAGE_STORAGE_KEY) as AuditLanguage) || "en";
      const url = localStorage.getItem(LAST_URL_STORAGE_KEY) ?? "";
      set({ apiKey, group, modelId, language, url });
    },

    hydrateSavedAudits: () => {
      const list = readSavedAuditsFromStorage();
      // A page reload cannot resume an in-flight SSE. Convert any stale
      // "running" entries from previous page sessions to "interrupted" and
      // persist that conversion immediately.
      let mutated = false;
      const normalized: SavedAudit[] = list.map((entry) => {
        if (entry.status === "running") {
          mutated = true;
          return { ...entry, status: "interrupted", updatedAt: nowIso() };
        }
        return entry;
      });
      if (mutated) writeSavedAuditsToStorage(normalized);
      set({ savedAudits: normalized });
    },

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
        let nextModelId = modelId;
        if (!nextModelId) {
          const initial = models[group]?.[0]?.id || "";
          if (initial) {
            set({ modelId: initial });
            nextModelId = initial;
          }
        }
        localStorage.setItem(STORAGE_KEY, apiKey);
        if (nextModelId) {
          localStorage.setItem(MODEL_ID_STORAGE_KEY, nextModelId);
        }
        localStorage.setItem(GROUP_STORAGE_KEY, group);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ error: msg });
      } finally {
        set({ loadingModels: false });
      }
    },

    newAudit: () => {
      // If there is an active run in progress, mark it as interrupted (only
      // when there is something useful to keep). Otherwise just clear state.
      const before = get();
      if (before.running) {
        abortController?.abort();
        abortController = null;
        runId += 1;
        const interrupted = buildSavedAuditSnapshot(before, "interrupted");
        if (interrupted) persistAudit(interrupted, { pruneOrphans: true });
      }
      set({
        running: false,
        logs: [],
        screenshots: [],
        reportImages: [],
        report: "",
        reportOpen: false,
        error: "",
        activeSavedAuditId: undefined,
      });
    },

    loadSavedAudit: (id) => {
      const audit = get().savedAudits.find((entry) => entry.id === id);
      if (!audit) return;
      const isActiveLiveRun = get().running && get().activeSavedAuditId === id;
      if (isActiveLiveRun) {
        // Clicking the current running audit should keep the live in-memory
        // state instead of replacing it with a partial snapshot. Just make
        // sure the active id is set so the sidebar highlights it.
        set({ activeSavedAuditId: id });
        return;
      }
      abortController?.abort();
      abortController = null;
      runId += 1;
      // Rebuild runtime images from saved metadata. Screenshots are loaded
      // from IndexedDB via imageId when available; report images keep their
      // `url` (remote OG/Twitter URLs still work) and the screenshot-kind
      // entries get an imageId to be resolved on demand by the UI.
      const reportImages: ReportImageEntry[] = audit.reportImages.map((meta) => ({
        id: meta.id,
        kind: meta.kind,
        source: meta.source,
        url: meta.url,
        pageUrl: meta.pageUrl,
        alt: meta.alt,
        mimeType: meta.mimeType,
        bytes: meta.bytes,
        width: meta.width,
        height: meta.height,
        status: meta.status,
        takenAt: meta.takenAt,
        storage: meta.storage,
        imageId: meta.imageId,
        profile: meta.profile,
        viewport: meta.viewport,
      }));
      const screenshots: ScreenshotEntry[] = audit.screenshots.map((meta) => ({
        id: meta.id,
        url: meta.url || undefined,
        mimeType: meta.mimeType ?? "image/jpeg",
        bytes: meta.bytes ?? 0,
        takenAt: meta.takenAt,
        storage: "indexeddb",
        imageId: meta.imageId,
        source: meta.source,
        profile: meta.profile,
        viewport: meta.viewport,
      }));
      set({
        running: false,
        logs: audit.logs,
        screenshots,
        reportImages,
        report: audit.report,
        reportOpen: false,
        error: audit.error ?? "",
        url: audit.url,
        language: audit.language,
        activeSavedAuditId: audit.id,
      });
    },

    deleteSavedAudit: (id) => {
      set((s) => {
        const next = s.savedAudits.filter((entry) => entry.id !== id);
        writeSavedAuditsToStorage(next);
        // Best-effort IDB cleanup; the UI does not need to wait for it.
        const removed = s.savedAudits.find((entry) => entry.id === id);
        if (removed) {
          const ids = collectImageIds(removed);
          if (ids.length > 0) void deleteAuditImages(ids);
        }
        return {
          savedAudits: next,
          activeSavedAuditId:
            s.activeSavedAuditId === id ? undefined : s.activeSavedAuditId,
        };
      });
    },

    runAudit: async () => {
      const { apiKey, modelId, url, group, language, debugMode } = get();
      if (!apiKey.trim() || !modelId || !url.trim()) return;

      // If there is an active run in progress, mark it as interrupted (only
      // when there is something useful to keep) before we wipe the live
      // state. This avoids the race where a fresh run would clear the
      // previous run's logs and overwrite the saved audit.
      if (get().running) {
        const interrupted = buildSavedAuditSnapshot(get(), "interrupted");
        if (interrupted) persistAudit(interrupted, { pruneOrphans: true });
      }

      // Abort any previous run so a fresh click always starts a new audit.
      abortController?.abort();
      abortController = null;
      const controller = new AbortController();
      abortController = controller;
      const id = ++runId;

      const setIfCurrent = (fn: () => void) => {
        if (runId === id) fn();
      };

      set({
        running: true,
        report: "",
        reportOpen: false,
        error: "",
        logs: [],
        screenshots: [],
        reportImages: [],
        activeSavedAuditId: undefined,
      });
      addLog({
        type: "status",
        message:
          language === "ru" ? "Подготовка к аудиту..." : "Preparing audit...",
        time: now(),
      });

      // Create the saved audit record immediately so the sidebar shows it
      // as "Идёт" while the SSE stream is in flight.
      const initialSnapshot = buildSavedAuditSnapshot(get(), "running");
      if (initialSnapshot) persistImmediateRunning(initialSnapshot);

      const refreshRunningSnapshot = () => {
        const running = buildSavedAuditSnapshot(get(), "running");
        if (running) persistImmediateRunning(running);
      };

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            modelId,
            group,
            url,
            language,
            debugMode,
          }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error("No response stream");

        await consumeSSE(res.body, {
          onStatus: (p) => {
            addLog({ type: "status", message: p.message, phase: p.phase, time: now() });
            refreshRunningSnapshot();
          },
          onTool: (p) => {
            addLog({ type: "tool", name: p.name, args: p.args, time: now() });
            refreshRunningSnapshot();
          },
          onToolError: (p) => {
            addLog({
              type: "tool_error",
              name: p.name,
              args: p.args,
              error: p.error,
              time: now(),
            });
            refreshRunningSnapshot();
          },
          onToolEnd: (p) => {
            addLog({
              type: "tool_end",
              name: p.name,
              ok: p.ok,
              durationMs: p.durationMs,
              bytes: p.bytes,
              error: p.error,
              time: now(),
            });
            refreshRunningSnapshot();
          },
          onDebug: (p) => {
            addLog({
              type: "debug",
              message: p.message,
              data: p.data,
              time: now(),
            });
            refreshRunningSnapshot();
          },
          onScreenshot: (p) => {
            // Convert the incoming base64 to a Blob and persist to IndexedDB
            // before adding the metadata entry. We use the same id as the
            // runtime `imageId` so saved audits reference the same blob.
            const blob = base64ToBlob(p.base64, p.mimeType);
            const imageId = p.id;
            if (blob) {
              void saveAuditImage(imageId, blob);
            }
            setIfCurrent(() => {
              set((s) => {
                const nextShot: ScreenshotEntry = {
                  id: p.id,
                  url: p.url,
                  mimeType: p.mimeType,
                  bytes: p.bytes,
                  takenAt: p.takenAt,
                  storage: "indexeddb",
                  imageId,
                  source: p.source,
                  profile: p.profile,
                  viewport: p.viewport,
                };
                const screenshots = [...s.screenshots, nextShot].slice(-MAX_SCREENSHOTS);
                const sourceLabel =
                  p.source ??
                  (p.profile
                    ? `responsive rendering · ${p.profile}`
                    : "screenshot");
                const reportImage: ReportImageEntry = {
                  id: p.id,
                  kind: "screenshot",
                  source: sourceLabel,
                  url: p.url ?? "",
                  pageUrl: p.url,
                  alt: p.url ?? sourceLabel,
                  mimeType: p.mimeType,
                  bytes: p.bytes,
                  takenAt: p.takenAt,
                  storage: "indexeddb",
                  imageId,
                  profile: p.profile,
                  viewport: p.viewport,
                };
                const reportImages = [...s.reportImages, reportImage].slice(-MAX_REPORT_IMAGES);
                return { screenshots, reportImages };
              });
              // Refresh the sidebar with the new image metadata so its
              // counters stay in sync with the live run.
              refreshRunningSnapshot();
            });
          },
          onReportImage: (p) =>
            setIfCurrent(() => {
              set((s) => {
                // Dedupe by kind+source+url. Remote (OG/Twitter) entries
                // keep their original URL; no IndexedDB write is required.
                const exists = s.reportImages.some(
                  (image) =>
                    image.kind === p.kind &&
                    image.source === p.source &&
                    image.url === p.url
                );
                if (exists) return {};
                const next: ReportImageEntry = {
                  id: p.id,
                  kind: p.kind,
                  source: p.source,
                  url: p.url,
                  pageUrl: p.pageUrl,
                  alt: p.alt,
                  mimeType: p.mimeType,
                  bytes: p.bytes,
                  width: p.width,
                  height: p.height,
                  status: p.status,
                  takenAt: p.takenAt,
                  storage: "remote",
                };
                return { reportImages: [...s.reportImages, next].slice(-MAX_REPORT_IMAGES) };
              });
              refreshRunningSnapshot();
            }),
          onError: (p) => {
            // If this run was already superseded, do not let the late
            // error event clobber the new active saved audit.
            if (runId !== id) return;
            addLog({ type: "error", message: p.message, time: now() });
            persistTerminalSnapshot({ error: p.message }, "failed");
          },
          onDone: (p) => {
            if (runId !== id) return;
            persistTerminalSnapshot({ report: p.report }, "completed");
          },
        });
      } catch (err) {
        const isAbortLike =
          err instanceof Error &&
          (err.name === "AbortError" ||
            /abort|canceled|cancelled|networkerror|load failed|failed to fetch/i.test(err.message));
        if (isAbortLike) {
          // Only mark interrupted for the run that was actually aborted
          // (i.e. the still-current one). Late aborts from a superseded
          // run would otherwise wipe the new live state.
          if (runId === id) {
            persistTerminalSnapshot({}, "interrupted");
          }
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        if (runId === id) {
          addLog({ type: "error", message: msg, time: now() });
          persistTerminalSnapshot({ error: msg }, "failed");
        }
      } finally {
        if (runId === id) {
          set({ running: false });
          abortController = null;
        }
      }
    },
  };
});

// Helper used elsewhere when we need to drop the saved-audit image cache.
// Exposed for future use; not referenced by the rest of the codebase yet.
export const purgeAuditImageById = deleteAuditImage;
