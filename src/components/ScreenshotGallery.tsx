"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Image as ImageIcon, X } from "lucide-react";
import { useAuditStore } from "@/store/auditStore";
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

function dataUrlFor(shot: ScreenshotEntry): string {
  return `data:${shot.mimeType};base64,${shot.base64}`;
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
    if (!openShot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openShot]);

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
          <button
            key={shot.id}
            type="button"
            onClick={() => setOpenId(shot.id)}
            className="group flex flex-col overflow-hidden rounded-lg border border-line bg-transparent text-left transition hover:border-line-strong hover:bg-surface/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-line/30">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, not optimizable by next/image */}
              <img
                src={dataUrlFor(shot)}
                alt={shot.url ?? "Screenshot"}
                className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
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
        ))}
      </div>

      {/* Lightbox preview */}
      {openShot && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot preview"
          onClick={() => setOpenId(null)}
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
                  title={openShot.url ?? "(current page)"}
                >
                  {openShot.url ?? "(current page)"}
                </span>
                <span className="eyebrow shrink-0 text-faint">
                  {formatBytes(openShot.bytes)}
                </span>
                <span className="eyebrow shrink-0 text-faint">
                  {formatTime(openShot.takenAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
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
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, not optimizable by next/image */}
              <img
                src={dataUrlFor(openShot)}
                alt={openShot.url ?? "Screenshot"}
                className="mx-auto block max-w-full"
                decoding="async"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
