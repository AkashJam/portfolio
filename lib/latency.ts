import { z } from "zod";

/**
 * Measured latency for the Market Ticker case study (phase7.md
 * Step 6) — the pure half: parsing Prometheus' instant-query responses and
 * shaping them into tiles. No `server-only`, so it's unit-testable; the fetch
 * lives in lib/prometheus-client.ts.
 */

/**
 * The windows each tile tries, shortest first (phase18.md step 2, M8). 24h is
 * the honest recent reading; a quiet day falls back to a week, then to all
 * Prometheus retains (its 15-day default, which infra does not override), and
 * each tile says which window it answers from. Dashes only when nothing in
 * retention has a sample.
 */
export const LATENCY_WINDOWS = ["24h", "7d", "15d"] as const;
export type LatencyWindow = (typeof LATENCY_WINDOWS)[number];
export const LONGEST_WINDOW = LATENCY_WINDOWS[LATENCY_WINDOWS.length - 1];

/**
 * The hub's last finite histogram bucket (`ticker/internal/sse/hub.go`, 10 s).
 * `histogram_quantile` reports a quantile that falls past it as exactly this
 * edge, so a value at or above it is "more than", never a measurement
 * (phase18.md step 2, M27). Keep in step with the buckets.
 */
export const LATENCY_CEILING_SECONDS = 10;

// The span runs from the producer receiving a tick to the hub's SSE write.
// The histogram was renamed when the span changed (it used to start at the
// tick's own stamp, which for a Finnhub bar is its first second), so no window
// mixes the two definitions.
const FANOUT = "ticker_pipeline_fanout_seconds_bucket";

export const latencyQueries = (window: LatencyWindow) => ({
  p50: `histogram_quantile(0.5, sum by (le) (rate(${FANOUT}[${window}])))`,
  p99: `histogram_quantile(0.99, sum by (le) (rate(${FANOUT}[${window}])))`,
  // The existing ingest counter (ingest/producer.go), not a new one: every
  // tick written to the stream, summed across symbols. Averaged as 5-minute
  // rates over the window, not `rate(…[24h])`: that divides by the whole
  // window, so after any Prometheus restart (fresh volume, minutes of data)
  // it reported ~0.01 ticks/s against a real ~2 — measured, phase7.md step 6.
  throughput: `avg_over_time(sum(rate(ticker_ticks_produced_total[5m]))[${window}:1m])`,
  peakClients: `max_over_time(ticker_sse_clients[${window}])`,
});

const instantQuerySchema = z.object({
  status: z.literal("success"),
  data: z.object({
    resultType: z.literal("vector"),
    result: z.array(z.object({ value: z.tuple([z.number(), z.string()]) })),
  }),
});

/**
 * One instant-query response → its value. `null` means no measurement exists
 * (no series, or NaN — histogram_quantile over zero samples); a failed or
 * malformed response throws, because that's a different state: Prometheus
 * unreachable, not "nothing to report".
 */
export function parseInstantValue(json: unknown): number | null {
  const parsed = instantQuerySchema.parse(json);
  const first = parsed.data.result[0];
  if (!first) return null;
  const value = Number(first.value[1]);
  return Number.isFinite(value) ? value : null;
}

/** One tile's answer: the value, the window it came from, and whether the
 * quantile fell past the histogram's last bucket (then `value` is that edge and
 * the tile says "more than"). */
export interface Reading {
  value: number | null;
  window: LatencyWindow | null;
  pastCeiling?: boolean;
}

export const NO_READING: Reading = { value: null, window: null };

export type LatencyStats =
  | { status: "unreachable" }
  | {
      /** "no-viewers": Prometheus answered, but nobody held a live page open
       * in any retained window, so the hub delivered nothing to time. */
      status: "ok" | "no-viewers";
      p50: Reading;
      p99: Reading;
      ticksPerSec: Reading;
      peakClients: Reading;
    };

/** A quantile in seconds → a reading in ms, flagging one past the last bucket. */
export function quantileReading(seconds: number | null, window: LatencyWindow): Reading {
  if (seconds === null) return NO_READING;
  return { value: seconds * 1000, window, pastCeiling: seconds >= LATENCY_CEILING_SECONDS };
}

/** Readings → stats. Latency is the thing that needs viewers; throughput and
 * peak viewers are reported regardless. */
export function toLatencyStats(readings: {
  p50: Reading;
  p99: Reading;
  throughput: Reading;
  peakClients: Reading;
}): LatencyStats {
  return {
    status: readings.p50.value === null || readings.p99.value === null ? "no-viewers" : "ok",
    p50: readings.p50,
    p99: readings.p99,
    ticksPerSec: readings.throughput,
    peakClients:
      readings.peakClients.value === null
        ? NO_READING
        : { ...readings.peakClients, value: Math.round(readings.peakClients.value) },
  };
}

/** One decimal below 10 (4.7 ms, 1.9 ticks/s), whole numbers above. */
export function formatMeasure(value: number | null): string {
  if (value === null) return "—";
  return value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString("en-US");
}

/** Whole things (viewers): never "0.0". */
export function formatCount(value: number | null): string {
  return value === null ? "—" : Math.round(value).toLocaleString("en-US");
}

/** A latency reading as a tile shows it: past the last bucket it is a bound,
 * never the edge dressed as a measurement. */
export function formatLatency(reading: Reading): string {
  if (reading.value === null) return "—";
  return reading.pastCeiling ? `> ${formatMeasure(reading.value)}` : formatMeasure(reading.value);
}

/** The window a tile answers from, as its label ends: "· 24h". */
export function windowSuffix(reading: Reading): string {
  return reading.window ? ` · ${reading.window}` : "";
}
