"use client";

import * as React from "react";
import Link from "next/link";

import { useScrollEdges } from "@/components/atlas/useScrollEdges";
import { useFeedTracker } from "@/components/market/FeedStatus";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Sensor } from "@/lib/market-schemas";
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
 */
export function PricesTable({ entries, renderedAt }: { entries: PriceEntry[]; renderedAt: string }) {
  const [rows, setRows] = React.useState(() => new Map(entries.map((e) => [e.sensor.symbol, e.row])));
  const [sawLive, setSawLive] = React.useState(false);
  const feed = useFeedTracker();
  const edges = useScrollEdges();

  React.useEffect(() => {
    const symbols = entries.map((e) => e.sensor.symbol);
    return subscribeToStream(symbols, {
      onHeartbeat: () => feed.noteEvent(),
      onQuote: (quote) => {
        feed.noteQuote();
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
  const vintage = pricesVintage(asOfs, new Date(renderedAt), sawLive);

  return (
    <div>
      <p data-testid="prices-vintage" className="mb-3 font-mono text-[12.5px] text-text-muted">
        {vintage}
      </p>
      <div className="panel-elevated overflow-hidden rounded-2xl">
        <Table
          containerClassName="atlas-edge-cue"
          containerProps={{ ref: edges.attach, ...PINNED_ATTR, ...edges.attrs }}
        >
          <TableHeader>
            <TableRow>
              <TableHead className={cn("pl-4 pr-2", PINNED)}>Country</TableHead>
              <TableHead className="px-2">Sensor</TableHead>
              <TableHead className="px-2 text-right">Last</TableHead>
              <TableHead className="px-2 pr-4 text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          {GROUPS.map(({ group, title, gloss }) => (
            <TableBody key={group}>
              <TableRow className="border-t border-hairline hover:bg-transparent">
                <TableHead scope="rowgroup" colSpan={4} className="whitespace-normal px-4 pb-1.5 pt-4 text-left">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {title}
                  </span>
                  <span className="ml-2.5 font-mono text-[11.5px] font-normal normal-case tracking-normal text-text-muted">
                    {gloss}
                  </span>
                </TableHead>
              </TableRow>
              {entries
                .filter((e) => e.sensor.group === group)
                .map(({ sensor }) => (
                  <PriceRowView key={sensor.symbol} sensor={sensor} row={rows.get(sensor.symbol)!} tableAsOf={tableAsOf} />
                ))}
            </TableBody>
          ))}
        </Table>
      </div>
    </div>
  );
}

function PriceRowView({ sensor, row, tableAsOf }: { sensor: Sensor; row: PriceRow; tableAsOf: string | null }) {
  const place = sensor.country ?? sensor.theme ?? sensor.name;
  const hasPrice = row.asOf !== null;
  const own = rowVintage(row.asOf, tableAsOf);
  const direction = changeDirection(row);

  return (
    <TableRow data-testid={`market-row-${sensor.symbol}`}>
      {/* On a phone the pinned column must leave room for the figures, so its
          second line wraps instead of widening the column to the whole screen. */}
      <TableCell className={cn("pl-4 pr-2 max-md:w-[12.5rem] max-md:max-w-[12.5rem] max-md:whitespace-normal", PINNED)}>
        <Link
          href={`/market/${sensor.symbol}`}
          aria-label={`${place}, ${sensor.symbol}`}
          className="rounded-sm text-text hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand"
        >
          {place}
        </Link>
        <small className="block text-[11.5px] text-text-muted">
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
      <TableCell className="px-2 font-mono text-[13px] text-text-muted">{sensor.symbol}</TableCell>
      <TableCell className="px-2 text-right font-mono tabular-nums">
        <span data-testid="price" className="text-text">
          {hasPrice ? row.price.toFixed(2) : "—"}
        </span>
        {own && <small className="block text-[11px] text-text-muted">{own}</small>}
      </TableCell>
      <TableCell className={cn("px-2 pr-4 text-right font-mono tabular-nums", DIRECTION[direction])}>
        <span data-testid="change">{changeLabel(row)}</span>
      </TableCell>
    </TableRow>
  );
}
