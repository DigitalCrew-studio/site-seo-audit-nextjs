export function HeroAuditGraphic() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[1672/941] w-[128%] max-w-none -translate-x-18 xl:w-[138%] xl:-translate-x-24"
    >
      <div className="ambient-glow absolute inset-x-[6%] bottom-[2%] top-[18%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(180,83,9,0.22)_0%,rgba(21,128,61,0.12)_34%,rgba(246,245,241,0)_70%)] blur-3xl" />
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet="/hero-bg-desktop-laptop.webp"
        />
        <source media="(min-width: 640px)" srcSet="/hero-bg-tablet.webp" />
        <img
          src="/hero-bg-mobile.webp"
          alt=""
          className="relative h-full w-full object-contain object-left-center drop-shadow-[0_24px_70px_rgba(27,27,25,0.12)]"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
