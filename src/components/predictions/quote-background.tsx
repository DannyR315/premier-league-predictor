import { cn } from "@/lib/utils";

type Quote = {
  id: string;
  imageUrl: string;
};

const ROWS = [
  { direction: "animate-marquee", duration: "150s" },
  { direction: "animate-marquee-reverse", duration: "120s" },
  { direction: "animate-marquee", duration: "140s" },
  { direction: "animate-marquee-reverse", duration: "110s" },
] as const;

function rotate<T>(items: T[], by: number) {
  if (items.length === 0) return items;
  const offset = by % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function QuoteBackground({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 flex flex-col overflow-hidden">
      {ROWS.map((row, i) => {
        const rowQuotes = rotate(quotes, i * 3);
        const tiles = [...rowQuotes, ...rowQuotes];
        return (
          <div key={i} className="flex flex-1 items-center overflow-hidden">
            <div
              className={cn("flex w-max shrink-0 gap-3", row.direction)}
              style={{ "--marquee-duration": row.duration } as React.CSSProperties}
            >
              {tiles.map((quote, j) => (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs, not worth next/image domain config for a decorative background
                <img
                  key={`${quote.id}-${j}`}
                  src={quote.imageUrl}
                  alt=""
                  className="h-full w-auto shrink-0 rounded-lg object-contain shadow-lg ring-1 ring-foreground/10"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
