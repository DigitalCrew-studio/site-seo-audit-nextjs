import * as React from "react";

type Tone = "neutral" | "accent" | "positive" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line bg-paper text-muted",
  accent: "border-accent/30 bg-accent-soft text-accent",
  positive: "border-positive/30 bg-positive/10 text-positive",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
