import { describe, expect, it } from "vitest";

import {
  atlasResponseSchema,
  atlasRowSchema,
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

// Italy's real values, cut at 2024 (portfolio.md §8), plus the shapes the
// other rows take.
const change = (c: Record<string, number | null> | null, extra = {}) => ({
  change: c,
  years: c === null ? null : { "2010": -5.4, "2011": -24.4 },
  source: "OECD via FRED SPASTT01ITM661N",
  asOf: "2024-12",
  ...extra,
});

const level = (value: number | null, extra = {}) => ({
  value,
  unit: "%",
  source: "World Bank SL.UEM.TOTL.ZS",
  asOf: "2025",
  ...extra,
});

const italy = {
  slug: "italy",
  city: "Milan",
  country: "Italy",
  code: "IT",
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: change({ "2021": 47.5, "2016": 75.5, "2010": 69.8 }),
  housing: change({ "2021": -4.1, "2016": -6.6, "2010": -26.0 }, { asOf: "2024-Q4" }),
  prices: change({ "2021": 15.4, "2016": 20.9, "2010": 29.9 }, { asOf: "2024" }),
  currency: change(null, { reason: "euro", source: "ECB euro foreign exchange reference rates" }),
  everydaySpendingEur: level(1839, { unit: "EUR/person/month" }),
  gniPpp: level(62870, { unit: "USD PPP/person" }),
  unemployment: level(6.4),
  lifeExpectancy: level(84.0, { unit: "years", asOf: "2024" }),
};

describe("atlasRowSchema", () => {
  it("accepts Italy: change on three windows, the euro-area currency null with a reason", () => {
    expect(atlasRowSchema.safeParse(italy).success).toBe(true);
  });

  it("accepts Chile's currency derived via the dollar, and stale as a stated gap", () => {
    const derived = { ...italy, currency: change({ "2021": -14.5, "2016": -24, "2010": -30.6 }, { derived: "via USD" }) };
    expect(atlasRowSchema.safeParse(derived).success).toBe(true);
    const stale = { ...italy, currency: change(null, { reason: "stale", derived: "via USD" }) };
    expect(atlasRowSchema.safeParse(stale).success).toBe(true);
  });

  it("accepts Israel: the 2010 window null, with its reason", () => {
    const israel = {
      ...italy,
      currency: change({ "2021": 9.1, "2016": 4.2, "2010": null }, { reason: "unpublished" }),
    };
    expect(atlasRowSchema.safeParse(israel).success).toBe(true);
  });

  it("rejects a measure with no change and no reason", () => {
    expect(atlasRowSchema.safeParse({ ...italy, currency: change(null) }).success).toBe(false);
  });

  it("rejects a null level with no reason, but accepts one with a reason", () => {
    expect(atlasRowSchema.safeParse({ ...italy, gniPpp: level(null) }).success).toBe(false);
    expect(atlasRowSchema.safeParse({ ...italy, gniPpp: level(null, { reason: "not published" }) }).success).toBe(true);
  });

  it("rejects a value without its source or as-of: the UI must never show one without the other", () => {
    expect(atlasRowSchema.safeParse({ ...italy, unemployment: { ...level(6.4), source: "" } }).success).toBe(false);
    const noAsOf: Record<string, unknown> = { ...level(6.4) };
    delete noAsOf.asOf;
    expect(atlasRowSchema.safeParse({ ...italy, unemployment: noAsOf }).success).toBe(false);
    expect(atlasRowSchema.safeParse({ ...italy, shares: { ...italy.shares, asOf: "" } }).success).toBe(false);
  });

  it("rejects a change that is missing a window, an unknown reason and an unknown region", () => {
    expect(atlasRowSchema.safeParse({ ...italy, shares: change({ "2021": 1, "2016": 2 }) }).success).toBe(false);
    expect(atlasRowSchema.safeParse({ ...italy, currency: change(null, { reason: "broken" }) }).success).toBe(false);
    expect(atlasRowSchema.safeParse({ ...italy, region: "atlantis" }).success).toBe(false);
  });

  it("rejects a change sent as a string (the PascalCase-JSON class of bug)", () => {
    expect(
      atlasRowSchema.safeParse({ ...italy, shares: change({ "2021": "47.5" as unknown as number, "2016": 1, "2010": 2 }) }).success
    ).toBe(false);
  });
});

describe("atlasResponseSchema", () => {
  const response = { generatedAt: "2026-10-12T07:00:00Z", windows: ["2021", "2016", "2010"], end: "2024", rows: [italy] };

  it("accepts a well-formed §8 response", () => {
    expect(atlasResponseSchema.safeParse(response).success).toBe(true);
  });

  it("rejects an end that is not a year, an unknown window and a missing rows array", () => {
    expect(atlasResponseSchema.safeParse({ ...response, end: "2024-12" }).success).toBe(false);
    expect(atlasResponseSchema.safeParse({ ...response, windows: ["2021", "2005"] }).success).toBe(false);
    expect(atlasResponseSchema.safeParse({ generatedAt: "x", windows: [], end: "2024" }).success).toBe(false);
  });
});
