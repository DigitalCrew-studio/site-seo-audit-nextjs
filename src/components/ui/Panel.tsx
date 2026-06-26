import * as React from "react";

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "aside" | "div";
}

export function Panel({ as: Tag = "section", className, ...props }: PanelProps) {
  return (
    <Tag
      className={[
        "overflow-hidden rounded-xl border border-line bg-surface",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export interface PanelHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  title,
  description,
  meta,
  action,
  className,
}: PanelHeaderProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
          {meta}
        </div>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PanelBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["p-5 sm:p-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
