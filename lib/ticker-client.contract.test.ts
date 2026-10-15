import { describe, expect, it } from "vitest";

import {
  getAtlasCities,
  getCandles,
  getCostOfLiving,
  getCostOfLivingDetail,
  getIndicatorSeries,
  getSymbolSnapshot,
  getSymbols,
} from "@/lib/ticker-client";

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

  it("GET /symbols/{symbol}/indicators?series=true matches indicatorSeriesResponseSchema", async () => {
    const series = await getIndicatorSeries("SIM:NOVA", ["ema", "rsi"], "1h");
    expect(series).not.toBeNull();
    expect(series?.series).toBeTypeOf("object");
  });

  it("GET /col matches costOfLivingResponseSchema and returns the 5 seeded cities", async () => {
    const col = await getCostOfLiving();
    expect(col).not.toBeNull();
    expect(col?.length).toBe(5);
    expect(col?.every((c) => c.simulated === true)).toBe(true);
  });

  it("GET /col/{city} matches costOfLivingDetailSchema", async () => {
    const detail = await getCostOfLivingDetail("London");
    expect(detail).not.toBeNull();
    expect(detail?.series.length).toBeGreaterThan(0);
    expect(detail?.basket.length).toBeGreaterThan(0);
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
