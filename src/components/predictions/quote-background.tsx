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
const DURATIONS = [143, 160, 176, 127] as const;

const ROWS = Array.from({ length: ROW_COUNT }, (_, i) => ({
  direction: i % 2 === 0 ? "animate-marquee" : "animate-marquee-reverse",
  duration: `${DURATIONS[i % DURATIONS.length]}s`,
}));

function buildRowTiles(quotes: Quote[], rowIndex: number, rowCount: number) {
  const subset = quotes.filter((_, idx) => idx % rowCount === rowIndex);
  const base = subset.length > 0 ? subset : quotes;

  const padded: Quote[] = [];
  while (padded.length < MIN_TILES_PER_ROW) {
    padded.push(...base);
  }

  // Duplicated once so the track can loop seamlessly: translateX(-50%)
  // lines up exactly with the start of the second copy.
  return [...padded, ...padded];
}

export function QuoteBackground({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 flex flex-col overflow-hidden">
      {ROWS.map((row, i) => {
        const tiles = buildRowTiles(quotes, i, ROW_COUNT);
        return (
          <div key={i} className="flex flex-1 items-center overflow-hidden">
            <div
              className={cn("flex w-max shrink-0 gap-3 will-change-transform", row.direction)}
              style={{ "--marquee-duration": row.duration } as React.CSSProperties}
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
