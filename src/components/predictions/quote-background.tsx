"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Quote = {
  id: string;
  imageUrl: string;
  text: string | null;
  authorName: string | null;
};

const ROTATE_MS = 7000;

export function QuoteBackground({ quotes }: { quotes: Quote[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (quotes.length < 2) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [quotes.length]);

  if (quotes.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {quotes.map((quote, i) => (
        <div
          key={quote.id}
          className={cn(
            "absolute inset-0 flex items-center justify-center px-12 transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          <figure className="flex max-w-md flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs, not worth next/image domain config for a decorative background */}
            <img
              src={quote.imageUrl}
              alt=""
              className="max-h-80 rounded-xl object-contain opacity-90 shadow-xl ring-1 ring-foreground/10"
            />
            {(quote.text || quote.authorName) && (
              <figcaption className="text-sm text-foreground/40">
                {quote.text}
                {quote.text && quote.authorName && " — "}
                {quote.authorName}
              </figcaption>
            )}
          </figure>
        </div>
      ))}
    </div>
  );
}
