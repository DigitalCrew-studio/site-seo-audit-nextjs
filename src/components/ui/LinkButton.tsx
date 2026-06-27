import Link from "next/link";
import type { LinkProps } from "next/link";
import * as React from "react";

type Variant = "primary" | "secondary" | "outline" | "inverse";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg whitespace-nowrap " +
  "min-h-[3rem] px-5 py-2.5 text-sm font-semibold transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary:
    "border border-line-strong bg-surface text-ink-soft hover:border-ink hover:text-ink",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  inverse: "bg-paper text-ink hover:bg-accent-soft",
};

export interface LinkButtonProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: Variant;
}

export function LinkButton({
  className,
  variant = "primary",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={[base, variantClasses[variant], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Link>
  );
}
