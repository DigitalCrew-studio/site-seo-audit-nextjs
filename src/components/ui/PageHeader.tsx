import * as React from "react";

export interface PageHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div className={["mb-6", className].filter(Boolean).join(" ")}>
      {eyebrow ? <span className="eyebrow text-accent">{eyebrow}</span> : null}
      <h1 className={eyebrow ? "mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]" : "text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]"}>
        {title}
      </h1>
      {description ? (
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
