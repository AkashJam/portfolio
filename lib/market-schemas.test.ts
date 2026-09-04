import { describe, expect, it } from "vitest";

import {
  candlesResponseSchema,
  costOfLivingSchema,
  indicatorSeriesResponseSchema,
  symbolSnapshotSchema,
  symbolsResponseSchema,
} from "@/lib/market-schemas";

describe("symbolsResponseSchema", () => {
  it("accepts a well-formed §8 response", () => {
    const result = symbolsResponseSchema.safeParse([
      { symbol: "SIM:NOVA", name: "Nova (simulated)", type: "stock", exchange: "SIM", regime: "steady" },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects a missing field", () => {
    const result = symbolsResponseSchema.safeParse([{ symbol: "SIM:NOVA", type: "stock" }]);
    expect(result.success).toBe(false);
  });

  it("rejects a non-array payload", () => {
    const result = symbolsResponseSchema.safeParse({ symbol: "SIM:NOVA" });
    expect(result.success).toBe(false);
  });
});

describe("symbolSnapshotSchema", () => {
  it("rejects a numeric field sent as a string (a real regression class — §15's earlier PascalCase-JSON bug)", () => {
    const result = symbolSnapshotSchema.safeParse({
      symbol: "SIM:NOVA",
      name: "Nova (simulated)",
      price: "187.42",
      change: 1.83,
      changePercent: 0.99,
      dayHigh: 188.1,
      dayLow: 184.55,
      prevClose: 185.59,
      updatedAt: "2026-08-08T14:32:07Z",
      simulated: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("candlesResponseSchema", () => {
  it("accepts an empty candles array (not enough history yet)", () => {
    const result = candlesResponseSchema.safeParse({
      symbol: "SIM:NOVA",
      interval: "1h",
      candles: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("indicatorSeriesResponseSchema", () => {
  it("accepts the series=true shape with multiple indicator series", () => {
    const result = indicatorSeriesResponseSchema.safeParse({
      symbol: "SIM:NOVA",
      interval: "1h",
      series: {
        ema: [{ time: "2026-08-08T14:30:00Z", value: 186.71 }],
        rsi: [{ time: "2026-08-08T14:30:00Z", value: 58.3 }],
      },
      cached: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty series map (an unknown indicator name silently skipped upstream)", () => {
    const result = indicatorSeriesResponseSchema.safeParse({
      symbol: "SIM:NOVA",
      interval: "1h",
      series: {},
      cached: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("costOfLivingSchema", () => {
  it("requires the simulated provenance flag (§22 risk #8)", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to omit it below
    const { simulated: _simulated, ...withoutSimulated } = {
      city: "London",
      country: "UK",
      localCurrency: "GBP",
      localValue: 2522.39,
      eurValue: 2945.39,
      changeYoY: 3,
      surveyYear: 2024,
      source: "JRF / Loughborough — MIS",
      simulated: true,
    };
    const result = costOfLivingSchema.safeParse(withoutSimulated);
    expect(result.success).toBe(false);
  });
});
