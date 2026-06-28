import { create } from "zustand";
import { consumeSSE } from "@/lib/sse-client";
import type {
  AuditLanguage,
  LogEntry,
  ReportImageEntry,
  ScreenshotEntry,
} from "@/lib/types";
import {
  base64ToBlob,
  deleteAuditImage,
  deleteAuditImages,
  saveAuditImage,
} from "@/lib/audit-image-store";

const LANGUAGE_STORAGE_KEY = "seofriendly_language";
const LAST_URL_STORAGE_KEY = "seofriendly_last_url";
const SAVED_AUDITS_STORAGE_KEY = "seofriendly_saved_audits";
const LEGACY_STORAGE_KEYS = {
  language: "opencode_language",
  lastUrl: "opencode_last_url",
  savedAudits: "opencode_saved_audits",
} as const;
const MAX_LOG_ENTRIES = 2000;
const MAX_SCREENSHOTS = 20;
const MAX_REPORT_IMAGES = 30;

// ----- Saved audit (local history) limits -----
export const MAX_SAVED_AUDITS = 20;
export const MAX_SAVED_SCREENSHOTS_PER_AUDIT = 12;
export const MAX_SAVED_REPORT_IMAGES_PER_AUDIT = 20;
export const MAX_SAVED_LOG_ENTRIES_PER_AUDIT = 500;
const MAX_SUMMARY_CHARS = 220;
const MAX_REPORT_CHARS_PER_AUDIT = 60_000;
const MAX_REPORT_IMAGE_BYTES_PER_AUDIT = 4_000_000;

// Non-reactive runtime handles (kept outside React/store state).
let abortController: AbortController | null = null;
let runId = 0;
// Tracks the saved-audit id of the run currently being streamed. Decoupling
// this from `activeSavedAuditId` (which the user can change by clicking other
// sidebar entries) is what keeps late SSE events from hijacking the wrong
// saved audit and lets the run keep going in the background.
let currentRunAuditId: string | null = null;

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
  logCount: number;
  screenshotCount: number;
  reportImageCount: number;
  durationMs?: number;
};

type AuditState = {
  // ----- form state -----
  language: AuditLanguage;
  url: string;
  // ----- audit state -----
  running: boolean;
  // True when a run is alive in the background (i.e. the user has navigated
  // to a different saved audit while the SSE is still streaming). Drives the
  // "Идёт в фоне" affordance and the Stop button in the form.
  backgroundRunActive: boolean;
  logs: LogEntry[];
  screenshots: ScreenshotEntry[];
  reportImages: ReportImageEntry[];
  report: string;
  reportOpen: boolean;
  // Error for the currently active workspace. `liveError` is the error from
  // the in-flight or just-finished run that the user is looking at.
  // `savedError` is the error of the currently loaded saved audit, used to
  // surface archive errors in the workspace details panel instead of the form.
  liveError: string;
  savedError: string;
  // ----- debug mode (toggleable live during an audit) -----
  debugMode: boolean;
  // ----- saved audits (local history) -----
  savedAudits: SavedAudit[];
  activeSavedAuditId?: string;
  // True when the workspace is currently mirroring a saved audit (either
  // historical or a live run viewed through the history). Drives the "Ошибка"
  // banner on top of the audit form: the form only shows liveError when the
  // workspace is not in saved mode.
  isViewingSavedAudit: boolean;

  // ----- actions -----
  hydrate: () => void;
  hydrateSavedAudits: () => void;
  setLanguage: (l: AuditLanguage) => void;
  setUrl: (v: string) => void;
  setReportOpen: (open: boolean) => void;
  setDebugMode: (v: boolean) => void;
  runAudit: () => Promise<void>;
  newAudit: () => void;
  loadSavedAudit: (id: string) => void;
  cancelBackgroundRun: () => void;
  deleteSavedAudit: (id: string) => void;
  deleteSavedAuditsByDomain: (domain: string) => void;
  dismissSavedError: () => void;
};

function readSavedAuditsFromStorage(): SavedAudit[] {
  if (typeof window === "undefined") return [];
  migrateLegacyStorage();
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
      .map((entry) => {
        const logsCount = Array.isArray(entry.logs) ? entry.logs.length : 0;
        return {
          ...entry,
          logCount:
            typeof entry.logCount === "number" ? entry.logCount : logsCount,
          screenshotCount:
            typeof entry.screenshotCount === "number"
              ? entry.screenshotCount
              : Array.isArray(entry.screenshots)
                ? entry.screenshots.length
                : 0,
          reportImageCount:
            typeof entry.reportImageCount === "number"
              ? entry.reportImageCount
              : Array.isArray(entry.reportImages)
                ? entry.reportImages.length
                : 0,
        };
      })
      .slice(0, MAX_SAVED_AUDITS);
  } catch {
    return [];
  }
}

// One-time migration from the previous `opencode_*` storage keys to neutral
// `seofriendly_*` keys. Removes the legacy entries after copying so a curious
// DevTools user only ever sees the neutral names going forward.
function migrateLegacyStorage(): void {
  try {
    const pairs: { legacy: string; next: string }[] = [
      { legacy: LEGACY_STORAGE_KEYS.language, next: LANGUAGE_STORAGE_KEY },
      { legacy: LEGACY_STORAGE_KEYS.lastUrl, next: LAST_URL_STORAGE_KEY },
      { legacy: LEGACY_STORAGE_KEYS.savedAudits, next: SAVED_AUDITS_STORAGE_KEY },
    ];
    for (const { legacy, next } of pairs) {
      if (localStorage.getItem(next) !== null) {
        localStorage.removeItem(legacy);
        continue;
      }
      const value = localStorage.getItem(legacy);
      if (value !== null) {
        try {
          localStorage.setItem(next, value);
        } catch {
          // Ignore quota/permission errors; the next setItem call will retry
          // on a real write path.
        }
        localStorage.removeItem(legacy);
      }
    }
  } catch {
    // localStorage can be disabled in privacy mode; nothing to migrate.
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
  state: { liveError: string; logs: LogEntry[]; report: string }
): boolean {
  if (status === "running") return true;
  if (status === "completed") return Boolean(state.report.trim());
  if (status === "failed")
    return Boolean(state.liveError.trim()) || state.logs.length > 0 || state.report.trim().length > 0;
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

  const startedAt = existing?.createdAt ? new Date(existing.createdAt).getTime() : null;
  const finishedAt = status === "running" ? null : new Date(nowStamp).getTime();
  const durationMs =
    startedAt && finishedAt && finishedAt > startedAt ? finishedAt - startedAt : existing?.durationMs;

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
    error: state.liveError || undefined,
    summary: summarizeReport(report),
    logCount: logs.length,
    screenshotCount: screenshots.length,
    reportImageCount: reportImages.length,
    durationMs,
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

  // Update the saved-audits entry for the currently-streaming audit. Goes
  // through the saved record itself rather than the main state so that the
  // background run keeps progressing even while the user is viewing a
  // different audit.
  const updateRunningSavedAudit = (
    updater: (audit: SavedAudit) => SavedAudit
  ) => {
    if (!currentRunAuditId) return;
    set((s) => {
      const audit = s.savedAudits.find((entry) => entry.id === currentRunAuditId);
      if (!audit) return {};
      // Once the audit reaches a terminal state (completed/failed/interrupted)
      // we must not let late SSE events (status/tool/screenshot/report_image)
      // re-mark it as "running". This guards against the trailing
      // "Audit completed with N tool error(s)" status event emitted after "done".
      if (audit.status !== "running") return {};
      const next = s.savedAudits.map((entry) =>
        entry.id === currentRunAuditId ? updater(entry) : entry
      );
      writeSavedAuditsToStorage(next);
      return { savedAudits: next };
    });
  };

  // The main state is "live-attached" when it is showing the audit that is
  // currently streaming. While false, SSE handlers skip touching the main
  // state to avoid clobbering the audit the user is reading.
  const isViewingLiveRun = () =>
    currentRunAuditId !== null && get().activeSavedAuditId === currentRunAuditId;

  // Just flip the status of the running audit (used for cancel/new-audit).
  const markRunningAsInterrupted = () => {
    if (!currentRunAuditId) return;
    updateRunningSavedAudit((audit) => ({
      ...audit,
      status: "interrupted",
      updatedAt: nowIso(),
    }));
  };

  // Persist terminal states (completed / failed / interrupted) by patching
  // the running audit's saved record directly, then conditionally mirroring
  // the patch into the main state only if the user is still attached.
  const persistTerminalSnapshot = (
    patch: Partial<AuditState>,
    status: SavedAuditStatus
  ) => {
    if (!currentRunAuditId) return;
    set((s) => {
      const audit = s.savedAudits.find((entry) => entry.id === currentRunAuditId);
      if (!audit) return {};
      const startedAt = new Date(audit.createdAt).getTime();
      const finishedAt = new Date(nowIso()).getTime();
      const durationMs =
        Number.isFinite(startedAt) &&
        Number.isFinite(finishedAt) &&
        finishedAt > startedAt
          ? finishedAt - startedAt
          : audit.durationMs;
      const updated: SavedAudit = {
        ...audit,
        status,
        updatedAt: nowIso(),
        durationMs,
        logCount: audit.logs.length,
        screenshotCount: audit.screenshots.length,
        reportImageCount: audit.reportImages.length,
      };
      if (patch.report !== undefined) {
        updated.report = patch.report;
        updated.summary = summarizeReport(patch.report) ?? audit.summary;
      }
      if (patch.liveError !== undefined) {
        updated.error = patch.liveError || undefined;
      }
      const without = s.savedAudits.filter(
        (entry) => entry.id !== currentRunAuditId
      );
      const next = [updated, ...without].slice(0, MAX_SAVED_AUDITS);
      if (next.length < without.length + 1) {
        const liveIds = new Set<string>();
        for (const entry of next) {
          for (const id of collectImageIds(entry)) liveIds.add(id);
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
      const liveAttached = s.activeSavedAuditId === currentRunAuditId;
      return liveAttached
        ? { ...patch, savedAudits: next }
        : { savedAudits: next };
    });
  };

  return {
    language: "en",
    url: "",
    running: false,
    backgroundRunActive: false,
    logs: [],
    screenshots: [],
    reportImages: [],
    report: "",
    reportOpen: false,
    liveError: "",
    savedError: "",
    debugMode: false,
    savedAudits: [],
    activeSavedAuditId: undefined,
    isViewingSavedAudit: false,

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

    dismissSavedError: () => set({ savedError: "" }),

    hydrate: () => {
      if (typeof window === "undefined") return;
      migrateLegacyStorage();
      const language = (localStorage.getItem(LANGUAGE_STORAGE_KEY) as AuditLanguage) || "en";
      const url = localStorage.getItem(LAST_URL_STORAGE_KEY) ?? "";
      set({ language, url });
    },

    hydrateSavedAudits: () => {
      if (typeof window !== "undefined") migrateLegacyStorage();
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

    newAudit: () => {
      // If there is any run in progress (foreground or background), kill it
      // and persist it as interrupted before clearing the workspace.
      if (currentRunAuditId) {
        markRunningAsInterrupted();
        abortController?.abort();
        abortController = null;
        runId += 1;
        currentRunAuditId = null;
      }
      set({
        running: false,
        backgroundRunActive: false,
        logs: [],
        screenshots: [],
        reportImages: [],
        report: "",
        reportOpen: false,
        liveError: "",
        savedError: "",
        isViewingSavedAudit: false,
        activeSavedAuditId: undefined,
      });
    },

    cancelBackgroundRun: () => {
      if (!currentRunAuditId) return;
      markRunningAsInterrupted();
      abortController?.abort();
      abortController = null;
      runId += 1;
      currentRunAuditId = null;
      set((s) => ({
        running: false,
        backgroundRunActive: false,
      }));
    },

    loadSavedAudit: (id) => {
      const audit = get().savedAudits.find((entry) => entry.id === id);
      if (!audit) return;
      const isLiveRun = currentRunAuditId === id;
      // Clicking the running audit while it is already in the foreground is
      // a no-op aside from making sure the sidebar highlight is in sync.
      if (isLiveRun && get().running) {
        set({ activeSavedAuditId: id });
        return;
      }

      // Only kill the in-flight stream when there is no run in progress.
      // When a run is alive (foreground or background) we keep it streaming
      // and just switch the workspace over to the clicked audit.
      const hasLiveRun =
        get().running || get().backgroundRunActive || currentRunAuditId !== null;
      if (!hasLiveRun) {
        abortController?.abort();
        abortController = null;
        runId += 1;
      }

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

      const switchingToLiveRun = isLiveRun;
      set({
        running: switchingToLiveRun,
        backgroundRunActive: hasLiveRun && !switchingToLiveRun,
        logs: audit.logs,
        screenshots,
        reportImages,
        report: audit.report,
        reportOpen: false,
        liveError: "",
        savedError: audit.error ?? "",
        isViewingSavedAudit: !switchingToLiveRun,
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

    deleteSavedAuditsByDomain: (domain) => {
      set((s) => {
        const target = domain.toLowerCase();
        const removed = s.savedAudits.filter(
          (entry) => (entry.domain || "").toLowerCase() === target
        );
        if (removed.length === 0) return {};
        const removedIds = new Set(removed.map((entry) => entry.id));
        const next = s.savedAudits.filter((entry) => !removedIds.has(entry.id));
        writeSavedAuditsToStorage(next);
        // Best-effort IDB cleanup for all removed audits.
        const imageIds: string[] = [];
        for (const entry of removed) {
          for (const id of collectImageIds(entry)) imageIds.push(id);
        }
        if (imageIds.length > 0) void deleteAuditImages(imageIds);
        const clearedActiveId =
          s.activeSavedAuditId && removedIds.has(s.activeSavedAuditId)
            ? undefined
            : s.activeSavedAuditId;
        return {
          savedAudits: next,
          activeSavedAuditId: clearedActiveId,
        };
      });
    },

    runAudit: async () => {
      const { url, language, debugMode } = get();
      if (!url.trim()) return;

      // If a previous run is still in flight (in the foreground or the
      // background), tear it down and persist it as interrupted before we
      // commit to a new run. The main state we read here may belong to a
      // different audit the user is viewing, so we go through the saved
      // record directly via currentRunAuditId.
      if (currentRunAuditId) {
        markRunningAsInterrupted();
        abortController?.abort();
        abortController = null;
        runId += 1;
        currentRunAuditId = null;
      }

      // Abort any previous run so a fresh click always starts a new audit.
      abortController?.abort();
      abortController = null;
      const controller = new AbortController();
      abortController = controller;
      const id = ++runId;

      set({
        running: true,
        backgroundRunActive: false,
        report: "",
        reportOpen: false,
        liveError: "",
        savedError: "",
        isViewingSavedAudit: false,
        logs: [],
        screenshots: [],
        reportImages: [],
        activeSavedAuditId: undefined,
      });
      const firstLog: LogEntry = {
        type: "status",
        message:
          language === "ru" ? "Подготовка к аудиту..." : "Preparing audit...",
        time: now(),
      };
      addLog(firstLog);

      // Create the saved audit record immediately so the sidebar shows it
      // as "Идёт" while the SSE stream is in flight. We capture its id and
      // use it as the single source of truth for every later save during
      // this run, regardless of where the user is looking in the workspace.
      const initialSnapshot = buildSavedAuditSnapshot(get(), "running");
      if (initialSnapshot) {
        persistImmediateRunning(initialSnapshot);
        currentRunAuditId = initialSnapshot.id;
        set({ activeSavedAuditId: initialSnapshot.id });
      }

      // The saved-audit record we are appending to. Recomputed each call
      // because the in-memory `savedAudits` list is the truth we read from
      // to keep this self-consistent (e.g. after `pruneOrphans` trimming).
      const appendToRunningSaved = (log: LogEntry) =>
        updateRunningSavedAudit((audit) => {
          const nextLogs = [...audit.logs, log].slice(
            -MAX_SAVED_LOG_ENTRIES_PER_AUDIT
          );
          return {
            ...audit,
            logs: nextLogs,
            logCount: nextLogs.length,
            status: "running",
            updatedAt: nowIso(),
          };
        });

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            language,
            debugMode,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let message = `Audit request failed (HTTP ${res.status})`;
          try {
            const data = (await res.json()) as { error?: unknown };
            if (typeof data?.error === "string" && data.error.trim()) {
              message = data.error;
            }
          } catch {
            // Body was not JSON; keep the generic message.
          }
          throw new Error(message);
        }

        if (!res.body) throw new Error("No response stream");

        let terminalReceived = false;

        await consumeSSE(res.body, {
          onStatus: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            const log: LogEntry = { type: "status", message: p.message, phase: p.phase, time: now() };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
          },
          onTool: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            const log: LogEntry = { type: "tool", name: p.name, args: p.args, time: now() };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
          },
          onToolError: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            const log: LogEntry = {
              type: "tool_error",
              name: p.name,
              args: p.args,
              error: p.error,
              time: now(),
            };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
          },
          onToolEnd: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            const log: LogEntry = {
              type: "tool_end",
              name: p.name,
              ok: p.ok,
              durationMs: p.durationMs,
              bytes: p.bytes,
              error: p.error,
              time: now(),
            };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
          },
          onDebug: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            const log: LogEntry = {
              type: "debug",
              message: p.message,
              data: p.data,
              time: now(),
            };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
          },
          onScreenshot: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            // Persist the base64 payload to IndexedDB so saved audits can
            // reference the same blob.
            const blob = base64ToBlob(p.base64, p.mimeType);
            const imageId = p.id;
            if (blob) {
              void saveAuditImage(imageId, blob);
            }
            const sourceLabel =
              p.source ??
              (p.profile
                ? `responsive rendering · ${p.profile}`
                : "screenshot");
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
            updateRunningSavedAudit((audit) => {
              const nextScreenshots = [
                ...audit.screenshots,
                toSavedScreenshotMeta(nextShot),
              ].slice(-MAX_SAVED_SCREENSHOTS_PER_AUDIT);
              const nextReportImages = [
                ...audit.reportImages,
                toSavedImageMeta(reportImage),
              ].slice(-MAX_SAVED_REPORT_IMAGES_PER_AUDIT);
              return {
                ...audit,
                screenshots: nextScreenshots,
                reportImages: nextReportImages,
                screenshotCount: nextScreenshots.length,
                reportImageCount: nextReportImages.length,
                status: "running",
                updatedAt: nowIso(),
              };
            });
            if (isViewingLiveRun()) {
              set((s) => ({
                screenshots: [...s.screenshots, nextShot].slice(-MAX_SCREENSHOTS),
                reportImages: [...s.reportImages, reportImage].slice(-MAX_REPORT_IMAGES),
              }));
            }
          },
          onReportImage: (p) => {
            if (terminalReceived) return;
            if (runId !== id) return;
            // Dedupe by kind+source+url. Remote (OG/Twitter) entries
            // keep their original URL; no IndexedDB write is required.
            const liveAudit = get().savedAudits.find(
              (entry) => entry.id === currentRunAuditId
            );
            if (
              liveAudit?.reportImages.some(
                (image) =>
                  image.kind === p.kind &&
                  image.source === p.source &&
                  image.url === p.url
              )
            ) {
              return;
            }
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
            updateRunningSavedAudit((audit) => {
              const nextReportImages = [
                ...audit.reportImages,
                toSavedImageMeta(next),
              ].slice(-MAX_SAVED_REPORT_IMAGES_PER_AUDIT);
              return {
                ...audit,
                reportImages: nextReportImages,
                reportImageCount: nextReportImages.length,
                status: "running",
                updatedAt: nowIso(),
              };
            });
            if (isViewingLiveRun()) {
              set((s) => ({
                reportImages: [...s.reportImages, next].slice(-MAX_REPORT_IMAGES),
              }));
            }
          },
          onError: (p) => {
            if (terminalReceived) return;
            // If this run was already superseded, do not let the late
            // error event clobber the new active saved audit.
            if (runId !== id) return;
            terminalReceived = true;
            const log: LogEntry = { type: "error", message: p.message, time: now() };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
            persistTerminalSnapshot({ liveError: p.message }, "failed");
          },
          onDone: (p) => {
            if (runId !== id) return;
            terminalReceived = true;
            const log: LogEntry = {
              type: "status",
              message: language === "ru" ? "Отчёт готов" : "Report ready",
              phase: "report",
              time: now(),
            };
            appendToRunningSaved(log);
            if (isViewingLiveRun()) addLog(log);
            persistTerminalSnapshot(
              { report: p.report, reportOpen: false },
              "completed"
            );
          },
        });
      } catch (err) {
        const isAbortLike =
          err instanceof Error &&
          (err.name === "AbortError" ||
            /abort|canceled|cancelled|networkerror|load failed|failed to fetch/i.test(err.message));
        if (isAbortLike) {
          // Aborts triggered by cancelBackgroundRun / newAudit / superseded
          // runAudit have already persisted the "interrupted" snapshot, so
          // there is nothing more to do here. A real network abort while
          // this run is still current gets persisted as "interrupted" too.
          if (runId === id) {
            persistTerminalSnapshot({}, "interrupted");
          }
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        if (runId === id) {
          const log: LogEntry = { type: "error", message: msg, time: now() };
          appendToRunningSaved(log);
          if (isViewingLiveRun()) addLog(log);
          persistTerminalSnapshot({ liveError: msg }, "failed");
        }
      } finally {
        if (runId === id) {
          currentRunAuditId = null;
          set({ running: false, backgroundRunActive: false });
          abortController = null;
        }
      }
    },
  };
});

// Helper used elsewhere when we need to drop the saved-audit image cache.
// Exposed for future use; not referenced by the rest of the codebase yet.
export const purgeAuditImageById = deleteAuditImage;
