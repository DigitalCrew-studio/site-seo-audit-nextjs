import { getModelsUrl } from "@/lib/opencode";

const FREE_NAME_RE = /(?:^|[-_\s])free(?:$|[-_\s])/i;
const DEFAULT_ROUTE_ENV = "AI_DEFAULT_ROUTE";
const MODELS_TIMEOUT_MS = 15_000;

export type DiscoveredModel = {
  id: string;
  name: string;
};

export class ZenModelsError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ZenModelsError";
  }
}

function pricingValueStatus(value: unknown): "free" | "paid" | "unknown" {
  if (value === undefined || value === null) return "unknown";
  if (typeof value === "number") return value === 0 ? "free" : "paid";
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "" || lower === "free") return lower === "free" ? "free" : "unknown";
    const normalized = lower.replace(/[$,]/g, "");
    const num = Number(normalized);
    if (Number.isFinite(num)) return num === 0 ? "free" : "paid";
  }
  return "unknown";
}

function isExplicitlyFree(record: Record<string, unknown>): boolean | undefined {
  for (const key of ["free", "isFree", "is_free"]) {
    const v = record[key];
    if (typeof v === "boolean") return v;
  }
  const pricing = record.pricing;
  if (pricing && typeof pricing === "object" && !Array.isArray(pricing)) {
    const p = pricing as Record<string, unknown>;
    const paidFields: unknown[] = [];
    for (const key of [
      "input",
      "output",
      "prompt",
      "completion",
      "request",
      "image",
      "audio",
      "cached_read",
      "cachedRead",
      "cached_write",
      "cachedWrite",
    ]) {
      if (key in p) paidFields.push(p[key]);
    }
    if (paidFields.length > 0) {
      const statuses = paidFields.map(pricingValueStatus);
      if (statuses.some((status) => status === "paid")) return false;
      if (statuses.every((status) => status === "free")) return true;
    }
  }
  return undefined;
}

function looksLikeFreeName(id: string, name: string): boolean {
  return FREE_NAME_RE.test(id) || FREE_NAME_RE.test(name);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function modelFromRecord(record: Record<string, unknown>): DiscoveredModel | undefined {
  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (!id) return undefined;
  const name = typeof record.name === "string" && record.name.trim().length > 0
    ? record.name.trim()
    : id;
  return { id, name };
}

function isFreeModel(record: Record<string, unknown>): boolean {
  const explicit = isExplicitlyFree(record);
  if (explicit !== undefined) return explicit;
  const id = typeof record.id === "string" ? record.id : "";
  const name = typeof record.name === "string" ? record.name : id;
  return looksLikeFreeName(id, name);
}

function dedupeOrdered(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function pickIdsFromData(data: unknown): string[] {
  if (Array.isArray(data)) {
    return pickFreeIdsFromArray(data);
  }
  const root = asRecord(data);
  if (!root) return [];
  const dataArray = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.models)
      ? root.models
      : null;
  if (!dataArray) return [];

  return pickFreeIdsFromArray(dataArray);
}

function pickFreeIdsFromArray(dataArray: unknown[]): string[] {
  const free: DiscoveredModel[] = [];
  for (const entry of dataArray) {
    const record = asRecord(entry);
    if (!record) continue;
    if (!isFreeModel(record)) continue;
    const model = modelFromRecord(record);
    if (model) free.push(model);
  }

  return dedupeOrdered(free.map((m) => m.id));
}

function applyDefaultFirst(ids: string[]): string[] {
  const preferred = (process.env[DEFAULT_ROUTE_ENV] ?? "").trim();
  if (!preferred) return ids;
  if (!ids.includes(preferred)) return ids;
  return [preferred, ...ids.filter((id) => id !== preferred)];
}

export async function fetchFreeZenModelIds(apiKey: string): Promise<string[]> {
  const url = getModelsUrl("zen");
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(MODELS_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new ZenModelsError(`Models endpoint returned HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => null);
  const ids = pickIdsFromData(data);
  return applyDefaultFirst(ids);
}
