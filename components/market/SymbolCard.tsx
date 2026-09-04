"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Badge } from "@/components/ui/badge";
import { DayRangeBar } from "@/components/market/DayRangeBar";
import { LiveBadge } from "@/components/market/LiveBadge";
import { volumeFormat } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SymbolSnapshot } from "@/lib/market-schemas";

export interface MarketRow {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  regime: string;
  snapshot: SymbolSnapshot;
  sparkline: number[];
  /** Volume off the most recent fetched candle — labeled "1h" rather than
   * a fabricated day total, since the API has no daily-volume aggregate. */
  lastVolume: number;
}

/** Symbol card (portfolio.md §18 `/market`, mockups/v3) — replaces the flat
 * table row. Presentational only; SymbolCardGrid owns the single shared SSE
 * subscription and passes live rows down. */
export function SymbolCard({ row }: { row: MarketRow }) {
  const { snapshot } = row;
  const up = snapshot.change >= 0;
  const { dayHigh, dayLow, price } = snapshot;

  return (
    <Link
      href={`/market/${row.symbol}`}
      data-testid={`market-row-${row.symbol}`}
      className="panel-elevated flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:border-brand/40 focus-visible:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm text-text">{row.symbol}</span>
          <span className="text-xs text-text-muted">{row.name}</span>
        </div>
        <Badge variant="outline" className="border-hairline bg-panel-2 font-mono text-[10px] text-text-muted">
          {row.regime.replace(/_/g, "-")}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2">
        <span data-testid="price" className="font-mono text-2xl font-semibold text-text tabular-nums">
          {price.toFixed(2)}
        </span>
        <span className={cn("font-mono text-sm font-medium", up ? "text-market-up" : "text-market-down")}>
          {up ? "+" : ""}
          {snapshot.changePercent.toFixed(2)}%
        </span>
        <LiveBadge simulated={snapshot.simulated} className="ml-auto" />
      </div>

      <div className="h-14 w-full">
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

      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <DayRangeBar low={dayLow} high={dayHigh} price={price} />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[9px] tracking-wider text-text-faint uppercase">Vol · 1h</span>
          <span className="font-mono text-xs text-read tabular-nums">{volumeFormat.format(row.lastVolume)}</span>
        </div>
      </div>
    </Link>
  );
}
