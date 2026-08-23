"use client";

import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { IndicatorSeriesResponse } from "@/lib/market-schemas";

/**
 * RSI(14) panel (portfolio.md §18 `/market/[symbol]`) — SSR-only from the
 * ticker API's `series=true` indicators response. Deliberately not
 * SSE-live: a correct live update means recomputing RSI over a sliding
 * window, which would mean either polling this endpoint or duplicating
 * Wilder's smoothing client-side — exactly what the Go API's `series=true`
 * extension exists to avoid. Refreshes on navigation/reload only.
 */
export function IndicatorPanel({ indicators }: { indicators: IndicatorSeriesResponse | null }) {
  const points = indicators?.series.rsi;
  if (!points?.length) {
    return <p className="text-sm text-text-muted">RSI unavailable — not enough candle history yet.</p>;
  }

  const data = points.map((p) => ({ time: new Date(p.time).getTime(), value: p.value }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={30} stroke="var(--color-text-faint)" strokeDasharray="3 3" />
          <ReferenceLine y={70} stroke="var(--color-text-faint)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-brand-hover)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
