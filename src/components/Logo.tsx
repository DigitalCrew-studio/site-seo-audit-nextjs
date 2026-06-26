import Image, { type ImageProps } from "next/image";

type LogoProps = {
  variant?: "full" | "small";
  height: number;
  className?: string;
  /**
   * Preload the image for LCP. Uses `preload` (the Next.js 16+ replacement
   * for the deprecated `priority` prop).
   */
  preload?: boolean;
  alt?: string;
  style?: React.CSSProperties;
};

const SIZES = {
  full: { src: "/full-logo.webp", width: 2000, height: 666 },
  small: { src: "/small-logo.webp", width: 1254, height: 1254 },
} as const;

export function Logo({
  variant = "full",
  height,
  className,
  preload,
  alt = "Seofriendly",
  style,
}: LogoProps) {
  const asset = SIZES[variant];
  const width = Math.round((asset.width / asset.height) * height);
  // Intrinsic `width`/`height` set the aspect ratio for layout reservation;
  // the inline `style.height` controls the actually-rendered size. This
  // way the caller can pass a single `height` and have it drive both,
  // without relying on Tailwind breakpoints that would drift out of sync.
  const imageStyle: React.CSSProperties = { height, ...style };
  return (
    <Image
      src={asset.src}
      alt={alt}
      width={width}
      height={height}
      preload={preload}
      className={className}
      sizes={`${width}px`}
      style={imageStyle}
    />
  );
}

// Re-export the Image type so consumers can compose with the same types.
export type { ImageProps as LogoImageProps };
