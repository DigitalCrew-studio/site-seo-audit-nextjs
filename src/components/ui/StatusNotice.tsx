import * as React from "react";

type Tone = "info" | "warning" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  info: "border-line bg-paper/60 text-ink",
  warning: "border-accent/30 bg-accent-soft text-ink",
  success: "border-positive/30 bg-positive/10 text-ink",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export interface StatusNoticeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: Tone;
  icon?: React.ReactNode;
  heading?: React.ReactNode;
}

export function StatusNotice({
  className,
  tone = "info",
  icon,
  heading,
  children,
  ...props
}: StatusNoticeProps) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-[13px] leading-relaxed",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        {heading ? <p className="font-medium text-ink">{heading}</p> : null}
        {children ? <div className={heading ? "mt-1 text-muted" : "text-muted"}>{children}</div> : null}
      </div>
    </div>
  );
}
