import type { ProviderName } from "../types/chat";

const BADGE: Record<
  ProviderName,
  { mark: string; className: string }
> = {
  openai: {
    mark: "O",
    className: "border-emerald-800 bg-emerald-950 text-emerald-300",
  },
  claude: {
    mark: "C",
    className: "border-amber-800 bg-amber-950 text-amber-300",
  },
  gemini: {
    mark: "G",
    className: "border-sky-800 bg-sky-950 text-sky-300",
  },
};

type ProviderBadgeProps = {
  provider: ProviderName;
  size?: "sm" | "md";
};

export function ProviderBadge({ provider, size = "sm" }: ProviderBadgeProps) {
  const badge = BADGE[provider];
  const box =
    size === "md" ? "h-8 w-8 text-sm" : "h-6 w-6 text-[11px]";

  return (
    <span
      className={`inline-flex ${box} items-center justify-center rounded-md border font-semibold ${badge.className}`}
      aria-hidden="true"
    >
      {badge.mark}
    </span>
  );
}
