"use client";

import * as React from "react";

import { IndicatorPanel } from "@/components/market/IndicatorPanel";
import { IntervalSwitcher } from "@/components/market/IntervalSwitcher";
import { PriceChart } from "@/components/market/PriceChart";
import { useSessionState } from "@/components/market/useMarketSession";
import type { Candle, IndicatorSeriesResponse } from "@/lib/market-schemas";
import type { MarketState } from "@/lib/market-state";
import { EMA_PERIOD, INTERVAL_TITLE, isInterval } from "@/lib/price-interval";
import { RSI_PERIOD, rsiReading } from "@/lib/rsi-path";

interface CandlesApiResponse {
  candles: Candle[];
  indicators: IndicatorSeriesResponse | null;
}

/**
 * Owns the interval switcher + chart/indicator state for
 * `/market/[sensor]/price` (mockups/v3). The chart freezes with the header
 * while the regular session is closed (Phase 14 step 8). Seeded with the page's SSR-fetched data
 * for the default interval so switching is the only client round-trip.
 */
export function SymbolChartPanel({
  symbol,
  initialInterval,
  initialCandles,
  initialIndicators,
  initialState,
}: {
  symbol: string;
  initialInterval: string;
  initialCandles: Candle[];
  initialIndicators: IndicatorSeriesResponse | null;
  initialState: MarketState;
}) {
  const frozen = useSessionState(initialState).session === "closed";
  const [selectedInterval, setSelectedInterval] = React.useState(initialInterval);
  const [candles, setCandles] = React.useState(initialCandles);
  const [indicators, setIndicators] = React.useState(initialIndicators);
  const [loading, setLoading] = React.useState(false);

  const handleChange = React.useCallback(
    (nextInterval: string) => {
      if (nextInterval === selectedInterval) return;
      setSelectedInterval(nextInterval);
      // The view is in the address (I51): a reload or a shared link keeps it, and Back leaves the page.
      window.history.replaceState(null, "", `?interval=${nextInterval}`);
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

  const ema = indicators?.series.ema?.at(-1)?.value;
  const rsi = indicators?.series.rsi?.at(-1)?.value;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lead font-medium">{isInterval(selectedInterval) ? INTERVAL_TITLE[selectedInterval] : "Candles"}</h2>
        <IntervalSwitcher value={selectedInterval} onChange={handleChange} />
      </div>
      <p data-testid="chart-legend" className="flex flex-wrap gap-x-5 gap-y-1 text-meta text-text-muted">
        {ema !== undefined && (
          <span>
            <i aria-hidden="true" className="mr-1.5 inline-block h-0.5 w-4 align-middle" style={{ background: "var(--brand-hover)" }} />
            EMA {EMA_PERIOD} <b className="font-medium text-text">{ema.toFixed(2)}</b>
          </span>
        )}
        <span>Hollow candles closed up, filled closed down</span>
      </p>
      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PriceChart symbol={symbol} interval={selectedInterval} initialCandles={candles} initialIndicators={indicators} frozen={frozen} />
      </div>
      <IndicatorPanel indicators={indicators} bars={candles.length} />
      {rsi !== undefined && (
        <p data-testid="rsi-reading" className="text-meta text-text-muted">
          RSI {RSI_PERIOD} <b className="font-medium text-text">{rsi.toFixed(1)}</b> · {rsiReading(rsi)}
        </p>
      )}
    </div>
  );
}
