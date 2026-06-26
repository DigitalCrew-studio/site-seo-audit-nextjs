export type OpenCodeGroup = "go" | "zen";

export type ModelInfo = { id: string; name: string };

export type AuditLanguage = "en" | "ru";

export type AuditRequest = {
  apiKey: string;
  modelId: string;
  group: OpenCodeGroup;
  url: string;
  language: AuditLanguage;
  /**
   * Whether the client wants to surface debug-level events. The server always
   * emits the same structured events; the client filters them for display.
   */
  debugMode?: boolean;
};

// ----- SSE payload shapes (server -> client) -----
export type SSEStatus = { message: string; phase?: string };
export type SSETool = { name: string; args: Record<string, unknown> };
export type SSEToolError = {
  name: string;
  args: Record<string, unknown>;
  error: string;
};
export type SSEToolEnd = {
  name: string;
  ok: boolean;
  durationMs: number;
  bytes: number;
  error?: string;
};
export type SSEDebug = { message: string; data?: Record<string, unknown> };
export type SSEReport = { report: string };
export type SSEError = { message: string };

export type SSEReportImage = {
  id: string;
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
};

/**
 * Metadata-only shape for a captured screenshot. The full base64 payload is
 * intentionally NOT stored in this shape; it is persisted in IndexedDB under
 * `imageId` and reconstructed via a Blob + object URL on demand.
 */
export type ScreenshotEntry = {
  id: string;
  url?: string;
  mimeType: string;
  bytes: number;
  takenAt: string;
  storage: "indexeddb" | "memory";
  imageId?: string;
  source?: string;
  profile?: "desktop" | "laptop" | "tablet" | "mobile";
  viewport?: { width: number; height: number };
};

/**
 * Metadata-only report image. `storage` distinguishes remote (OG / Twitter
 * URLs, etc.) from in-app screenshots that live in IndexedDB.
 */
export type ReportImageEntry = {
  id: string;
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
  storage: "remote" | "indexeddb" | "memory";
  imageId?: string;
  profile?: "desktop" | "laptop" | "tablet" | "mobile";
  viewport?: { width: number; height: number };
};

/**
 * Emitted by the server when `take_screenshot` succeeds, or per profile by
 * `inspect_responsive_rendering` / `inspect_mobile_rendering`. The full
 * base64 payload is included for the UI gallery; the model context
 * deliberately omits it (see `shapeToolResult` in `src/lib/audit.ts`).
 */
export type SSEScreenshot = {
  id: string;
  url?: string;
  mimeType: string;
  base64: string;
  bytes: number;
  takenAt: string;
  source?: string;
  profile?: "desktop" | "laptop" | "tablet" | "mobile";
  viewport?: { width: number; height: number };
};

// ----- Client log entries (derived from SSE events) -----
// Existing variants stay backward compatible. New `debug` and `tool_end`
// entries are always stored; the UI hides them when debugMode is off.
export type LogEntry =
  | { type: "status"; message: string; phase?: string; time: string }
  | { type: "tool"; name: string; args: Record<string, unknown>; time: string }
  | { type: "tool_error"; name: string; args: Record<string, unknown>; error: string; time: string }
  | { type: "tool_end"; name: string; ok: boolean; durationMs: number; bytes: number; error?: string; time: string }
  | { type: "debug"; message: string; data?: Record<string, unknown>; time: string }
  | { type: "error"; message: string; time: string };
