"use client";

import * as React from "react";

const selectBase =
  "w-full min-w-0 rounded-[10px] border border-line bg-surface text-ink " +
  "min-h-[2.875rem] px-3.5 py-3 text-sm leading-5 " +
  "transition-[border-color,box-shadow] duration-150 ease-out " +
  "focus:outline-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(27,27,25,0.08)] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={[selectBase, className].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </select>
    );
  }
);
