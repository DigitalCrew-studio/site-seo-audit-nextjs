const NUMBERED_KEY_RE = /^AI_API_KEY_\d+$/;

let cachedKeys: string[] | null = null;

function dedupeTrim(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function readNumberedKeys(): string[] {
  const matches: { index: number; value: string }[] = [];
  for (const [name, value] of Object.entries(process.env)) {
    if (!NUMBERED_KEY_RE.test(name)) continue;
    if (typeof value !== "string") continue;
    const index = Number(name.slice("AI_API_KEY_".length));
    if (!Number.isFinite(index) || index < 1) continue;
    matches.push({ index, value });
  }
  matches.sort((a, b) => a.index - b.index);
  return matches.map((m) => m.value);
}

function readKeysFromEnv(): string[] {
  const fromList = (process.env.AI_API_KEYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fromNumbered = readNumberedKeys();
  return dedupeTrim([...fromList, ...fromNumbered]);
}

export function getServerApiKeys(): string[] {
  if (cachedKeys === null) {
    cachedKeys = readKeysFromEnv();
  }
  return cachedKeys;
}

export function pickRandomApiKey(keys: string[] = getServerApiKeys()): string | undefined {
  if (keys.length === 0) return undefined;
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Resets the cached key list. Intended for tests; production code uses the
 * cached list computed once per process.
 */
export function resetServerApiKeysCache(): void {
  cachedKeys = null;
}
