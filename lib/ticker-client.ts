import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import {
  candlesResponseSchema,
  costOfLivingDetailSchema,
  costOfLivingResponseSchema,
  indicatorSeriesResponseSchema,
  symbolSnapshotSchema,
  symbolsResponseSchema,
  type CandlesResponse,
  type CostOfLiving,
  type CostOfLivingDetail,
  type IndicatorSeriesResponse,
  type Symbol,
  type SymbolSnapshot,
} from "@/lib/market-schemas";

export const TICKER_API_URL = process.env.TICKER_API_URL ?? "http://localhost:8080";

/**
 * Server-only reads over the Docker network (portfolio.md §8, Option B —
 * the browser never calls the Ticker API directly). Every function returns
 * `null` instead of throwing on a fetch/parse failure — §13's "honest
 * degradation": a briefly-unreachable ticker shouldn't crash the page,
 * callers render a fallback state instead.
 */
async function get<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  revalidateSeconds?: number
): Promise<z.infer<Schema> | null> {
  try {
    const res = await fetch(
      `${TICKER_API_URL}${path}`,
      revalidateSeconds !== undefined
        ? { next: { revalidate: revalidateSeconds } }
        : { cache: "no-store" }
    );
    if (!res.ok) {
      console.error(`ticker-client: ${path} → ${res.status}`);
      return null;
    }
    return schema.parse(await res.json());
  } catch (error) {
    // Next throws DynamicServerError from inside fetch() itself to mark a
    // route dynamic (portfolio.md §8's no-store/revalidate:0 reads) — a
    // control-flow signal, not a real failure. Swallowing it here (like any
    // other fetch error) stops Next from ever seeing the bailout, so the
    // route can't resolve as dynamic and these reads render stale/empty
    // instead of live. unstable_rethrow lets that signal (and
    // redirect/notFound/postpone) pass through untouched.
    unstable_rethrow(error);
    console.error(`ticker-client: ${path} failed`, error);
    return null;
  }
}

export function getSymbols(opts?: { revalidateSeconds?: number }): Promise<Symbol[] | null> {
  return get("/symbols", symbolsResponseSchema, opts?.revalidateSeconds);
}

export function getSymbolSnapshot(
  symbol: string,
  opts?: { revalidateSeconds?: number }
): Promise<SymbolSnapshot | null> {
  return get(
    `/symbols/${encodeURIComponent(symbol)}`,
    symbolSnapshotSchema,
    opts?.revalidateSeconds
  );
}

export function getCandles(
  symbol: string,
  interval: string,
  opts?: { revalidateSeconds?: number }
): Promise<CandlesResponse | null> {
  return get(
    `/symbols/${encodeURIComponent(symbol)}/candles?interval=${encodeURIComponent(interval)}`,
    candlesResponseSchema,
    opts?.revalidateSeconds
  );
}

export function getIndicatorSeries(
  symbol: string,
  set: string[],
  interval: string
): Promise<IndicatorSeriesResponse | null> {
  const query = new URLSearchParams({ set: set.join(","), interval, series: "true" });
  return get(
    `/symbols/${encodeURIComponent(symbol)}/indicators?${query}`,
    indicatorSeriesResponseSchema
  );
}

export function getCostOfLiving(): Promise<CostOfLiving[] | null> {
  return get("/col", costOfLivingResponseSchema);
}

export function getCostOfLivingDetail(city: string): Promise<CostOfLivingDetail | null> {
  return get(`/col/${encodeURIComponent(city)}`, costOfLivingDetailSchema);
}
