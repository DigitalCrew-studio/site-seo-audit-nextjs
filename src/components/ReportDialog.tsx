"use client";

import { useEffect, useMemo, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import type { ReportImageEntry } from "@/lib/types";

const markdownComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="audit-table-scroll">
      <table {...props}>{children}</table>
    </div>
  ),
};

function formatBytes(bytes?: number): string {
  if (!Number.isFinite(bytes) || !bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function truncateUrl(url: string, max = 72): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + "…";
}

function imageMeta(image: ReportImageEntry): string {
  const parts = [
    image.status ? String(image.status) : "",
    image.width && image.height ? `${image.width}×${image.height}` : "",
    formatBytes(image.bytes),
    image.mimeType,
  ].filter(Boolean);
  return parts.join(" · ");
}

function VisualEvidence({
  images,
  language,
}: {
  images: ReportImageEntry[];
  language: "en" | "ru";
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openImage = useMemo(
    () => images.find((image) => image.id === openId) ?? null,
    [images, openId]
  );

  useEffect(() => {
    if (!openImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openImage]);

  if (images.length === 0) return null;

  const title = language === "ru" ? "Визуальные материалы" : "Visual evidence";
  const note = language === "ru"
    ? "Изображения не отправлялись в контекст модели."
    : "Images were not sent to the model context.";
  const closeLabel = language === "ru" ? "Закрыть" : "Close";

  return (
    <section className="mt-8 border-t border-line pt-6">
      <div className="mb-3 flex items-center gap-2 text-ink">
        <ImageIcon className="h-4 w-4 text-muted" />
        <h2 className="m-0 text-base font-semibold">{title}</h2>
        <span className="eyebrow ml-auto text-faint">{note}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenId(image.id)}
            className="group overflow-hidden rounded-lg border border-line bg-transparent text-left transition hover:border-line-strong hover:bg-paper/55"
          >
            <div className="aspect-video overflow-hidden bg-line/30">
              {/* eslint-disable-next-line @next/next/no-img-element -- report evidence may be data URLs or external OG URLs */}
              <img
                src={image.url}
                alt={image.alt ?? image.source}
                className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-[1.015]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-1.5 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                  {image.kind}
                </span>
                <span className="truncate text-xs font-medium text-ink-soft" title={image.source}>
                  {image.source}
                </span>
              </div>
              <p className="truncate font-mono text-[11px] text-muted" title={image.pageUrl ?? image.url}>
                {truncateUrl(image.pageUrl ?? image.url)}
              </p>
              {imageMeta(image) && (
                <p className="font-mono text-[11px] text-faint">{imageMeta(image)}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {openImage && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-ink/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpenId(null)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-line-strong bg-surface px-5 py-3">
              <div className="min-w-0 text-sm text-ink-soft">
                <div className="truncate font-mono" title={openImage.pageUrl ?? openImage.url}>
                  {openImage.pageUrl ?? openImage.url}
                </div>
                <div className="eyebrow mt-1 text-faint">{openImage.source} {imageMeta(openImage)}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-paper hover:text-ink"
              >
                {closeLabel}
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="terminal-scroll flex-1 overflow-auto rounded-b-xl border border-line-strong bg-black p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- report evidence may be data URLs or external OG URLs */}
              <img
                src={openImage.url}
                alt={openImage.alt ?? openImage.source}
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

export function ReportDialog() {
  const { language, report, reportImages, reportOpen, setReportOpen } = useAuditStore(
    useShallow((s) => ({
      language: s.language,
      report: s.report,
      reportImages: s.reportImages,
      reportOpen: s.reportOpen,
      setReportOpen: s.setReportOpen,
    }))
  );
  const title = language === "ru" ? "SEO-диагностика" : "SEO diagnostic report";
  const formatLabel = language === "ru" ? "markdown" : "markdown";
  const closeLabel = language === "ru" ? "Закрыть" : "Close";

  useEffect(() => {
    if (!reportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReportOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [reportOpen, setReportOpen]);

  if (!reportOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="SEO diagnostic report"
      onClick={() => setReportOpen(false)}
    >
      <div
        className="mx-auto flex h-full w-full max-w-6xl flex-col px-3 py-3 sm:px-5 sm:py-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-line-strong bg-surface px-5 py-2.5">
          <div className="flex items-center gap-2.5 text-ink">
            <FileText className="h-4 w-4 text-muted" />
            <span className="text-sm font-semibold">{title}</span>
            <span className="eyebrow ml-1 text-faint">{formatLabel}</span>
          </div>
          <button
            onClick={() => setReportOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            {closeLabel}
            <span className="eyebrow rounded border border-line px-1 py-0.5 text-faint">
              esc
            </span>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Document */}
        <div className="terminal-scroll flex-1 overflow-y-auto overflow-x-hidden rounded-b-xl border border-line-strong bg-surface shadow-2xl">
          <div className="audit-report mx-auto w-full max-w-none px-5 py-6 sm:px-8 sm:py-8">
            <div className="prose prose-stone prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {report}
              </ReactMarkdown>
              <VisualEvidence images={reportImages} language={language} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
