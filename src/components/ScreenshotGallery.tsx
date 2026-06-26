"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Image as ImageIcon, X } from "lucide-react";
import { useAuditStore } from "@/store/auditStore";
import { loadAuditImage } from "@/lib/audit-image-store";
import type { ScreenshotEntry } from "@/lib/types";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

function truncateUrl(url: string, max = 56): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + "…";
}

/**
 * Resolves a screenshot entry to a usable image URL.
 *
 * The current store always persists screenshots as IndexedDB blobs identified
 * by `imageId`; this hook loads the blob on demand and produces a revoked
 * object URL. The hook returns `null` while loading and when the resolved
 * image is for a different id than the one currently requested.
 */
function useScreenshotSrc(shot: ScreenshotEntry): string | null {
  const [resolved, setResolved] = useState<{ imageId: string; url: string } | null>(null);

  useEffect(() => {
    if (shot.storage !== "indexeddb" || !shot.imageId) {
      return undefined;
    }
    let revoked = false;
    let createdUrl: string | null = null;
    loadAuditImage(shot.imageId).then((blob) => {
      if (revoked || !blob) return;
      try {
        createdUrl = URL.createObjectURL(blob);
        setResolved({ imageId: shot.imageId ?? "", url: createdUrl });
      } catch {
        // IndexedDB blob could not be turned into an object URL.
      }
    });
    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [shot.imageId, shot.storage]);

  if (shot.storage === "memory") return null;
  if (resolved && shot.imageId && resolved.imageId === shot.imageId) return resolved.url;
  return null;
}

function ShotThumb({ shot }: { shot: ScreenshotEntry }) {
  const src = useScreenshotSrc(shot);
  return (
    <button
      type="button"
      onClick={() => {
        const evt = new CustomEvent("open-screenshot", { detail: shot.id });
        window.dispatchEvent(evt);
      }}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-transparent text-left transition hover:border-line-strong hover:bg-surface/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-line/30">
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element -- object URL from IndexedDB, not optimizable by next/image */
          <img
            src={src}
            alt={shot.url ?? "Screenshot"}
            className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[11px] text-faint">
            loading…
          </div>
        )}
      </div>
      <div className="space-y-1 px-3 py-2">
        <p
          className="truncate font-mono text-[12px] text-ink-soft"
          title={shot.url ?? "(current page)"}
        >
          {shot.url ? truncateUrl(shot.url) : "(current page)"}
        </p>
        <div className="flex items-center justify-between font-mono text-[11px] text-faint">
          <span>{formatTime(shot.takenAt)}</span>
          <span>{formatBytes(shot.bytes)}</span>
        </div>
      </div>
    </button>
  );
}

function Lightbox({ shot, onClose }: { shot: ScreenshotEntry; onClose: () => void }) {
  const src = useScreenshotSrc(shot);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot preview"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-line-strong bg-surface px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5 text-ink">
            <ImageIcon className="h-4 w-4 shrink-0 text-muted" />
            <span
              className="truncate font-mono text-sm text-ink-soft"
              title={shot.url ?? "(current page)"}
            >
              {shot.url ?? "(current page)"}
            </span>
            <span className="eyebrow shrink-0 text-faint">
              {formatBytes(shot.bytes)}
            </span>
            <span className="eyebrow shrink-0 text-faint">
              {formatTime(shot.takenAt)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            Close
            <span className="eyebrow rounded border border-line px-1 py-0.5 text-faint">
              esc
            </span>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="terminal-scroll flex-1 overflow-auto rounded-b-xl border border-line-strong bg-black p-4">
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element -- object URL from IndexedDB, not optimizable by next/image */
            <img
              src={src}
              alt={shot.url ?? "Screenshot"}
              className="mx-auto block max-w-full"
              decoding="async"
            />
          ) : (
            <div className="flex h-32 items-center justify-center font-mono text-[12px] text-faint">
              loading…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScreenshotGallery() {
  const { screenshots } = useAuditStore(
    useShallow((s) => ({ screenshots: s.screenshots }))
  );
  const [openId, setOpenId] = useState<string | null>(null);

  // `openShot` is derived; if the id is stale (e.g. screenshots reset on a
  // new audit run) this simply resolves to null and the lightbox stays closed.
  const openShot = useMemo(
    () => screenshots.find((s) => s.id === openId) ?? null,
    [screenshots, openId]
  );

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") setOpenId(detail);
    };
    window.addEventListener("open-screenshot", onOpen as EventListener);
    return () =>
      window.removeEventListener("open-screenshot", onOpen as EventListener);
  }, []);

  if (screenshots.length === 0) return null;

  return (
    <section className="border-y border-line py-4">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted" />
        <span className="eyebrow text-muted">screenshots</span>
        <span className="eyebrow text-faint">— {screenshots.length}</span>
        <span className="eyebrow ml-auto text-faint">
          omitted from model context
        </span>
      </div>

      {/* Body */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {screenshots.map((shot) => (
          <ShotThumb key={shot.id} shot={shot} />
        ))}
      </div>

      {/* Lightbox preview */}
      {openShot && <Lightbox shot={openShot} onClose={() => setOpenId(null)} />}
    </section>
  );
}
