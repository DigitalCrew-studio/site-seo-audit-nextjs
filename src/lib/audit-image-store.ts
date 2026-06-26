// Browser-only IndexedDB helpers used by saved audits to persist large
// screenshot/report images without filling localStorage. No external deps.

const DB_NAME = "seo-audit-images";
const DB_VERSION = 1;
const STORE_NAME = "images";

type OpenDb = Promise<IDBDatabase>;

let dbPromise: OpenDb | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): OpenDb {
  if (!isBrowser()) {
    return Promise.reject(new Error("indexeddb_unavailable: IndexedDB is not available in this environment."));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      dbPromise = null;
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("indexeddb_open_failed"));
    };
    req.onblocked = () => {
      // Another tab is holding the old version open. Best-effort: still let
      // onsuccess fire if the other tab releases it; otherwise reject.
      dbPromise = null;
      reject(new Error("indexeddb_blocked: another tab is using an older schema version."));
    };
  });
  return dbPromise;
}

function runTxn(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => void
): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        let tx: IDBTransaction;
        try {
          tx = db.transaction(STORE_NAME, mode);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }
        const store = tx.objectStore(STORE_NAME);
        try {
          work(store);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error ?? new Error("indexeddb_tx_aborted"));
        tx.onerror = () => reject(tx.error ?? new Error("indexeddb_tx_error"));
      })
  );
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexeddb_request_failed"));
  });
}

/**
 * Best-effort: store a blob under the given id. Resolves to `true` on
 * success, `false` if the environment has no IndexedDB or the write fails.
 * Never throws to callers that should keep the UI working on storage errors.
 */
export async function saveAuditImage(id: string, blob: Blob): Promise<boolean> {
  if (!id || !blob) return false;
  if (!isBrowser()) return false;
  try {
    await runTxn("readwrite", (store) => {
      store.put({ id, blob, storedAt: Date.now() });
    });
    return true;
  } catch {
    return false;
  }
}

/** Load a previously stored image as a Blob, or null when missing/unavailable. */
export async function loadAuditImage(id: string): Promise<Blob | null> {
  if (!id) return null;
  if (!isBrowser()) return null;
  try {
    const db = await openDb();
    const result = await reqAsPromise(
      db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id)
    );
    if (result && typeof result === "object" && "blob" in result) {
      const blob = (result as { blob?: unknown }).blob;
      if (blob instanceof Blob) return blob;
    }
    return null;
  } catch {
    return null;
  }
}

/** Delete a single image by id. No-op when not found or unavailable. */
export async function deleteAuditImage(id: string): Promise<void> {
  if (!id) return;
  if (!isBrowser()) return;
  try {
    await runTxn("readwrite", (store) => {
      store.delete(id);
    });
  } catch {
    // best-effort cleanup
  }
}

/** Delete many images in a single transaction. */
export async function deleteAuditImages(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  if (!isBrowser()) return;
  const unique = Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)));
  if (unique.length === 0) return;
  try {
    await runTxn("readwrite", (store) => {
      for (const id of unique) {
        store.delete(id);
      }
    });
  } catch {
    // best-effort cleanup
  }
}

/**
 * Convert a base64 payload (with or without a `data:` prefix) to a Blob.
 * Returns undefined when the payload is empty or decoding fails.
 */
export function base64ToBlob(base64: string, mimeType?: string): Blob | undefined {
  if (typeof base64 !== "string" || base64.length === 0) return undefined;
  const commaIndex = base64.indexOf(",");
  const b64 = commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64;
  if (!b64) return undefined;
  let binary: string;
  try {
    if (typeof atob === "function") {
      binary = atob(b64);
    } else if (typeof Buffer !== "undefined") {
      binary = Buffer.from(b64, "base64").toString("binary");
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const resolvedType = mimeType && mimeType.length > 0 ? mimeType : "image/png";
  try {
    return new Blob([bytes], { type: resolvedType });
  } catch {
    return undefined;
  }
}
