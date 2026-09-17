export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export const btnBase = `inline-flex cursor-pointer items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${focusRing} disabled:cursor-not-allowed`;

export const btnPrimary = `${btnBase} bg-zinc-100 text-zinc-950 hover:bg-white active:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500`;

export const btnSecondary = `${btnBase} border border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-50`;
