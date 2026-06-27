"use client";

import * as React from "react";

type Variant = "primary" | "secondary";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg whitespace-nowrap " +
  "min-h-[3rem] px-5 py-2.5 text-sm transition " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink font-semibold text-paper hover:bg-ink-soft",
  secondary:
    "border border-line-strong bg-paper font-medium text-ink-soft hover:bg-line hover:text-ink",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      loading = false,
      disabled,
      type,
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[base, variantClasses[variant], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  }
);
