"use client";

import * as React from "react";

import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";
import type { QuoteEvent } from "@/lib/market-schemas";

interface Tick {
  symbol: string;
  price: number;
  up: boolean;
}

/**
 * Home hero's "LIVE" chip (portfolio.md §17/§18, mockups/v3) — replaces the
 * old constant-CSS-pulse-over-a-5-minute-cached-count version with one
 * genuinely bound to `subscribeToStream` (lib/sse.ts). Renders the symbol
 * count until the first real SSE `quote` arrives, then rolls the actual
 * last tick (symbol · price · direction) on every event after that.
 */
export function LiveChip({ symbols }: { symbols: string[] }) {
  const [tick, setTick] = React.useState<Tick | null>(null);
  const [tickId, setTickId] = React.useState(0);
  const lastPrices = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    return subscribeToStream(symbols, {
      onQuote: (quote: QuoteEvent) => {
        const prevPrice = lastPrices.current[quote.symbol];
        // No prior tick to compare against yet — default to "up" rather
        // than leaving the arrow in an undefined state for this one render.
        const up = prevPrice === undefined ? true : quote.price >= prevPrice;
        lastPrices.current[quote.symbol] = quote.price;
        setTick({ symbol: quote.symbol, price: quote.price, up });
        setTickId((id) => id + 1);
      },
    });
    // symbols only changes on navigation (new page load), not on every
    // render — safe to key the effect on the initial set, matching
    // MarketTable's identical reasoning for the same pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-full border border-hairline bg-panel-2 px-3 py-1.5 font-mono text-xs text-text-muted">
      <span
        key={tickId}
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full bg-market-up",
          tick ? "motion-safe:animate-tick" : "motion-safe:animate-pulse"
        )}
      />
      <span className="font-semibold tracking-wide text-market-up">LIVE</span>
      <span className="text-text-faint">·</span>
      {tick ? (
        <span>
          {tick.symbol} <span className="font-semibold text-text tabular-nums">{tick.price.toFixed(2)}</span>{" "}
          <span className={tick.up ? "text-market-up" : "text-market-down"} aria-hidden="true">
            {tick.up ? "▲" : "▼"}
          </span>
        </span>
      ) : (
        <span>{symbols.length} symbols streaming</span>
      )}
    </div>
  );
}
