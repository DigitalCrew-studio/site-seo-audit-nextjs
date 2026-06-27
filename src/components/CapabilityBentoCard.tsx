import type { Capability } from "@/lib/capabilities";
import { CAPABILITY_ICONS } from "@/lib/capabilityIcons";

export type { Capability };

export function CapabilityBentoCard({
  cap,
  index,
  tones,
}: {
  cap: Capability;
  index: number;
  tones: readonly {
    card: string;
    grid: string;
    hover: string;
    icon: string;
    title: string;
    description: string;
  }[];
}) {
  const Icon = CAPABILITY_ICONS[cap.iconKey];
  const tone = tones[index % tones.length];

  return (
    <li
      tabIndex={0}
      aria-label={`${cap.title}: ${cap.description}`}
      className={`card-spotlight group relative min-h-[10rem] overflow-hidden rounded-xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_18px_60px_rgba(27,27,25,0.10)] focus:-translate-y-0.5 focus:border-accent/30 focus:shadow-[0_18px_60px_rgba(27,27,25,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 sm:p-6 ${tone.card} ${
        cap.featured ? "md:col-span-2 md:min-h-[13rem]" : ""
      }`}
    >
      <div
        className="card-spotlight-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100"
        data-tone={index % tones.length}
      />
      <div
        className={`pointer-events-none absolute inset-0 [background-size:28px_28px] ${tone.grid}`}
      />

      <div className="relative flex h-full w-full flex-col items-start text-left">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition duration-300 ${tone.icon}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>

        <span
          className={`mt-auto block pt-8 text-[15px] font-semibold leading-tight tracking-tight ${tone.title}`}
        >
          {cap.title}
        </span>

        <span
          className={`mt-3 block max-h-28 overflow-hidden text-[13px] leading-relaxed opacity-100 transition-all duration-300 motion-reduce:transition-none md:max-h-0 md:opacity-0 md:group-hover:max-h-28 md:group-hover:opacity-100 md:group-focus:max-h-28 md:group-focus:opacity-100 ${tone.description}`}
        >
          {cap.description}
        </span>
      </div>
    </li>
  );
}
