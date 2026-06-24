type LogoMarkProps = {
  className?: string;
};

/** Abstract "audit lens" mark: a crosshair inside a rounded square. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-ink text-paper ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <circle cx="7" cy="7" r="4.2" />
        <path d="M10.2 10.2 13.5 13.5" strokeLinecap="round" />
        <path d="M7 1.5v1.6M7 11.4v1.6M1.5 7h1.6M11.4 7H13" strokeLinecap="round" />
      </svg>
    </span>
  );
}
