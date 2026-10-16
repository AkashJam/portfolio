"use client";

import * as React from "react";
import Link from "next/link";

import { DayRangeBar } from "@/components/market/DayRangeBar";
import { FeedStatus, useLocalFeedTracker } from "@/components/market/FeedStatus";
import { MarketStateLine } from "@/components/market/MarketStateLine";
import { SessionPill } from "@/components/market/SessionPill";
import { useNow, useSessionState } from "@/components/market/useMarketSession";
import { frozenLine } from "@/lib/market-session";
import type { MarketState } from "@/lib/market-state";
import { pricesVintage } from "@/lib/prices";
import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";
import type { SymbolSnapshot } from "@/lib/market-schemas";
import type { SensorTitle } from "@/lib/sensor-title";

/**
 * `/market/[symbol]`'s live header. Seeds from the SSR snapshot, then merges live
 * via a single-symbol subscribeToStream, the same seed-then-merge shape
 * PricesTable uses per row.
 *
 * While the regular session is closed it is frozen, as the Prices table is
 * (Phase 14 steps 7 and 8): extended-hours quotes are not applied, the ink goes to
 * muted with no up or down colour, and the as-of line says how old the price is
 * and when the market opens. A sensor is named by its place and symbol, with a
 * breadcrumb back to /market; a simulator symbol (dev and CI only) has no place.
 */
export function LiveSnapshot({
  symbol,
  sensor,
  initialSnapshot,
  initialState,
  renderedAt,
}: {
  symbol: string;
  sensor: SensorTitle | null;
  initialSnapshot: SymbolSnapshot;
  initialState: MarketState;
  renderedAt: string;
}) {
  const [snapshot, setSnapshot] = React.useState(initialSnapshot);
  const [sawLive, setSawLive] = React.useState(false);
  // Staleness (Phase 7 step 1). PriceChart below holds a second connection
  // of its own; one indicator per page is enough, since both go through the
  // same proxy and die together.
  const feed = useLocalFeedTracker(initialSnapshot.asOf);
  const session = useSessionState(initialState);
  const frozen = session.session === "closed";
  const now = useNow(renderedAt);
  // The subscription outlives a change of session, so it reads the latest through a ref.
  const frozenRef = React.useRef(frozen);
  React.useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);

  React.useEffect(() => {
    return subscribeToStream([symbol], {
      onHeartbeat: () => feed.noteEvent(),
      onQuote: (quote) => {
        feed.noteQuote();
        // Closed: an extended-hours print does not move a page that says it is frozen.
        if (frozenRef.current) return;
        setSawLive(true);
        setSnapshot((prev) => ({
          ...prev,
          price: quote.price,
          change: quote.price - prev.prevClose,
          changePercent: prev.prevClose !== 0 ? ((quote.price - prev.prevClose) / prev.prevClose) * 100 : 0,
          asOf: quote.time,
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
  const ink = frozen ? "text-text-muted" : up ? "text-market-up" : "text-market-down";
  const vintage = frozen
    ? frozenLine(pricesVintage([snapshot.asOf], now, false), session.opensAt, now)
    : pricesVintage([snapshot.asOf], new Date(renderedAt), sawLive);

  return (
    <div className="space-y-6" data-session={frozen ? "closed" : undefined}>
      {sensor && (
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-text-muted">
          <Link href="/market" className="hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
            Market
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{sensor.heading}</span>
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          {sensor ? (
            <>
              <h1 className="text-3xl font-light">{sensor.heading}</h1>
              <p className="mt-1 text-sm text-text-muted">{sensor.sub}</p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{snapshot.name}</p>
              <h1 className="font-mono text-3xl">{snapshot.symbol}</h1>
            </>
          )}
        </div>
        <div className="text-right">
          <p data-testid="live-price" className={cn("font-mono text-3xl tabular-nums", ink)}>
            {snapshot.price.toFixed(2)}
          </p>
          <p className={cn("font-mono text-sm tabular-nums", ink)}>
            {up ? "+" : ""}
            {snapshot.change.toFixed(2)} ({up ? "+" : ""}
            {snapshot.changePercent.toFixed(2)}%)
          </p>
          <div className="mt-2 flex items-center justify-end gap-2">
            <FeedStatus tracker={feed} fresh={<SessionPill initial={initialState} />} />
          </div>
        </div>
      </div>

      <MarketStateLine initial={initialState} renderedAt={renderedAt} newestAsOf={initialSnapshot.asOf} />

      {/* Day range replaces the old High/Low/Prev Close 3-stat grid — the
          bar already conveys high/low; Prev Close is the one figure it
          doesn't, so it's the only number kept alongside it. */}
      <DayRangeBar low={snapshot.dayLow} high={snapshot.dayHigh} price={snapshot.price} size="lg" />
      <p className="font-mono text-sm text-text-muted">
        Prev close <span className="text-text">{snapshot.prevClose.toFixed(2)}</span>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <span data-testid="symbol-asof">{vintage}</span>
      </p>
    </div>
  );
}
