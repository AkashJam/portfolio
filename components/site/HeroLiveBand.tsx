"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { subscribeToStream } from "@/lib/sse";
import { Container } from "@/components/shell/Container";
import type { SymbolSnapshot } from "@/lib/market-schemas";

interface TapeRow {
  symbol: string;
  price: number;
  changePercent: number;
  prevClose: number;
}

/**
 * Home hero's live band (portfolio.md §15 Phase 6 step 6) — a ticker tape
 * of the sim roster plus a live area chart of one symbol, replacing the
 * static glow orb + LiveChip pill. One shared subscription drives both,
 * matching SymbolCardGrid's "single owner, presentational children" shape
 * rather than opening a separate EventSource per widget.
 */
export function HeroLiveBand({
  initialSnapshots,
  chartSymbol,
  initialSparkline,
}: {
  initialSnapshots: SymbolSnapshot[];
  chartSymbol: string;
  initialSparkline: number[];
}) {
  const [rows, setRows] = React.useState<TapeRow[]>(() =>
    initialSnapshots.map((s) => ({
      symbol: s.symbol,
      price: s.price,
      changePercent: s.changePercent,
      prevClose: s.prevClose,
    }))
  );
  const [sparkline, setSparkline] = React.useState(initialSparkline);

  React.useEffect(() => {
    const symbols = initialSnapshots.map((s) => s.symbol);
    return subscribeToStream(symbols, {
      onQuote: (quote) => {
        setRows((prev) =>
          prev.map((row) =>
            row.symbol === quote.symbol
              ? {
                  ...row,
                  price: quote.price,
                  changePercent: row.prevClose
                    ? ((quote.price - row.prevClose) / row.prevClose) * 100
                    : 0,
                }
              : row
          )
        );
        if (quote.symbol === chartSymbol) {
          setSparkline((prev) => [...prev.slice(1), quote.price]);
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartUp = sparkline.length > 1 ? sparkline.at(-1)! >= sparkline[0] : true;
  const chartColor = chartUp ? "var(--color-market-up)" : "var(--color-market-down)";

  return (
    <section aria-label="Live market feed" className="mt-14">
      <Container className="flex flex-wrap items-center justify-between gap-4 pb-3.5">
        <span className="inline-flex flex-none items-center gap-2 rounded-full border border-market-up/35 bg-market-up/10 px-3 py-1.5 font-mono text-xs font-semibold text-market-up">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-market-up motion-safe:animate-pulse"
          />
          LIVE
        </span>
        <div className="flex flex-1 flex-wrap gap-7 overflow-hidden font-mono text-[13px] text-text-muted">
          {rows.map((row) => {
            const up = row.changePercent >= 0;
            return (
              <span key={row.symbol}>
                {row.symbol} <b className="font-semibold text-text">{row.price.toFixed(2)}</b>{" "}
                <span className={up ? "text-market-up" : "text-market-down"}>
                  {up ? "+" : ""}
                  {row.changePercent.toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
        <span className="flex-none font-mono text-[11px] tracking-[0.1em] text-text-muted uppercase">
          SSE · 1s
        </span>
      </Container>

      <div className="h-56 w-full md:h-64" role="img" aria-label="Live price series">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline.map((value) => ({ value }))}>
            <defs>
              <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.75}
              fill="url(#hero-chart-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
