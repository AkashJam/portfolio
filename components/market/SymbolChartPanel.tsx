"use client";

import * as React from "react";

import { IndicatorPanel } from "@/components/market/IndicatorPanel";
import { IntervalSwitcher } from "@/components/market/IntervalSwitcher";
import { PriceChart } from "@/components/market/PriceChart";
import type { Candle, IndicatorSeriesResponse } from "@/lib/market-schemas";

interface CandlesApiResponse {
  candles: Candle[];
  indicators: IndicatorSeriesResponse | null;
}

/**
 * Owns the interval switcher + chart/indicator state for
 * `/market/[symbol]` (mockups/v3). Seeded with the page's SSR-fetched data
 * for the default interval so switching is the only client round-trip.
 */
export function SymbolChartPanel({
  symbol,
  initialInterval,
  initialCandles,
  initialIndicators,
}: {
  symbol: string;
  initialInterval: string;
  initialCandles: Candle[];
  initialIndicators: IndicatorSeriesResponse | null;
}) {
  const [selectedInterval, setSelectedInterval] = React.useState(initialInterval);
  const [candles, setCandles] = React.useState(initialCandles);
  const [indicators, setIndicators] = React.useState(initialIndicators);
  const [loading, setLoading] = React.useState(false);

  const handleChange = React.useCallback(
    (nextInterval: string) => {
      if (nextInterval === selectedInterval) return;
      setSelectedInterval(nextInterval);
      setLoading(true);
      fetch(`/api/market/${encodeURIComponent(symbol)}/candles?interval=${nextInterval}`)
        .then((res) => res.json())
        .then((data: CandlesApiResponse) => {
          setCandles(data.candles);
          setIndicators(data.indicators);
        })
        .catch(() => {
          // Keep showing the previous interval's data rather than clearing
          // the chart on a transient fetch failure (§13 honest degradation).
        })
        .finally(() => setLoading(false));
    },
    [selectedInterval, symbol]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Price · candlesticks</h2>
        <IntervalSwitcher value={selectedInterval} onChange={handleChange} />
      </div>
      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PriceChart symbol={symbol} interval={selectedInterval} initialCandles={candles} initialIndicators={indicators} />
      </div>
      <IndicatorPanel indicators={indicators} />
    </div>
  );
}
