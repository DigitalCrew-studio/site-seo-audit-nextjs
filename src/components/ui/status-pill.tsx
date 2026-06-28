import type { ReactNode } from "react";

export type PillTone = "positive" | "accent" | "danger" | "muted";

export const PILL_TONE_BG: Record<PillTone, string> = {
  positive: "bg-positive/5",
  accent: "bg-accent/5",
  danger: "bg-red-50/70",
  muted: "bg-paper/60",
};

export const PILL_TONE_BORDER: Record<PillTone, string> = {
  positive: "border-positive/20",
  accent: "border-accent/20",
  danger: "border-red-200",
  muted: "border-line",
};

export const PILL_TONE_TEXT: Record<PillTone, string> = {
  positive: "text-positive",
  accent: "text-accent",
  danger: "text-red-700",
  muted: "text-muted",
};

export const PILL_TONE_TEXT_DOT: Record<PillTone, string> = {
  positive: "bg-positive",
  accent: "bg-accent",
  danger: "bg-red-500",
  muted: "bg-faint",
};

export function StatusPill({
  tone,
  pulse = false,
  children,
}: {
  tone: PillTone;
  pulse?: boolean;
  children: ReactNode;
}) {
  const dotClass = {
    positive: "bg-positive",
    accent: "bg-accent",
    danger: "bg-red-500",
    muted: "bg-faint",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${PILL_TONE_BG[tone]} ${PILL_TONE_BORDER[tone]} ${PILL_TONE_TEXT[tone]}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass} ${
          pulse ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper/60 px-2 py-0.5 text-[11px] font-medium text-muted">
      {children}
    </span>
  );
}

export function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
        active
          ? "border-ink/15 bg-ink/5 text-ink"
          : "border-line bg-transparent text-faint hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
