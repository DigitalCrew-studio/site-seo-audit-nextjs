export type OpenCodeGroup = "go" | "zen";

export type ModelInfo = { id: string; name: string };

export type AuditLanguage = "en" | "ru";

export type AuditRequest = {
  apiKey: string;
  modelId: string;
  group: OpenCodeGroup;
  url: string;
  language: AuditLanguage;
};

// ----- SSE payload shapes (server -> client) -----
export type SSEStatus = { message: string };
export type SSETool = { name: string; args: Record<string, unknown> };
export type SSEToolError = {
  name: string;
  args: Record<string, unknown>;
  error: string;
};
export type SSEReport = { report: string };
export type SSEError = { message: string };

// ----- Client log entries (derived from SSE events) -----
export type LogEntry =
  | { type: "status"; message: string; time: string }
  | { type: "tool"; name: string; args: Record<string, unknown>; time: string }
  | { type: "tool_error"; name: string; args: Record<string, unknown>; error: string; time: string }
  | { type: "error"; message: string; time: string };
