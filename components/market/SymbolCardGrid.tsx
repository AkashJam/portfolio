"use client";

import * as React from "react";

import { SymbolCard, type MarketRow } from "@/components/market/SymbolCard";
import { subscribeToStream } from "@/lib/sse";

/**
 * Live Markets board (portfolio.md §18 `/market`, mockups/v3) — a grid of
 * SymbolCards fed by one shared SSE subscription for every symbol on the
 * page (matching the single-EventSource-for-all-rows design the table this
 * replaced already used, rather than one connection per card).
 */
export function SymbolCardGrid({ rows: initialRows }: { rows: MarketRow[] }) {
  const [rows, setRows] = React.useState(initialRows);

  React.useEffect(() => {
    const symbols = initialRows.map((r) => r.symbol);
    return subscribeToStream(symbols, {
      onQuote: (quote) => {
        setRows((prev) =>
          prev.map((row) =>
            row.symbol === quote.symbol
              ? {
                  ...row,
                  snapshot: {
                    ...row.snapshot,
                    price: quote.price,
                    change: quote.price - row.snapshot.prevClose,
                    changePercent: ((quote.price - row.snapshot.prevClose) / row.snapshot.prevClose) * 100,
                    updatedAt: quote.time,
                    simulated: quote.simulated,
                  },
                  sparkline: [...row.sparkline.slice(1), quote.price],
                }
              : row
          )
        );
      },
    });
    // initialRows only ever changes on navigation (new page load), not on
    // every render — safe to key the effect on the page's initial symbol set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <SymbolCard key={row.symbol} row={row} />
      ))}
    </div>
  );
}
