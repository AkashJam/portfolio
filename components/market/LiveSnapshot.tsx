"use client";

import * as React from "react";
import Link from "next/link";

import { DayRangeBar } from "@/components/market/DayRangeBar";
import { useLocalFeedTracker } from "@/components/market/FeedStatus";
import { MarketHeadState } from "@/components/market/MarketHeadState";
import { useSessionState } from "@/components/market/useMarketSession";
import type { MarketState } from "@/lib/market-state";
import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";
import type { SymbolSnapshot } from "@/lib/market-schemas";
import type { SensorTitle } from "@/lib/sensor-title";

/**
 * The price page's (`/market/[sensor]/price`) live header. Seeds from the SSR snapshot, then merges live
 * via a single-symbol subscribeToStream, the same seed-then-merge shape
 * PricesTable uses per row.
 *
 * While the regular session is closed it is frozen, as the Prices table is
 * (Phase 14 steps 7 and 8): extended-hours quotes are not applied, the ink goes to
 * muted with no up or down colour, and the as-of line says how old the price is
 * and when the market opens. A sensor is named by its place and symbol, with a
 * breadcrumb (Market / Japan / Price) back to the record and /market; a simulator symbol (dev and CI only) has no place.
 */
export function LiveSnapshot({
  symbol,
  sensor,
  recordHref,
  initialSnapshot,
  initialState,
  renderedAt,
}: {
  symbol: string;
  sensor: SensorTitle | null;
  /** The sensor's record page, which the breadcrumb's place links to; null for a simulator symbol. */
  recordHref: string | null;
  initialSnapshot: SymbolSnapshot;
  initialState: MarketState;
  renderedAt: string;
}) {
  const [snapshot, setSnapshot] = React.useState(initialSnapshot);
  // Staleness (Phase 7 step 1). PriceChart below holds a second connection
  // of its own; one indicator per page is enough, since both go through the
  // same proxy and die together.
  const feed = useLocalFeedTracker(initialSnapshot.asOf);
  const session = useSessionState(initialState);
  const frozen = session.session === "closed";
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

  return (
    <div className="space-y-6" data-session={frozen ? "closed" : undefined}>
      {sensor && (
        <nav aria-label="Breadcrumb" className="text-meta text-text-muted">
          <Link href="/market" className="hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
            Market
          </Link>
          <span aria-hidden="true"> / </span>
          {recordHref ? (
            <Link href={recordHref} className="hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
              {sensor.place}
            </Link>
          ) : (
            <span>{sensor.place}</span>
          )}
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Price</span>
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          {sensor ? (
            <>
              <h1 className="text-h1 font-light">{sensor.heading}</h1>
              <p className="mt-1 text-small text-text-muted">{sensor.sub}</p>
            </>
          ) : (
            <>
              <p className="text-meta uppercase tracking-[0.3em] text-text-muted">{snapshot.name}</p>
              <h1 className="font-mono text-3xl">{snapshot.symbol}</h1>
            </>
          )}
        </div>
        <div className="text-right">
          <p data-testid="live-price" className={cn("font-mono text-3xl tabular-nums", ink)}>
            {snapshot.price.toFixed(2)}
          </p>
          <p className={cn("font-mono text-small tabular-nums", ink)}>
            {up ? "+" : ""}
            {snapshot.change.toFixed(2)} ({up ? "+" : ""}
            {snapshot.changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <MarketHeadState initial={initialState} renderedAt={renderedAt} newestAsOf={initialSnapshot.asOf} head={null} tracker={feed} />

      {/* Day range replaces the old High/Low/Prev Close 3-stat grid — the
          bar already conveys high/low; Prev Close is the one figure it
          doesn't, so it's the only number kept alongside it. */}
      <DayRangeBar low={snapshot.dayLow} high={snapshot.dayHigh} price={snapshot.price} size="lg" />
      <p className="font-mono text-small text-text-muted">
        Prev close <span className="text-text">{snapshot.prevClose.toFixed(2)}</span>
      </p>
    </div>
  );
}
