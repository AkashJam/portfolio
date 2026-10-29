"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SwipeHint } from "@/components/atlas/SwipeHint";
import { useScrollEdges } from "@/components/atlas/useScrollEdges";
import { useFeedTracker } from "@/components/market/FeedStatus";
import { useSessionState } from "@/components/market/useMarketSession";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkline } from "@/components/market/Sparkline";
import type { Sensor, TapeSensor } from "@/lib/market-schemas";
import type { MarketState } from "@/lib/market-state";
import {
  applyQuote,
  changeDirection,
  changeLabel,
  newestVintage,
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

const DIRECTION = { up: "text-market-up", down: "text-market-down", flat: "text-text-muted" } as const;

/** The strong rule between the thirteen countries and the five global companies (owner, 2026-10-22). */
const GROUP_RULE = "border-t-2 border-t-text/25";

/**
 * The Prices table (portfolio.md §15 Phase 14 step 3): the eighteen sensors in
 * the ticker's fixed order, never re-sorted by movement (bearing.md #92), one
 * shared SSE subscription for every row. It owns the page's subscription, so
 * the staleness pill in the header reads the same tracker through the
 * FeedFreshnessProvider.
 *
 * While the regular session is closed the table is frozen (Phase 14 step 7): live
 * quotes that still arrive, extended-hours trades, are not applied, the ink goes
 * to muted with no up or down colour. How old the prices are, and when it opens,
 * is the state row's to say (MarketHeadState). Frozen is drawn in ink, not opacity: the mock's 55%
 * opacity takes the muted second lines to about 3:1 and fails AA in the state most
 * readers see.
 */
export function PricesTable({
  entries,
  initialState,
  tape,
  tripped,
}: {
  entries: PriceEntry[];
  initialState: MarketState;
  /** The tape by symbol: the sparkline and its direction. Empty when it could not be read. */
  tape: Map<string, TapeSensor>;
  /** The symbols that tripped at the last close, whose rows are tinted. */
  tripped: Set<string>;
}) {
  const [rows, setRows] = React.useState(() => new Map(entries.map((e) => [e.sensor.symbol, e.row])));
  const feed = useFeedTracker();
  const edges = useScrollEdges();
  const session = useSessionState(initialState);
  const frozen = session.session === "closed";
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

  return (
    <div>
      <SwipeHint />
      <div data-session={frozen ? "closed" : "open"} className="panel-elevated overflow-hidden rounded-2xl">
        <Table
          containerClassName="atlas-edge-cue"
          containerProps={{ ref: edges.attach, ...PINNED_ATTR, ...edges.attrs }}
        >
          <TableHeader>
            <TableRow>
              <TableHead className={cn("pl-4 pr-2", PINNED)}>Country</TableHead>
              <TableHead className="px-2">Last 60 trading days</TableHead>
              {/* Phones drop Last only (I45): Country, the sparkline and Change stay beside the pinned column (bearing.md #107). */}
              <TableHead className="px-2 text-right max-md:hidden">Last</TableHead>
              <TableHead className="px-2 pr-4 text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(({ sensor }, i) => (
              <PriceRowView
                key={sensor.symbol}
                sensor={sensor}
                row={rows.get(sensor.symbol)!}
                tableAsOf={tableAsOf}
                frozen={frozen}
                tape={tape.get(sensor.symbol)}
                tripped={tripped.has(sensor.symbol)}
                ruleAbove={i > 0 && sensor.group !== entries[i - 1].sensor.group}
              />
            ))}
          </TableBody>
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
  ruleAbove,
}: {
  sensor: Sensor;
  row: PriceRow;
  tableAsOf: string | null;
  frozen: boolean;
  tape: TapeSensor | undefined;
  tripped: boolean;
  ruleAbove: boolean;
}) {
  const router = useRouter();
  const place = sensor.country ?? sensor.theme ?? sensor.name;
  const hasPrice = row.asOf !== null;
  const own = rowVintage(row.asOf, tableAsOf);
  // Frozen: no up or down colour, because nothing is moving.
  const direction = frozen ? "flat" : changeDirection(row);

  return (
    // The whole row opens the record (I39). The country's link stays the one tab stop and the
    // accessible name; the click is for the pointer, and leaves a text selection alone.
    <TableRow
      data-testid={`market-row-${sensor.symbol}`}
      data-tripped={tripped ? "true" : undefined}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a") || window.getSelection()?.toString()) return;
        router.push(sensorHref(sensor));
      }}
      className={cn("cursor-pointer", tripped && "bg-market-down/[0.07]", ruleAbove && GROUP_RULE)}
    >
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
              <span
                data-testid="thin-listing"
                title={thinListing(sensor.liquidityUsdM, sensor.liquidityAsOf)}
                className="cursor-help underline decoration-dotted underline-offset-2"
              >
                lightly traded
              </span>
            </>
          )}
        </small>
      </TableCell>
      <TableCell className="px-2 py-2">
        <Sparkline
          closes={tape?.closes ?? []}
          label={`${sensor.symbol}, its last sixty closes`}
          tripped={tripped}
          direction={tape?.z != null && tape.z > 0 ? "up" : "down"}
        />
      </TableCell>
      <TableCell className="px-2 text-right font-mono tabular-nums max-md:hidden">
        <span data-testid="price" className={frozen ? "text-text-muted" : "text-text"}>
          {hasPrice ? row.price.toFixed(2) : "—"}
        </span>
        {own && <small className="block text-meta text-text-muted">{own}</small>}
      </TableCell>
      <TableCell className={cn("px-2 pr-4 text-right font-mono tabular-nums", DIRECTION[direction])}>
        <span data-testid="change">{changeLabel(row)}</span>
      </TableCell>
    </TableRow>
  );
}
