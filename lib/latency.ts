import { z } from "zod";

/**
 * Measured latency for the Market Ticker case study (phase7.md
 * Step 6) — the pure half: parsing Prometheus' instant-query responses and
 * shaping them into tiles. No `server-only`, so it's unit-testable; the fetch
 * lives in lib/prometheus-client.ts.
 */

/** 24h: long enough that a quiet hour doesn't blank the tiles, and well
 * inside Prometheus' default 15-day retention. */
export const LATENCY_WINDOW = "24h";

export const LATENCY_QUERIES = {
  p50: `histogram_quantile(0.5, sum by (le) (rate(ticker_ingest_to_fanout_seconds_bucket[${LATENCY_WINDOW}])))`,
  p99: `histogram_quantile(0.99, sum by (le) (rate(ticker_ingest_to_fanout_seconds_bucket[${LATENCY_WINDOW}])))`,
  // The existing ingest counter (ingest/producer.go), not a new one: every
  // tick written to the stream, summed across symbols. Averaged as 5-minute
  // rates over the window, not `rate(…[24h])`: that divides by the whole
  // window, so after any Prometheus restart (fresh volume, minutes of data)
  // it reported ~0.01 ticks/s against a real ~2 — measured, phase7.md step 6.
  throughput: `avg_over_time(sum(rate(ticker_ticks_produced_total[5m]))[${LATENCY_WINDOW}:1m])`,
  peakClients: `max_over_time(ticker_sse_clients[${LATENCY_WINDOW}])`,
} as const;

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

export type LatencyStats =
  | { status: "unreachable" }
  | {
      /** "no-viewers": Prometheus answered, but nobody held a live page open
       * in the window, so the hub delivered nothing to time. */
      status: "ok" | "no-viewers";
      p50Ms: number | null;
      p99Ms: number | null;
      ticksPerSec: number | null;
      peakClients: number | null;
    };

/** Seconds → stats. Latency is the thing that needs viewers; throughput and
 * peak viewers are reported regardless. */
export function toLatencyStats(values: {
  p50: number | null;
  p99: number | null;
  throughput: number | null;
  peakClients: number | null;
}): LatencyStats {
  return {
    status: values.p50 === null || values.p99 === null ? "no-viewers" : "ok",
    p50Ms: values.p50 === null ? null : values.p50 * 1000,
    p99Ms: values.p99 === null ? null : values.p99 * 1000,
    ticksPerSec: values.throughput,
    peakClients: values.peakClients === null ? null : Math.round(values.peakClients),
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
