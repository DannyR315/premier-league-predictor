// A curated palette rather than deriving from each person's actual avatar —
// real photos often produce muddy/ugly "dominant colors" and would need
// image-processing infra to extract. Hashing the user ID into one of these
// instead is cheap and always looks intentional.
const CARD_RING_COLORS = [
  "ring-rose-400/60",
  "ring-amber-400/60",
  "ring-emerald-400/60",
  "ring-sky-400/60",
  "ring-violet-400/60",
  "ring-fuchsia-400/60",
  "ring-orange-400/60",
  "ring-teal-400/60",
  "ring-indigo-400/60",
  "ring-pink-400/60",
] as const;

export function userCardRingClass(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return CARD_RING_COLORS[Math.abs(hash) % CARD_RING_COLORS.length];
}
