type LogoMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Distinctive inline mark for Seofriendly: a stylised site-map tree
 * (root + two child nodes) inside a rounded square, with a magnifier
 * corner piece that hints at "diagnostics". Pure SVG, no external
 * assets, no raster.
 */
export function LogoMark({ className, size = 28 }: LogoMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] bg-ink text-paper ${className ?? ""}`}
      style={{ width: size + 12, height: size + 12 }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="26" height="24" rx="4" />
        <rect x="7.5" y="8" width="6" height="4.5" rx="1" fill="currentColor" stroke="none" />
        <line x1="10.5" y1="12.5" x2="7.5" y2="17" />
        <line x1="10.5" y1="12.5" x2="14" y2="17" />
        <rect x="5.5" y="17" width="4.5" height="4" rx="1" fill="none" />
        <rect x="12" y="17" width="4.5" height="4" rx="1" fill="none" />
        <circle cx="23" cy="22" r="4.2" fill="var(--color-paper)" stroke="currentColor" />
        <line x1="26" y1="25" x2="28.5" y2="27.5" stroke="currentColor" />
      </svg>
    </span>
  );
}
