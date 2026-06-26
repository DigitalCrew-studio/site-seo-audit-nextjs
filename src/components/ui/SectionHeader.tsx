import * as React from "react";

export interface SectionHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  eyebrow,
  description,
  aside,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={[
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="max-w-2xl">
        {eyebrow ? <span className="eyebrow text-accent">{eyebrow}</span> : null}
        <h2 className={eyebrow ? "mt-2 text-xl font-semibold tracking-tight text-ink" : "text-xl font-semibold tracking-tight text-ink"}>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {aside ? <div className="text-sm text-muted">{aside}</div> : null}
    </div>
  );
}
