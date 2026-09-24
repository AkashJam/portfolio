"use client";

import * as React from "react";

import { DayRangeBar } from "@/components/market/DayRangeBar";
import { FeedStatus, useLocalFeedTracker } from "@/components/market/FeedStatus";
import { LiveBadge } from "@/components/market/LiveBadge";
import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";
import type { SymbolSnapshot } from "@/lib/market-schemas";

/**
 * `/market/[symbol]`'s live header (mockups/v3) — fixes the gap
 * e2e/live-tick.spec.ts's own comment used to flag: this block was
 * SSR-only and never updated client-side, unlike the market table's price
 * cells. Seeds from the SSR snapshot, then merges live via a single-symbol
 * subscribeToStream — the same seed-then-merge shape SymbolCardGrid uses
 * per row, here for the one symbol this page is about.
 */
export function LiveSnapshot({ symbol, initialSnapshot }: { symbol: string; initialSnapshot: SymbolSnapshot }) {
  const [snapshot, setSnapshot] = React.useState(initialSnapshot);
  // Staleness (Phase 7 step 1). PriceChart below holds a second connection
  // of its own; one indicator per page is enough, since both go through the
  // same proxy and die together.
  const feed = useLocalFeedTracker(initialSnapshot.updatedAt);

  React.useEffect(() => {
    return subscribeToStream([symbol], {
      onHeartbeat: () => feed.noteEvent(),
      onQuote: (quote) => {
        feed.noteQuote();
        setSnapshot((prev) => ({
          ...prev,
          price: quote.price,
          change: quote.price - prev.prevClose,
          changePercent: prev.prevClose !== 0 ? ((quote.price - prev.prevClose) / prev.prevClose) * 100 : 0,
          updatedAt: quote.time,
          simulated: quote.simulated,
          // A live tick past the known day range genuinely is a new
          // intraday high/low — not fabricated, just extending the same
          // real quantity the backend's own daily candle would compute.
          dayHigh: Math.max(prev.dayHigh, quote.price),
          dayLow: Math.min(prev.dayLow, quote.price),
        }));
      },
    });
    // symbol is a route param, stable for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const up = snapshot.change >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{snapshot.name}</p>
          <h1 className="font-mono text-3xl">{snapshot.symbol}</h1>
        </div>
        <div className="text-right">
          <p className={cn("font-mono text-3xl tabular-nums", up ? "text-market-up" : "text-market-down")}>
            {snapshot.price.toFixed(2)}
          </p>
          <p className={cn("font-mono text-sm tabular-nums", up ? "text-market-up" : "text-market-down")}>
            {up ? "+" : ""}
            {snapshot.change.toFixed(2)} ({up ? "+" : ""}
            {snapshot.changePercent.toFixed(2)}%)
          </p>
          {/* Provenance (LiveBadge) and freshness (FeedStatus) answer
              different questions, so both stay: Phase 12 reworks the first. */}
          <div className="mt-2 flex items-center justify-end gap-2">
            <FeedStatus tracker={feed} />
            <LiveBadge simulated={snapshot.simulated} />
          </div>
        </div>
      </div>

      {/* Day range replaces the old High/Low/Prev Close 3-stat grid — the
          bar already conveys high/low; Prev Close is the one figure it
          doesn't, so it's the only number kept alongside it. */}
      <DayRangeBar low={snapshot.dayLow} high={snapshot.dayHigh} price={snapshot.price} size="lg" />
      <p className="font-mono text-sm text-text-muted">
        Prev close <span className="text-text">{snapshot.prevClose.toFixed(2)}</span>
      </p>
    </div>
  );
}
