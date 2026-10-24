"use client";

import * as React from "react";

import { FeedStatus, useLocalFeedTracker } from "@/components/market/FeedStatus";
import { MarketStateLine } from "@/components/market/MarketStateLine";
import type { PriceEntry } from "@/components/market/PricesTable";
import { useSessionState } from "@/components/market/useMarketSession";
import { Container } from "@/components/shell/Container";
import { BandClosedChart } from "@/components/site/BandClosedChart";
import { BandOpenChart } from "@/components/site/BandOpenChart";
import { BandPicker, placeOf } from "@/components/site/BandPicker";
import { closeLabel, seriesNote, type BandMode, type BandSeries } from "@/lib/band-series";
import { newestTimestamp } from "@/lib/feed-freshness";
import type { MarketState } from "@/lib/market-state";
import { applyQuote, changeDirection, changeLabel } from "@/lib/prices";
import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";

type View = { key: string; series: BandSeries | null; status: "ready" | "loading" | "none" };

const keyOf = (symbol: string, mode: BandMode) => `${mode}:${symbol}`;

/**
 * Home hero's band (phase6.md Steps 6 and 9; Phase 14 step 9; mocks
 * `market-v2/home-band.html` and `home-band-closed.html`): one sensor's line, with a
 * picker over all eighteen. Open, it is the live line, a fixed-rate glide over the
 * stream; closed, which is the state most visitors load (US hours are 15:30–22:00
 * CET), it is the last session's path in muted ink with the same state line and
 * countdown as /market. One subscription covers every sensor, so the picker's
 * changes are live too. The default sensor is fixed and nothing re-ranks it: only a
 * pick changes it, the rule the band has always kept (phase6.md Step 10).
 *
 * `/` is static, so the server's session is a cached answer; the shell's poll takes
 * over, and when it disagrees the line is re-read for the new mode.
 */
export function HeroLiveBand({
  entries,
  defaultSymbol,
  initialSeries,
  initialState,
  renderedAt,
}: {
  entries: PriceEntry[];
  defaultSymbol: string;
  initialSeries: BandSeries;
  initialState: MarketState;
  renderedAt: string;
}) {
  const [rows, setRows] = React.useState(() => new Map(entries.map((e) => [e.sensor.symbol, e.row])));
  const [active, setActive] = React.useState(defaultSymbol);
  const session = useSessionState(initialState);
  const frozen = session.session === "closed";
  const mode: BandMode = frozen ? "closed" : "open";

  // Staleness (Phase 7 step 1): seeded from the newest snapshot, so a feed that is
  // dead from first load reports how old the band really is.
  const feed = useLocalFeedTracker(newestTimestamp(entries.map((e) => e.row.asOf)));
  // The subscription outlives a change of session, so it reads the latest through a ref.
  const frozenRef = React.useRef(frozen);
  React.useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);

  React.useEffect(() => {
    return subscribeToStream(
      entries.map((e) => e.sensor.symbol),
      {
        onHeartbeat: () => feed.noteEvent(),
        onQuote: (quote) => {
          feed.noteQuote();
          // Closed: an extended-hours print does not move a band that says it is closed.
          if (frozenRef.current) return;
          setRows((prev) => {
            const current = prev.get(quote.symbol);
            return current ? new Map(prev).set(quote.symbol, applyQuote(current, quote)) : prev;
          });
        },
      },
    );
    // The sensor list only changes on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The line for (sensor, mode). The server seeded the default sensor in the mode it
  // saw; anything else is read on demand and kept, so flipping back costs nothing.
  const cache = React.useRef(new Map<string, BandSeries | null>());
  const seededKey = React.useMemo(() => keyOf(defaultSymbol, initialSeries.mode), [defaultSymbol, initialSeries.mode]);
  const [view, setView] = React.useState<View>({ key: seededKey, series: initialSeries, status: "ready" });
  React.useEffect(() => {
    cache.current.set(seededKey, initialSeries);
  }, [seededKey, initialSeries]);

  const wanted = keyOf(active, mode);
  React.useEffect(() => {
    if (view.key === wanted) return;
    if (cache.current.has(wanted)) {
      const series = cache.current.get(wanted) ?? null;
      setView({ key: wanted, series, status: series ? "ready" : "none" });
      return;
    }
    let cancelled = false;
    setView((v) => ({ ...v, status: "loading" }));
    fetch(`/api/band/${encodeURIComponent(active)}?mode=${mode}`)
      .then((res) => (res.ok ? res.json() : { series: null }))
      .then((data: { series: BandSeries | null }) => {
        if (cancelled) return;
        cache.current.set(wanted, data.series);
        setView({ key: wanted, series: data.series, status: data.series ? "ready" : "none" });
      })
      .catch(() => {
        if (!cancelled) setView({ key: wanted, series: null, status: "none" });
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, active, mode, view.key]);

  const current = entries.find((e) => e.sensor.symbol === active)!.sensor;
  const row = rows.get(active)!;
  const direction = frozen ? "flat" : changeDirection(row);
  const note = frozen && view.series ? seriesNote(view.series) : null;
  const chartLabel = frozen ? `${active}, last session, closed` : `Live price series, ${active}`;
  const ready = view.status === "ready" && view.series !== null && view.key === wanted;

  return (
    <section aria-label={frozen ? "Market feed, closed" : "Live market feed"} className="mt-14" data-session={frozen ? "closed" : "open"}>
      <Container className="flex items-center justify-between gap-4 pb-3.5">
        <FeedStatus
          tracker={feed}
          className="px-3 py-1.5 text-meta font-semibold"
          fresh={
            frozen ? (
              <span className="inline-flex flex-none items-center gap-2 rounded-full border border-hairline bg-panel px-3 py-1.5 font-mono text-meta font-semibold text-text-muted">
                <span aria-hidden="true" className="size-[7px] rounded-full border-[1.5px] border-text-muted" />
                CLOSED
              </span>
            ) : (
              <span className="inline-flex flex-none items-center gap-2 rounded-full border border-market-up/35 bg-market-up/10 px-3 py-1.5 font-mono text-meta font-semibold text-market-up">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-market-up motion-safe:animate-pulse" />
                LIVE
              </span>
            )
          }
        />
        {/* Single row, no wrap: it clips like a real ticker at narrow widths rather than
            stacking. A flex item with non-visible overflow gets an automatic min-width
            of 0, so it shrinks to the space left by the flex-none siblings. The picker
            popover is portalled, so the clip does not touch it. */}
        <div className="flex min-w-0 flex-1 items-center gap-5 font-mono text-small text-text-muted">
          <BandPicker entries={entries} rows={rows} active={active} frozen={frozen} onSelect={setActive} />
          <span data-testid="band-quote" className="min-w-0 flex-1 truncate">
            <b className="font-semibold text-text">{row.asOf === null ? "—" : row.price.toFixed(2)}</b>{" "}
            <span
              className={cn(
                direction === "up" && "text-market-up",
                direction === "down" && "text-market-down",
                direction === "flat" && "text-text-muted",
              )}
            >
              {changeLabel(row)}
              {frozen && closeLabel(row.asOf) ? ` · ${closeLabel(row.asOf)}` : ""}
            </span>
          </span>
          {/* The mock's --text-faint fails AA at this size; text-muted is the established swap. */}
          <span className="hidden flex-none text-meta md:inline-flex">⌘K for all</span>
        </div>
        {/* Transport only, no cadence: real trades have no fixed one. Freshness is the pill's job. */}
        <span className="hidden flex-none text-meta tracking-[0.1em] text-text-muted uppercase md:inline-flex">
          SSE
        </span>
      </Container>

      {frozen && (
        <Container className="-mt-1 pb-3">
          <MarketStateLine
            initial={initialState}
            renderedAt={renderedAt}
            newestAsOf={row.asOf}
            note={note}
            className="mt-0"
          />
        </Container>
      )}

      <div aria-busy={view.status === "loading"} className={cn(view.status === "loading" && "opacity-60 transition-opacity")}>
        {ready && view.series ? (
          frozen ? (
            <BandClosedChart points={view.series.points} label={chartLabel} />
          ) : (
            <BandOpenChart
              key={view.key}
              seed={view.series.points}
              latest={row.asOf === null ? null : row.price}
              label={chartLabel}
            />
          )
        ) : (
          <div className="flex h-56 w-full items-center justify-center font-mono text-meta text-text-muted md:h-64">
            {view.status === "none" ? `No line for ${placeOf(current)} yet.` : " "}
          </div>
        )}
      </div>
    </section>
  );
}
