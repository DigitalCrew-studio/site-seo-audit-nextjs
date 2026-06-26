type LogoMarkSvgProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * The Seofriendly site-map tree + magnifier mark, as a single SVG. Designed
 * to render both on the live site (where `--color-paper` is the surrounding
 * surface colour and the magnifier blends into it) and inside `ImageResponse`
 * (where CSS variables are not defined, so the inline fallback kicks in).
 */
const PAPER_FALLBACK = "#f6f5f1";

export function LogoMarkSvg({
  size = 32,
  className,
  title,
}: LogoMarkSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <rect x="3" y="4" width="26" height="24" rx="4" />
      <rect
        x="7.5"
        y="8"
        width="6"
        height="4.5"
        rx="1"
        fill="currentColor"
        stroke="none"
      />
      <line x1="10.5" y1="12.5" x2="7.5" y2="17" />
      <line x1="10.5" y1="12.5" x2="14" y2="17" />
      <rect x="5.5" y="17" width="4.5" height="4" rx="1" fill="none" />
      <rect x="12" y="17" width="4.5" height="4" rx="1" fill="none" />
      <circle
        cx="23"
        cy="22"
        r="4.2"
        fill={`var(--color-paper, ${PAPER_FALLBACK})`}
        stroke="currentColor"
      />
      <line x1="26" y1="25" x2="28.5" y2="27.5" stroke="currentColor" />
    </svg>
  );
}
