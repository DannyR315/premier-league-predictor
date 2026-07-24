"use client";

import { useEffect, useMemo, useRef } from "react";

type Quote = {
  id: string;
  imageUrl: string;
};

const ROW_COUNT = 10;
// Each row only needs enough tiles to comfortably outrun the viewport width
// before it loops — reusing the *entire* quote list in every row (as before)
// meant total <img> nodes scaled as rows x 2 x quotes.length, which got into
// the hundreds as more screenshots were added and caused visible
// decode/repaint stutter. Capping it here keeps total image nodes roughly
// constant regardless of library size.
const TILES_PER_ROW = 16;

const TARGET_SPEEDS_PX_PER_S = [98, 87, 79, 110] as const;

const ROW_META = Array.from({ length: ROW_COUNT }, (_, i) => ({
  reverse: i % 2 === 1,
  speed: TARGET_SPEEDS_PX_PER_S[i % TARGET_SPEEDS_PX_PER_S.length],
}));

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Each row cycles TILES_PER_ROW images starting at a different point in the
// shuffled pool, rather than every row getting a fixed, disjoint slice of
// the library (round-robin by index) — that meant whichever row's slice
// landed small (whenever quotes.length wasn't a clean multiple of
// ROW_COUNT) was stuck permanently repeating just those few images.
function buildRowBase(shuffled: Quote[], rowIndex: number) {
  if (shuffled.length === 0) return [];
  const offset = (rowIndex * 7) % shuffled.length;
  return Array.from(
    { length: TILES_PER_ROW },
    (_, i) => shuffled[(offset + i) % shuffled.length],
  );
}

/**
 * Scrolls continuously via requestAnimationFrame instead of a CSS
 * `animation: ... infinite` keyframe. Plain CSS infinite marquees are prone
 * to a visible hiccup right at the loop boundary, where the animation
 * restarts from its end keyframe back to its start one — some browsers
 * show a compositor re-sync glitch there, especially with several such
 * animations running at once. Continuously incrementing a translateX value
 * and wrapping it with modulo has no discrete "restart" for the browser to
 * stumble on.
 */
function MarqueeRow({
  tiles,
  speedPxPerS,
  reverse,
}: {
  tiles: Quote[];
  speedPxPerS: number;
  reverse: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Content below is duplicated once, so half the track's width is
    // exactly one copy — wrapping the offset there loops seamlessly.
    const halfWidth = track.scrollWidth / 2;
    let offset = 0;
    let lastTimestamp: number | null = null;
    let frameId: number;

    function step(timestamp: number) {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const deltaSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      offset = (offset + speedPxPerS * deltaSeconds) % halfWidth;
      const x = reverse ? offset - halfWidth : -offset;
      track!.style.transform = `translate3d(${x}px, 0, 0)`;

      frameId = requestAnimationFrame(step);
    }

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [speedPxPerS, reverse]);

  return (
    <div ref={trackRef} className="flex w-max shrink-0 gap-3">
      {[...tiles, ...tiles].map((quote, j) => (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs, not worth next/image domain config for a decorative background
        <img
          key={`${quote.id}-${j}`}
          src={quote.imageUrl}
          alt=""
          className="h-full w-72 shrink-0 rounded-lg object-cover shadow-lg ring-1 ring-foreground/10"
        />
      ))}
    </div>
  );
}

export function QuoteBackground({ quotes }: { quotes: Quote[] }) {
  // Shuffled once per mount (i.e. once per page load) rather than re-shuffled
  // on every render.
  const shuffled = useMemo(() => shuffle(quotes), [quotes]);

  if (quotes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 flex flex-col overflow-hidden">
      {ROW_META.map((row, i) => (
        <div key={i} className="flex flex-1 items-center overflow-hidden">
          <MarqueeRow
            tiles={buildRowBase(shuffled, i)}
            speedPxPerS={row.speed}
            reverse={row.reverse}
          />
        </div>
      ))}
    </div>
  );
}
