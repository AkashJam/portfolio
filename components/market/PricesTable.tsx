"use client";

import * as React from "react";
import Link from "next/link";

import { SwipeHint } from "@/components/atlas/SwipeHint";
import { useScrollEdges } from "@/components/atlas/useScrollEdges";
import { useFeedTracker } from "@/components/market/FeedStatus";
import { useNow, useSessionState } from "@/components/market/useMarketSession";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { frozenLine } from "@/lib/market-session";
import { Sparkline } from "@/components/market/Sparkline";
import { sigmaBarWidth } from "@/lib/band-path";
import { sigmaLabel } from "@/lib/ledger";
import type { Sensor, TapeSensor } from "@/lib/market-schemas";
import { pastThreshold } from "@/lib/tape";
import type { MarketState } from "@/lib/market-state";
import {
  applyQuote,
  changeDirection,
  changeLabel,
  newestVintage,
  pricesVintage,
  rowVintage,
  thinListing,
  type PriceRow,
} from "@/lib/prices";
import { sensorHref } from "@/lib/sensor-title";
import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";

/** A sensor and the price it was last known at. */
export interface PriceEntry {
  sensor: Sensor;
  row: PriceRow;
}

/** Tells the scroll cue the first column is pinned, so its left cue is a shadow, not a mask. */
const PINNED_ATTR = { "data-pinned": "" };

/**
 * Below 768px the country column stays pinned while the figures scroll under
 * it (bearing.md #107): opaque, with a hairline on its right edge. The same
 * treatment as /atlas's table.
 */
const PINNED =
  "max-md:sticky max-md:left-0 max-md:z-[1] max-md:bg-panel max-md:shadow-[1px_0_0_var(--hairline)]";

const GROUPS = [
  {
    group: "country" as const,
    title: "Countries",
    gloss: "domestic banks and telecoms — a move here is about that country · fixed order, Americas to Asia-Pacific",
  },
  {
    group: "global" as const,
    title: "Global",
    gloss: "names whose moves are about the world rather than about America",
  },
];

const DIRECTION = { up: "text-market-up", down: "text-market-down", flat: "text-text-muted" } as const;

/**
 * The Prices table (portfolio.md §15 Phase 14 step 3): the eighteen sensors in
 * the ticker's fixed order, never re-sorted by movement (bearing.md #92), one
 * shared SSE subscription for every row. It owns the page's subscription, so
 * the staleness pill in the header reads the same tracker through the
 * FeedFreshnessProvider.
 *
 * While the regular session is closed the table is frozen (Phase 14 step 7): live
 * quotes that still arrive, extended-hours trades, are not applied, the ink goes
 * to muted with no up or down colour, and the as-of line says how old the prices
 * are and when it opens. Frozen is drawn in ink, not opacity: the mock's 55%
 * opacity takes the muted second lines to about 3:1 and fails AA in the state most
 * readers see.
 */
export function PricesTable({
  entries,
  renderedAt,
  initialState,
  tape,
  tripped,
}: {
  entries: PriceEntry[];
  renderedAt: string;
  initialState: MarketState;
  /** The tape by symbol: the sparkline and the "σ · last close" column. Empty when it could not be read. */
  tape: Map<string, TapeSensor>;
  /** The symbols that tripped at the last close, whose rows are tinted. */
  tripped: Set<string>;
}) {
  const [rows, setRows] = React.useState(() => new Map(entries.map((e) => [e.sensor.symbol, e.row])));
  const [sawLive, setSawLive] = React.useState(false);
  const feed = useFeedTracker();
  const edges = useScrollEdges();
  const session = useSessionState(initialState);
  const frozen = session.session === "closed";
  const now = useNow(renderedAt);
  // The subscription outlives a change of session, so it reads the latest through a ref.
  const frozenRef = React.useRef(frozen);
  React.useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);

  React.useEffect(() => {
    const symbols = entries.map((e) => e.sensor.symbol);
    return subscribeToStream(symbols, {
      onHeartbeat: () => feed.noteEvent(),
      onQuote: (quote) => {
        feed.noteQuote();
        // Closed: an extended-hours print does not move a table that says it is frozen.
        if (frozenRef.current) return;
        setSawLive(true);
        setRows((prev) => {
          const current = prev.get(quote.symbol);
          if (!current) return prev;
          return new Map(prev).set(quote.symbol, applyQuote(current, quote));
        });
      },
    });
    // The sensor list only changes on navigation (a new page load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const asOfs = entries.map((e) => rows.get(e.sensor.symbol)?.asOf ?? null);
  const tableAsOf = newestVintage(asOfs);
  const vintage = frozen
    ? frozenLine(pricesVintage(asOfs, now, false), session.opensAt, now)
    : pricesVintage(asOfs, new Date(renderedAt), sawLive);

  return (
    <div>
      <p data-testid="prices-vintage" className="mb-3 font-mono text-meta text-text-muted">
        {vintage}
      </p>
      <SwipeHint />
      <div data-session={frozen ? "closed" : "open"} className="panel-elevated overflow-hidden rounded-2xl">
        <Table
          containerClassName="atlas-edge-cue"
          containerProps={{ ref: edges.attach, ...PINNED_ATTR, ...edges.attrs }}
        >
          <TableHeader>
            <TableRow>
              <TableHead className={cn("pl-4 pr-2", PINNED)}>Country</TableHead>
              <TableHead className="px-2">Sensor</TableHead>
              {/* Below 768px the sparkline gives way: the figures must stay on screen beside the pinned country column (bearing.md #107). */}
              <TableHead className="px-2 max-md:hidden">60 sessions</TableHead>
              <TableHead className="px-2 text-right">Last</TableHead>
              <TableHead className="px-2 text-right">Change</TableHead>
              <TableHead className="px-2 pr-4 text-right">σ · last close</TableHead>
            </TableRow>
          </TableHeader>
          {GROUPS.map(({ group, title, gloss }) => (
            <TableBody key={group}>
              <TableRow className="border-t border-hairline hover:bg-transparent">
                <TableHead scope="rowgroup" colSpan={6} className="whitespace-normal px-4 pb-1.5 pt-4 text-left">
                  <span className="text-meta font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {title}
                  </span>
                  <span className="ml-2.5 font-mono text-meta font-normal normal-case tracking-normal text-text-muted">
                    {gloss}
                  </span>
                </TableHead>
              </TableRow>
              {entries
                .filter((e) => e.sensor.group === group)
                .map(({ sensor }) => (
                  <PriceRowView
                    key={sensor.symbol}
                    sensor={sensor}
                    row={rows.get(sensor.symbol)!}
                    tableAsOf={tableAsOf}
                    frozen={frozen}
                    tape={tape.get(sensor.symbol)}
                    tripped={tripped.has(sensor.symbol)}
                  />
                ))}
            </TableBody>
          ))}
        </Table>
      </div>
    </div>
  );
}

function PriceRowView({
  sensor,
  row,
  tableAsOf,
  frozen,
  tape,
  tripped,
}: {
  sensor: Sensor;
  row: PriceRow;
  tableAsOf: string | null;
  frozen: boolean;
  tape: TapeSensor | undefined;
  tripped: boolean;
}) {
  const place = sensor.country ?? sensor.theme ?? sensor.name;
  const hasPrice = row.asOf !== null;
  const own = rowVintage(row.asOf, tableAsOf);
  // Frozen: no up or down colour, because nothing is moving.
  const direction = frozen ? "flat" : changeDirection(row);

  return (
    <TableRow data-testid={`market-row-${sensor.symbol}`} data-tripped={tripped ? "true" : undefined} className={tripped ? "bg-market-down/[0.07]" : undefined}>
      {/* On a phone the pinned column must leave room for the figures, so its
          second line wraps instead of widening the column to the whole screen. */}
      <TableCell className={cn("pl-4 pr-2 max-md:w-[12.5rem] max-md:max-w-[12.5rem] max-md:whitespace-normal", PINNED)}>
        <Link
          href={sensorHref(sensor)}
          aria-label={`${place}, ${sensor.symbol}`}
          className={cn(
            "rounded-sm hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand",
            frozen ? "text-text-muted" : "text-text",
          )}
        >
          {place}
        </Link>
        <small className="block text-meta text-text-muted">
          {sensor.name}
          {sensor.note ? ` · ${sensor.note}` : ""}
          {sensor.liquidityUsdM !== null && sensor.liquidityAsOf !== null && (
            <>
              {" · "}
              <span data-testid="thin-listing">{thinListing(sensor.liquidityUsdM, sensor.liquidityAsOf)}</span>
            </>
          )}
        </small>
      </TableCell>
      <TableCell className="px-2 font-mono text-small text-text-muted">{sensor.symbol}</TableCell>
      <TableCell className="px-2 py-2 max-md:hidden">
        <Sparkline
          closes={tape?.closes ?? []}
          label={`${sensor.symbol}, its last sixty closes`}
          tripped={tripped}
          direction={tape?.z != null && tape.z > 0 ? "up" : "down"}
        />
      </TableCell>
      <TableCell className="px-2 text-right font-mono tabular-nums">
        <span data-testid="price" className={frozen ? "text-text-muted" : "text-text"}>
          {hasPrice ? row.price.toFixed(2) : "—"}
        </span>
        {own && <small className="block text-meta text-text-muted">{own}</small>}
      </TableCell>
      <TableCell className={cn("px-2 text-right font-mono tabular-nums", DIRECTION[direction])}>
        <span data-testid="change">{changeLabel(row)}</span>
      </TableCell>
      <TableCell className="px-2 pr-4 text-right">
        <SigmaCell tape={tape} />
      </TableCell>
    </TableRow>
  );
}

/**
 * σ · last close: the trigger's own z on the last close, from the tape, so the
 * column reads the number that would have fired. It does not tick: the sector
 * baskets it is measured against print only at the close, so a live σ would be a
 * different number from the one that fires (portfolio.md §15 Phase 15 step 7).
 */
function SigmaCell({ tape }: { tape: TapeSensor | undefined }) {
  if (!tape || tape.z === null) {
    return (
      <span data-testid="sigma-none" title="Not enough history to judge this sensor yet" className="font-mono text-small text-text-muted">
        <span aria-hidden="true">—</span>
        <span className="sr-only">not enough history yet</span>
      </span>
    );
  }
  const past = pastThreshold(tape.z);
  return (
    <span data-testid="sigma" className="inline-flex items-center justify-end gap-[9px]">
      <i
        aria-hidden="true"
        style={{ width: sigmaBarWidth(tape.z) }}
        className={cn("block h-[5px] rounded-[2px]", past === "up" ? "bg-market-up" : past === "down" ? "bg-market-down" : "bg-text-muted")}
      />
      <b
        className={cn(
          "min-w-[3.1rem] text-right font-mono text-small font-semibold tabular-nums",
          past === "up" ? "text-market-up" : past === "down" ? "text-market-down" : "text-text-muted",
        )}
      >
        {sigmaLabel(tape.z)}
      </b>
    </span>
  );
}
