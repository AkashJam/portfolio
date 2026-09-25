import "server-only";
import { unstable_rethrow } from "next/navigation";

import { LATENCY_QUERIES, parseInstantValue, toLatencyStats, type LatencyStats } from "@/lib/latency";

/**
 * Server-only reads of Prometheus' own query API over the Docker network
 * (portfolio.md §15 Phase 7 step 6) — same shape as lib/ticker-client.ts:
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

export async function getLatencyStats(): Promise<LatencyStats> {
  if (!PROMETHEUS_URL) return { status: "unreachable" };
  try {
    const [p50, p99, throughput, peakClients] = await Promise.all([
      query(LATENCY_QUERIES.p50),
      query(LATENCY_QUERIES.p99),
      query(LATENCY_QUERIES.throughput),
      query(LATENCY_QUERIES.peakClients),
    ]);
    return toLatencyStats({ p50, p99, throughput, peakClients });
  } catch (error) {
    unstable_rethrow(error);
    console.error("prometheus-client: latency stats failed", error);
    return { status: "unreachable" };
  }
}
