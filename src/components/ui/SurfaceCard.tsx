import * as React from "react";

type Tone = "surface" | "paper" | "accent" | "ink";

const toneClasses: Record<Tone, string> = {
  surface: "border-line bg-surface text-ink",
  paper: "border-line bg-paper/60 text-ink",
  accent: "border-accent/20 bg-accent-soft text-ink",
  ink: "border-ink bg-ink text-paper",
};

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

export function SurfaceCard({
  className,
  tone = "surface",
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={["rounded-xl border", toneClasses[tone], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
