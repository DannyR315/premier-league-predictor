// A curated palette rather than deriving from each person's actual avatar —
// real photos often produce muddy/ugly "dominant colors" and would need
// image-processing infra to extract. Hashing the user ID into one of these
// instead is cheap and always looks intentional.
// Card's own base styling sets a dark-mode-specific ring color
// (dark:ring-white/[0.06]) — since the app is always in dark mode, that
// wins over a plain (non-dark:) override unless we also override the dark
// variant explicitly here.
const CARD_RING_COLORS = [
  "ring-rose-400/60 dark:ring-rose-400/60",
  "ring-amber-400/60 dark:ring-amber-400/60",
  "ring-emerald-400/60 dark:ring-emerald-400/60",
  "ring-sky-400/60 dark:ring-sky-400/60",
  "ring-violet-400/60 dark:ring-violet-400/60",
  "ring-fuchsia-400/60 dark:ring-fuchsia-400/60",
  "ring-orange-400/60 dark:ring-orange-400/60",
  "ring-teal-400/60 dark:ring-teal-400/60",
  "ring-indigo-400/60 dark:ring-indigo-400/60",
  "ring-pink-400/60 dark:ring-pink-400/60",
] as const;

export function userCardRingClass(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return CARD_RING_COLORS[Math.abs(hash) % CARD_RING_COLORS.length];
}
