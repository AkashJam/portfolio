import "server-only";
import { unstable_rethrow } from "next/navigation";

import {
  LATENCY_WINDOWS,
  NO_READING,
  latencyQueries,
  parseInstantValue,
  quantileReading,
  toLatencyStats,
  type LatencyStats,
  type LatencyWindow,
  type Reading,
} from "@/lib/latency";

/**
 * Server-only reads of Prometheus' own query API over the Docker network
 * (phase7.md Step 6) — same shape as lib/ticker-client.ts:
 * cached for the page's revalidate window, and never throws. Unset in dev
 * and CI, so the case study prerenders its honest placeholder there and ISR
 * fills in measured numbers on the box.
 */
const PROMETHEUS_URL = process.env.PROMETHEUS_URL;
const REVALIDATE_SECONDS = 300;

async function query(promql: string): Promise<number | null> {
  const res = await fetch(`${PROMETHEUS_URL}/api/v1/query?${new URLSearchParams({ query: promql })}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`prometheus-client: ${res.status}`);
  return parseInstantValue(await res.json());
}

/** The first window whose reading `accept`s, or the last one tried's. */
async function firstWindow(
  read: (window: LatencyWindow) => Promise<Reading>,
  accept: (reading: Reading) => boolean = (r) => r.value !== null,
): Promise<Reading> {
  let last: Reading = NO_READING;
  for (const window of LATENCY_WINDOWS) {
    last = await read(window);
    if (accept(last)) return last;
  }
  return last;
}

const reading = (value: number | null, window: LatencyWindow): Reading => (value === null ? NO_READING : { value, window });

export async function getLatencyStats(): Promise<LatencyStats> {
  if (!PROMETHEUS_URL) return { status: "unreachable" };
  try {
    // Both quantiles come from one window: the first with deliveries to time.
    let p50: Reading = NO_READING;
    let p99: Reading = NO_READING;
    const latency = (async () => {
      for (const window of LATENCY_WINDOWS) {
        const q = latencyQueries(window);
        const [a, b] = await Promise.all([query(q.p50), query(q.p99)]);
        if (a !== null && b !== null) {
          p50 = quantileReading(a, window);
          p99 = quantileReading(b, window);
          return;
        }
      }
    })();
    const [throughput, peakClients] = await Promise.all([
      firstWindow(async (w) => reading(await query(latencyQueries(w).throughput), w)),
      // Zero peak viewers is a real answer for one window, but not a reason to
      // stop looking: a quieter day should not hide a busier week.
      firstWindow(
        async (w) => reading(await query(latencyQueries(w).peakClients), w),
        (r) => (r.value ?? 0) > 0,
      ),
      latency,
    ]);
    return toLatencyStats({ p50, p99, throughput, peakClients });
  } catch (error) {
    unstable_rethrow(error);
    console.error("prometheus-client: latency stats failed", error);
    return { status: "unreachable" };
  }
}
