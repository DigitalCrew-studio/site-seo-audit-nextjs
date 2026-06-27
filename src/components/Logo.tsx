import Image, { type ImageProps } from "next/image";

type LogoProps = {
  variant?: "full" | "small";
  /**
   * Rendered height in pixels. The width is derived from the asset's
   * intrinsic aspect ratio. Sizing is applied to a wrapper element via
   * `style`, and `<Image fill>` fills the wrapper — this keeps the size
   * logic in CSS without overriding only one intrinsic dimension on the
   * `<img>` itself, which is what triggers Next.js' aspect-ratio warning.
   */
  height: number;
  className?: string;
  /**
   * Preload the image for LCP. Uses `preload` (the Next.js 16+ replacement
   * for the deprecated `priority` prop).
   */
  preload?: boolean;
  alt?: string;
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
}: LogoProps) {
  const asset = SIZES[variant];
  const width = Math.round((asset.width / asset.height) * height);
  // Render the size through a wrapper (`<span>`) and let `<Image fill>`
  // occupy it. The intrinsic attributes match the rendered size, so the
  // browser and Next.js both see consistent width/height values and do
  // not flag a one-sided CSS override on the underlying `<img>`.
  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        width,
        height,
      }}
      aria-hidden={alt === "" ? true : undefined}
    >
      <Image
        src={asset.src}
        alt={alt}
        preload={preload}
        sizes={`${width}px`}
        fill
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}

// Re-export the Image type so consumers can compose with the same types.
export type { ImageProps as LogoImageProps };



