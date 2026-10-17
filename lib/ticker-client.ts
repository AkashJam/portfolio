import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

import {
  atlasResponseSchema,
  candlesResponseSchema,
  eventsResponseSchema,
  indicatorSeriesResponseSchema,
  marketStateSchema,
  sensorsResponseSchema,
  symbolSnapshotSchema,
  symbolsResponseSchema,
  tapeResponseSchema,
  type AtlasResponse,
  type CandlesResponse,
  type EventsResponse,
  type IndicatorSeriesResponse,
  type MarketStateResponse,
  type Sensor,
  type Symbol,
  type SymbolSnapshot,
  type TapeResponse,
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
  revalidateSeconds?: number,
  timeoutMs?: number
): Promise<z.infer<Schema> | null> {
  try {
    const res = await fetch(`${TICKER_API_URL}${path}`, {
      ...(revalidateSeconds !== undefined ? { next: { revalidate: revalidateSeconds } } : { cache: "no-store" as const }),
      // A probe must answer quickly or count as unreachable.
      ...(timeoutMs !== undefined ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    });
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
  opts?: { revalidateSeconds?: number; from?: Date; to?: Date }
): Promise<CandlesResponse | null> {
  // The ticker returns the *oldest* bars first and stops at 1000, so a read with no
  // `from` on a long history is the wrong end of it. A caller that wants recent bars
  // says where to start (Phase 14 step 9).
  const query = new URLSearchParams({ interval });
  if (opts?.from) query.set("from", opts.from.toISOString());
  if (opts?.to) query.set("to", opts.to.toISOString());
  return get(
    `/symbols/${encodeURIComponent(symbol)}/candles?${query}`,
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

/**
 * The ingest feed's state, for the Market indicator. Two seconds: a ticker that
 * cannot answer that quickly is, for this purpose, unreachable.
 */
export function getMarketState(opts?: { revalidateSeconds?: number }): Promise<MarketStateResponse | null> {
  return get("/market/state", marketStateSchema, opts?.revalidateSeconds, 2000);
}

/**
 * The eighteen market sensors in display order (§8). Static between deploys and
 * answered from the ticker's embedded snapshot, so it can be cached for a while.
 */
export function getSensors(opts?: { revalidateSeconds?: number }): Promise<Sensor[] | null> {
  return get("/sensors", sensorsResponseSchema, opts?.revalidateSeconds);
}

/**
 * The /atlas comparison (§8): twenty-three countries, eight measures, every
 * value with its source and as-of. Keyless on the ticker's side, and served
 * from its embedded snapshots when Redis is down, so it is cacheable for a
 * while; the data refreshes once a day.
 */
export function getAtlasCities(opts?: { revalidateSeconds?: number }): Promise<AtlasResponse | null> {
  return get("/atlas/cities", atlasResponseSchema, opts?.revalidateSeconds);
}

/**
 * The ledger (§8, Phase 15 step 7): every event the trigger recorded, newest first.
 * It changes only when a close trips something, so it is cached for as long as the
 * page that shows it.
 */
export function getEvents(opts?: { revalidateSeconds?: number }): Promise<EventsResponse | null> {
  return get("/market/events", eventsResponseSchema, opts?.revalidateSeconds);
}

/** The Prices table's sparkline and "σ · last close" columns (§8, Phase 15 step 7). */
export function getTape(opts?: { revalidateSeconds?: number }): Promise<TapeResponse | null> {
  return get("/market/tape", tapeResponseSchema, opts?.revalidateSeconds);
}
