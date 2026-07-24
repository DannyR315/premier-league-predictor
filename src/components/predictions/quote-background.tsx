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
// decode/repaint stutter. Distributing quotes round-robin across rows keeps
// total image nodes roughly constant regardless of library size.
const MIN_TILES_PER_ROW = 8;
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

function buildRowBase(quotes: Quote[], rowIndex: number, rowCount: number) {
  const subset = quotes.filter((_, idx) => idx % rowCount === rowIndex);
  const base = subset.length > 0 ? subset : quotes;

  const padded: Quote[] = [];
  while (padded.length < MIN_TILES_PER_ROW) {
    padded.push(...base);
  }
  return padded;
}

export function QuoteBackground({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 flex flex-col overflow-hidden">
      {ROW_META.map((row, i) => {
        const base = buildRowBase(quotes, i, ROW_COUNT);
        // Duplicated once so the track can loop seamlessly: translateX(-50%)
        // lines up exactly with the start of the second copy.
        const tiles = [...base, ...base];
        const rowWidthPx = base.length * TILE_WIDTH_PX + (base.length - 1) * GAP_PX;
        const duration = rowWidthPx / row.speed;
        return (
          <div key={i} className="flex flex-1 items-center overflow-hidden">
            <div
              className={cn("flex w-max shrink-0 gap-3 will-change-transform", row.direction)}
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
