import { LogoMarkSvg } from "@/components/LogoMarkSvg";

type LogoMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Distinctive inline mark for Seofriendly: a stylised site-map tree
 * (root + two child nodes) inside a rounded square, with a magnifier
 * corner piece that hints at "diagnostics". Composes `LogoMarkSvg` with
 * a square surface wrapper; the SVG itself is reusable elsewhere
 * (notably in `ImageResponse` for OG/Twitter cards).
 */
export function LogoMark({ className, size = 28 }: LogoMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] bg-ink text-paper ${className ?? ""}`}
      style={{ width: size + 12, height: size + 12 }}
      aria-hidden="true"
    >
      <LogoMarkSvg size={size} />
    </span>
  );
}
