import { RSI_MIN_BARS } from "@/lib/rsi-path";

/**
 * The price page's intervals and which one it opens on (Phase 21 step 5; I44, I51).
 * Only the four intervals the aggregator always computes: its finest interval is
 * deliberately not offered, because its label differs by environment.
 */
export const INTERVALS = ["5m", "15m", "1h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

/** The period the ticker computes its EMA with by default (`indicators/ema.go`), which the legend and the chart title state. */
export const EMA_PERIOD = 20;

/** The intraday view an open market opens on. */
export const INTRADAY_INTERVAL: Interval = "1h";
const DAILY: Interval = "1d";

export function isInterval(value: string | undefined | null): value is Interval {
  return INTERVALS.includes(value as Interval);
}

/** Heading above the chart: `Daily candles`. */
export const INTERVAL_TITLE: Record<Interval, string> = {
  "5m": "5-minute candles",
  "15m": "15-minute candles",
  "1h": "Hourly candles",
  "1d": "Daily candles",
};

/**
 * The interval the page opens on. A reader's `?interval=` wins. Otherwise the
 * interval follows the session: closed opens on the daily view, since a closed
 * market's intraday view is a squashed afternoon; open opens on the hour, unless
 * there are too few hourly bars for RSI to draw, which falls back to daily (M18).
 */
export function chooseInterval({
  requested,
  closed,
  intradayBars,
}: {
  requested: string | undefined;
  closed: boolean;
  /** How many hourly bars the symbol has; only read when the market is open. */
  intradayBars: number;
}): Interval {
  if (isInterval(requested)) return requested;
  if (closed) return DAILY;
  return intradayBars < RSI_MIN_BARS ? DAILY : INTRADAY_INTERVAL;
}
