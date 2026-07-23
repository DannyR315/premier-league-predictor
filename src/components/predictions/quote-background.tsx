"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Quote = {
  id: string;
  text: string;
  authorName: string;
  imageUrl: string | null;
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
          <figure className="flex max-w-sm flex-col items-center gap-3 text-center">
            {quote.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs, not worth next/image domain config for a decorative background
              <img
                src={quote.imageUrl}
                alt=""
                className="max-h-56 rounded-xl object-contain opacity-70 shadow-lg"
              />
            )}
            <blockquote className="text-xl font-medium text-foreground/25 italic">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="text-sm text-foreground/20">
              — {quote.authorName}
            </figcaption>
          </figure>
        </div>
      ))}
    </div>
  );
}
