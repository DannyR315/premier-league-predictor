import { cn } from "@/lib/utils";

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
const TILE_WIDTH_PX = 288; // w-72
const GAP_PX = 12; // gap-3

// Target scroll speed in px/s, not a fixed duration — a row's travel
// distance depends on how many tiles it ends up with, so a fixed duration
// made rows crawl once tile count was capped above. Deriving duration from
// speed keeps the actual visual speed consistent regardless of tile count.
// Values are ~90% of what the durations worked out to before tiles were
// capped (i.e. 10% slower, as asked for).
const TARGET_SPEEDS_PX_PER_S = [98, 87, 79, 110] as const;

const ROW_META = Array.from({ length: ROW_COUNT }, (_, i) => ({
  direction: i % 2 === 0 ? "animate-marquee" : "animate-marquee-reverse",
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
// ROW_COUNT) was stuck permanently repeating just those few images. This
// also gets a fresh shuffle on every page load.
function buildRowBase(shuffled: Quote[], rowIndex: number) {
  if (shuffled.length === 0) return [];
  const offset = (rowIndex * 7) % shuffled.length;
  return Array.from(
    { length: TILES_PER_ROW },
    (_, i) => shuffled[(offset + i) % shuffled.length],
  );
}

export function QuoteBackground({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null;
  const shuffled = shuffle(quotes);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 flex flex-col overflow-hidden">
      {ROW_META.map((row, i) => {
        const base = buildRowBase(shuffled, i);
        // Duplicated once so the track can loop seamlessly: translateX(-50%)
        // lines up exactly with the start of the second copy.
        const tiles = [...base, ...base];
        const rowWidthPx = base.length * TILE_WIDTH_PX + (base.length - 1) * GAP_PX;
        const duration = rowWidthPx / row.speed;
        return (
          <div key={i} className="flex flex-1 items-center overflow-hidden">
            <div
              className={cn("flex w-max shrink-0 gap-3", row.direction)}
              style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
            >
              {tiles.map((quote, j) => (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs, not worth next/image domain config for a decorative background
                <img
                  key={`${quote.id}-${j}`}
                  src={quote.imageUrl}
                  alt=""
                  className="h-full w-72 shrink-0 rounded-lg object-cover shadow-lg ring-1 ring-foreground/10"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
