import { describe, expect, it } from "vitest";

import {
  getAtlasCities,
  getCandles,
  getEvents,
  getIndicatorSeries,
  getMarketState,
  getSensorRecord,
  getSensors,
  getSymbolSnapshot,
  getSymbols,
  getTape,
} from "@/lib/ticker-client";
import { SECTORS } from "@/lib/sectors";

/**
 * §21 "Contract" tier — runs the real ticker-client.ts fetch path against a
 * live ticker (TICKER_API_URL), parsing every response with
 * lib/market-schemas.ts's exported Zod schemas. Drift between the Go API's
 * actual shape and what the frontend expects fails the build here, not
 * silently at runtime. Needs a live ticker + Redis + Timescale — never run
 * as part of `npm run test` (see vitest.contract.config.mts).
 */
describe("ticker API contract", () => {
  it("GET /symbols matches symbolsResponseSchema and returns the 4 SIM: symbols", async () => {
    const symbols = await getSymbols();
    expect(symbols).not.toBeNull();
    expect(symbols?.length).toBeGreaterThanOrEqual(4);
    expect(symbols?.every((s) => s.symbol.startsWith("SIM:"))).toBe(true);
  });

  it("GET /symbols/{symbol} matches symbolSnapshotSchema, dated by asOf with no simulated flag (ADR-006)", async () => {
    const snapshot = await getSymbolSnapshot("SIM:NOVA");
    expect(snapshot).not.toBeNull();
    expect(typeof snapshot?.asOf).toBe("string");
    expect(snapshot).not.toHaveProperty("simulated");
    expect(snapshot).not.toHaveProperty("updatedAt");
  });

  it("GET /symbols/{symbol}/candles matches candlesResponseSchema", async () => {
    const candles = await getCandles("SIM:NOVA", "1h");
    expect(candles).not.toBeNull();
    expect(candles?.symbol).toBe("SIM:NOVA");
  });

  it("GET /symbols/{symbol}/candles takes from and to, and a daily bar has no volume (Phase 14 step 9)", async () => {
    const to = new Date();
    const from = new Date(to.getTime() - 3 * 3_600_000);
    const window = await getCandles("SIM:NOVA", "1m", { from, to });
    expect(window).not.toBeNull();
    for (const c of window?.candles ?? []) expect(Date.parse(c.time)).toBeGreaterThanOrEqual(from.getTime());
    const daily = await getCandles("MUFG", "1d", { from: new Date(to.getTime() - 45 * 86_400_000) });
    expect(daily).not.toBeNull();
    expect(daily?.candles.length).toBeGreaterThan(0);
  });

  it("GET /symbols/{symbol}/indicators?series=true matches indicatorSeriesResponseSchema", async () => {
    const series = await getIndicatorSeries("SIM:NOVA", ["ema", "rsi"], "1h");
    expect(series).not.toBeNull();
    expect(series?.series).toBeTypeOf("object");
  });

  it("GET /sensors matches sensorsResponseSchema: eighteen in a fixed order, none of them simulated", async () => {
    const sensors = await getSensors();
    expect(sensors).not.toBeNull();
    expect(sensors?.map((s) => s.order)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(sensors?.some((s) => s.symbol.startsWith("SIM:"))).toBe(false);
    expect(sensors?.filter((s) => s.group === "global").map((s) => s.symbol)).toEqual(["NVDA", "AAPL", "XOM", "JPM", "CAT"]);
    const mufg = sensors?.find((s) => s.symbol === "MUFG");
    expect(mufg?.country).toBe("Japan");
    // The four thin listings carry the figure and date the Prices table prints.
    const thin = sensors?.filter((s) => s.liquidityUsdM !== null).map((s) => s.symbol).sort();
    expect(thin).toEqual(["BCH", "KB", "TKC", "TLK"]);
    expect(sensors?.every((s) => (s.liquidityUsdM === null) === (s.liquidity === null))).toBe(true);
  });

  it("every Industries symbol is known to the ticker and carries a dated close", async () => {
    for (const { symbol } of SECTORS) {
      const snapshot = await getSymbolSnapshot(symbol);
      expect(snapshot, symbol).not.toBeNull();
      expect(snapshot?.asOf, symbol).toBeTypeOf("string");
      // Two daily bars are all the strip needs: the close and the one before it.
      expect(snapshot?.prevClose, symbol).toBeGreaterThan(0);
    }
  });

  it("GET /market/state matches marketStateSchema and reads live against the simulator, whose ticks never stop", async () => {
    const state = await getMarketState();
    expect(state).not.toBeNull();
    expect(state?.feed).toBe("live");
    expect(typeof state?.tripped).toBe("boolean");
  });

  // Phase 15 step 7. CI's ticker has an empty database, so the ledger is empty there; the
  // populated shapes are the fixtures' (lib/ledger.test.ts parses them with the same schema).
  it("GET /market/events matches eventsResponseSchema, an empty ledger being a list and not null", async () => {
    const res = await getEvents();
    expect(res).not.toBeNull();
    expect(Array.isArray(res?.events)).toBe(true);
    expect(typeof res?.truncated).toBe("boolean");
  });

  // Phase 16 step 1. The record's events are the ledger's without a band; CI's ledger is empty, so
  // the shape is checked on the series, and on the country and symbol forms being one body.
  it("GET /market/sensors/{symbol} matches sensorRecordSchema, and a country slug and its symbol are one record", async () => {
    const bySymbol = await getSensorRecord("MUFG");
    const bySlug = await getSensorRecord("japan");
    expect(bySymbol).not.toBeNull();
    expect(bySlug).toEqual(bySymbol);
    expect(bySymbol?.symbol).toBe("MUFG");
    expect(bySymbol?.benchmark).toBe("IXG");
    expect(bySymbol?.series.benchmarkClose).toHaveLength(bySymbol!.series.dates.length);
    expect(bySymbol?.series.close).toHaveLength(bySymbol!.series.dates.length);
    expect(bySymbol?.baseSession).toBe(bySymbol?.series.dates[0]);
    expect((await getSensorRecord("AAPL"))?.series.benchmarkClose).toBeNull();
    expect(await getSensorRecord("IXG")).toBeNull();
  });

  it("GET /market/tape matches tapeResponseSchema: the eighteen sensors, each with its closes and a z or a reason", async () => {
    const res = await getTape();
    expect(res).not.toBeNull();
    expect(res?.sensors).toHaveLength(18);
    for (const s of res!.sensors) {
      expect(s.z !== null || typeof s.reason === "string", s.symbol).toBe(true);
    }
  });

  it("GET /market/movers is gone: a top-gainers endpoint is an invitation to the widget the redesign removed", async () => {
    const res = await fetch(`${process.env.TICKER_API_URL ?? "http://localhost:8080"}/market/movers`);
    expect(res.status).toBe(404);
  });

  it("an unknown symbol is a 404, so the page shows notFound() instead of a zero-price page", async () => {
    expect(await getSymbolSnapshot("NOPE")).toBeNull();
    expect(await getCandles("NOPE", "1h")).toBeNull();
  });

  it("GET /atlas/cities matches atlasResponseSchema: 23 countries, 8 measures, a source and as-of on every value", async () => {
    const atlas = await getAtlasCities();
    expect(atlas).not.toBeNull();
    expect(atlas?.windows).toEqual(["2021", "2016", "2010"]);
    expect(atlas?.rows.length).toBe(23);
    expect(new Set(atlas?.rows.map((r) => r.slug)).size).toBe(23);
    expect(atlas?.rows.every((r) => r.hasCityPage === false)).toBe(true);
    // The euro area has no rate against itself; every other currency is served
    // or says why not.
    const italy = atlas?.rows.find((r) => r.slug === "italy");
    expect(italy?.currency.reason).toBe("euro");
    expect(italy?.shares.change?.["2010"]).toBeTypeOf("number");
  });
});
