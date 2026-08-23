"use client";

import * as React from "react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LiveBadge } from "@/components/market/LiveBadge";
import { subscribeToStream } from "@/lib/sse";
import { cn } from "@/lib/utils";
import type { SymbolSnapshot } from "@/lib/market-schemas";

export interface MarketRow {
  symbol: string;
  name: string;
  snapshot: SymbolSnapshot;
  sparkline: number[];
}

/**
 * Live Markets table (portfolio.md §18 `/market`) — SSR initial snapshots
 * + a per-row sparkline (recent candle closes), then live price/change
 * updates over SSE `quote` events (§9.2).
 */
export function MarketTable({ rows: initialRows }: { rows: MarketRow[] }) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Trend</TableHead>
          <TableHead className="text-right">Last</TableHead>
          <TableHead className="text-right">Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const up = row.snapshot.change >= 0;
          return (
            <TableRow key={row.symbol}>
              <TableCell>
                <Link href={`/market/${row.symbol}`} className="flex flex-col hover:text-brand">
                  <span className="font-mono">{row.symbol}</span>
                  <span className="text-xs text-text-muted">{row.name}</span>
                </Link>
              </TableCell>
              <TableCell>
                <div className="h-7 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={row.sparkline.map((value) => ({ value }))}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={up ? "var(--color-market-up)" : "var(--color-market-down)"}
                        fill={up ? "var(--color-market-up)" : "var(--color-market-down)"}
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {row.snapshot.price.toFixed(2)}
                <LiveBadge simulated={row.snapshot.simulated} className="ml-2" />
              </TableCell>
              <TableCell
                className={cn("text-right font-mono", up ? "text-market-up" : "text-market-down")}
              >
                {up ? "+" : ""}
                {row.snapshot.changePercent.toFixed(2)}%
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
