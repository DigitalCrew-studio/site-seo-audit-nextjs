import * as React from "react";

export interface FieldLabelProps {
  children: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
}

export function FieldLabel({ children, hint, htmlFor }: FieldLabelProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="eyebrow text-muted">
        {children}
      </label>
      {hint ? <span className="eyebrow text-faint">{hint}</span> : null}
    </div>
  );
}
