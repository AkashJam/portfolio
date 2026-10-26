"use client";

import * as React from "react";

import { FeedStatus, useLocalFeedTracker } from "@/components/market/FeedStatus";
import type { PriceEntry } from "@/components/market/PricesTable";
import { useSessionState } from "@/components/market/useMarketSession";
import { BandClosedChart } from "@/components/site/BandClosedChart";
import { BandOpenChart } from "@/components/site/BandOpenChart";
import type { BandMode, BandSeries } from "@/lib/band-series";
import type { MarketState } from "@/lib/market-state";
import { applyQuote } from "@/lib/prices";
import { subscribeToStream } from "@/lib/sse";

type View = { key: string; series: BandSeries | null };

const keyOf = (symbol: string, mode: BandMode) => `${mode}:${symbol}`;

/**
 * Home's band (phase6.md Steps 6 and 9; Phase 14 step 9; phase18.md D4;
 * `site-review/home.html`): one sensor's line, full-bleed under the hero's text and
 * filling what is left of the hero's screen. Open, it is the live line, a fixed-rate
 * glide over the stream with a pulsing end point; closed, which is the state most
 * visitors load (US hours are 15:30–22:00 CET), it is the last session's path, still.
 * It carries no pill, symbol, price, opening time or picker: the sentence above it
 * says what it is. The sensor is fixed (NVDA) and nothing re-ranks it.
 *
 * A feed that goes quiet stops the end point's pulse and dims the line rather than
 * saying so in words (the tracker still runs, and its pill is rendered for screen
 * readers only).
 *
 * `/` is static, so the server's session is a cached answer; the shell's poll takes
 * over, and when it disagrees the line is re-read for the new mode.
 */
export function HeroLiveBand({
  entry,
  initialSeries,
  initialState,
}: {
  entry: PriceEntry;
  initialSeries: BandSeries;
  initialState: MarketState;
}) {
  const symbol = entry.sensor.symbol;
  const [row, setRow] = React.useState(entry.row);
  const session = useSessionState(initialState);
  const frozen = session.session === "closed";
  const mode: BandMode = frozen ? "closed" : "open";

  // Staleness (Phase 7 step 1): seeded from the snapshot, so a feed that is dead from
  // first load reports how old the band really is.
  const feed = useLocalFeedTracker(entry.row.asOf);
  const [stale, setStale] = React.useState(false);
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
        // Closed: an extended-hours print does not move a band that says it is closed.
        if (frozenRef.current) return;
        setRow((prev) => applyQuote(prev, quote));
      },
    });
    // The symbol is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The line for (sensor, mode). The server seeded the mode it saw; the other is read
  // on demand and kept, so flipping back costs nothing.
  const cache = React.useRef(new Map<string, BandSeries | null>());
  const seededKey = keyOf(symbol, initialSeries.mode);
  const [view, setView] = React.useState<View>({ key: seededKey, series: initialSeries });
  React.useEffect(() => {
    cache.current.set(seededKey, initialSeries);
  }, [seededKey, initialSeries]);

  const wanted = keyOf(symbol, mode);
  React.useEffect(() => {
    if (view.key === wanted) return;
    if (cache.current.has(wanted)) {
      setView({ key: wanted, series: cache.current.get(wanted) ?? null });
      return;
    }
    let cancelled = false;
    fetch(`/api/band/${encodeURIComponent(symbol)}?mode=${mode}`)
      .then((res) => (res.ok ? res.json() : { series: null }))
      .then((data: { series: BandSeries | null }) => {
        if (cancelled) return;
        cache.current.set(wanted, data.series);
        setView({ key: wanted, series: data.series });
      })
      .catch(() => {
        if (!cancelled) setView({ key: wanted, series: null });
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, symbol, mode, view.key]);

  const chartLabel = frozen ? `${symbol}, last session, closed` : `Live price series, ${symbol}`;
  const series = view.key === wanted ? view.series : null;
  return (
    <section
      aria-label={frozen ? "Market feed, closed" : "Live market feed"}
      className="relative min-h-55 flex-1 overflow-clip md:min-h-60"
      data-session={frozen ? "closed" : "open"}
    >
      {/* Not visible: the pill's wording is read out when the feed is interrupted. */}
      <div className="sr-only">
        <FeedStatus tracker={feed} onStaleChange={setStale} />
      </div>
      {series ? (
        frozen ? (
          <BandClosedChart points={series.points} label={chartLabel} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0">
            <BandOpenChart
              key={view.key}
              seed={series.points}
              latest={row.asOf === null ? null : row.price}
              label={chartLabel}
              stale={stale}
            />
          </div>
        )
      ) : null}
    </section>
  );
}
