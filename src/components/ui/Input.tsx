"use client";

import * as React from "react";

const inputBase =
  "w-full min-w-0 rounded-[10px] border border-line bg-surface text-ink placeholder:text-faint " +
  "min-h-[2.875rem] py-3 text-sm leading-5 " +
  "transition-[border-color,box-shadow] duration-150 ease-out " +
  "focus:outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(27,27,25,0.08)] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  inputClassName?: string;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      inputClassName,
      leftSlot,
      rightSlot,
      invalid,
      ...props
    },
    ref
  ) {
    const paddingClass = [
      leftSlot ? "pl-10" : "pl-3.5",
      rightSlot ? "pr-11" : "pr-3.5",
    ].join(" ");

    return (
      <div
        className={[
          "relative w-full",
          invalid ? "[&_input]:border-red-300" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leftSlot ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-muted">
            {leftSlot}
          </span>
        ) : null}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={[inputBase, paddingClass, inputClassName]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {rightSlot ? (
          <span className="absolute inset-y-0 right-1.5 z-10 flex items-center text-muted">
            {rightSlot}
          </span>
        ) : null}
      </div>
    );
  }
);
