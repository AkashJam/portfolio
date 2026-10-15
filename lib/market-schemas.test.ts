import { describe, expect, it } from "vitest";

import {
  atlasResponseSchema,
  atlasRowSchema,
  candlesResponseSchema,
  indicatorSeriesResponseSchema,
  sensorsResponseSchema,
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
      asOf: "2026-08-08T14:32:07Z",
    });
    expect(result.success).toBe(false);
  });

  const snapshot = {
    symbol: "RY",
    name: "Royal Bank of Canada",
    price: 187.42,
    change: 1.83,
    changePercent: 0.99,
    dayHigh: 188.1,
    dayLow: 184.55,
    prevClose: 185.59,
    asOf: "2026-08-08T14:32:07Z",
  };

  it("carries a vintage instead of a simulated flag (ADR-006)", () => {
    expect(symbolSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(symbolSnapshotSchema.safeParse({ ...snapshot, asOf: null }).success).toBe(true);
  });

  it("rejects a snapshot with no asOf key, so the old shape cannot slip through", () => {
    const { asOf: _asOf, ...withoutAsOf } = snapshot; // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(symbolSnapshotSchema.safeParse(withoutAsOf).success).toBe(false);
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

describe("sensorsResponseSchema", () => {
  const country = {
    symbol: "MUFG",
    name: "Mitsubishi UFJ",
    group: "country",
    country: "Japan",
    theme: null,
    region: "asia-pacific",
    liquidity: null,
    note: null,
    liquidityUsdM: null,
    liquidityAsOf: null,
    order: 13,
  };
  const global = { ...country, symbol: "NVDA", name: "NVIDIA", group: "global", country: null, theme: "Semiconductors", region: null, order: 14 };

  it("accepts a country sensor and a global one", () => {
    expect(sensorsResponseSchema.safeParse([country, global]).success).toBe(true);
  });

  it("carries a thin listing's figure and date, and a note", () => {
    const thin = { ...country, symbol: "TKC", liquidity: "thin", note: "telecom", liquidityUsdM: 12, liquidityAsOf: "2026-10-09" };
    const parsed = sensorsResponseSchema.safeParse([thin]);
    expect(parsed.success).toBe(true);
  });

  it("rejects a sensor without the thin-listing fields, so an old ticker cannot slip through", () => {
    const { liquidityUsdM: _usd, ...old } = country; // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(sensorsResponseSchema.safeParse([old]).success).toBe(false);
  });

  it("rejects a group the ticker does not define", () => {
    expect(sensorsResponseSchema.safeParse([{ ...country, group: "sector" }]).success).toBe(false);
  });

  it("requires the fixed order, which the pages rely on to avoid re-sorting", () => {
    const { order: _order, ...withoutOrder } = country; // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(sensorsResponseSchema.safeParse([withoutOrder]).success).toBe(false);
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

describe("candlesResponseSchema, daily bars", () => {
  it("accepts a swept daily bar, which carries no volume", () => {
    const result = candlesResponseSchema.safeParse({
      symbol: "MUFG",
      interval: "1d",
      candles: [{ time: "2026-10-08T00:00:00Z", symbol: "MUFG", interval: "1d", open: 22.4, high: 22.7, low: 22.1, close: 22.65 }],
    });
    expect(result.success).toBe(true);
  });
});
