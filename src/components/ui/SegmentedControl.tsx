"use client";

import * as React from "react";

export interface SegmentedOption<V extends string> {
  value: V;
  label: React.ReactNode;
}

export interface SegmentedControlProps<V extends string> {
  value: V;
  onChange: (value: V) => void;
  options: ReadonlyArray<SegmentedOption<V>>;
  labelClassName?: string;
  ariaLabel?: string;
}

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  labelClassName,
  ariaLabel,
}: SegmentedControlProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid w-full gap-0 rounded-lg border border-line bg-surface p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={[
              "inline-flex min-h-[2.5rem] items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              selected
                ? "bg-ink text-paper"
                : "text-muted hover:bg-paper hover:text-ink-soft",
            ].join(" ")}
          >
            <span className={labelClassName}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
