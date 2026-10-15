import { z } from "zod";

// Hand-derived from portfolio.md §8 (the Ticker API contract) — only the
// shapes actually consumed by /market and /market/[symbol] (§18). No
// Movers schema: nothing in this phase renders GET /market/movers.

export const symbolSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
  exchange: z.string(),
  regime: z.string(),
});
export type Symbol = z.infer<typeof symbolSchema>;
export const symbolsResponseSchema = z.array(symbolSchema);

export const symbolSnapshotSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  dayHigh: z.number(),
  dayLow: z.number(),
  prevClose: z.number(),
  // The price's vintage: the last trade, or the latest daily bar. Null when
  // the service has neither (ADR-006).
  asOf: z.string().nullable(),
});
export type SymbolSnapshot = z.infer<typeof symbolSnapshotSchema>;

export const candleSchema = z.object({
  time: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
export type Candle = z.infer<typeof candleSchema>;

export const candlesResponseSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  candles: z.array(candleSchema),
});
export type CandlesResponse = z.infer<typeof candlesResponseSchema>;

const indicatorSeriesPointSchema = z.object({
  time: z.string(),
  value: z.number(),
});

// The `series=true` shape (ticker/internal/api/handlers_indicators.go) —
// one value per candle instead of just the latest, for a chart line.
export const indicatorSeriesResponseSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  series: z.record(z.string(), z.array(indicatorSeriesPointSchema)),
  cached: z.boolean(),
});
export type IndicatorSeriesResponse = z.infer<typeof indicatorSeriesResponseSchema>;

// GET /sensors (§8, Phase 14): the eighteen market sensors in their fixed
// display order. Country sensors carry a country and region from the ticker's
// country table; global sensors carry a theme instead.
export const sensorSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  group: z.enum(["country", "global"]),
  country: z.string().nullable(),
  theme: z.string().nullable(),
  region: z.string().nullable(),
  liquidity: z.string().nullable(),
  // "telecom", "was Bancolombia": what the table must say beside the company.
  note: z.string().nullable(),
  // The measured figure behind "thin": 3-month average daily traded value of
  // the US listing in $ millions, and the date it was measured. The four thin
  // sensors only.
  liquidityUsdM: z.number().nullable(),
  liquidityAsOf: z.string().nullable(),
  order: z.number(),
});
export type Sensor = z.infer<typeof sensorSchema>;
export const sensorsResponseSchema = z.array(sensorSchema);

// GET /market/state (§8, Phase 14): the ingest feed's state for the Market
// indicator and the closed state. "closed" is silence the market explains; "stale"
// and "down" are not.
// `session` is the regular session's, separate from the feed's: after the close the
// feed can still carry extended-hours trades. `opensAt` is the next open while closed.
export const marketStateSchema = z.object({
  feed: z.enum(["live", "closed", "stale", "down"]),
  session: z.enum(["open", "closed"]),
  opensAt: z.string().nullable(),
});
export type MarketStateResponse = z.infer<typeof marketStateSchema>;

// GET /atlas/cities (§8, Phase 10). Eight measures per country: four are change
// over one window (shares, housing, prices, currency), four the latest level.
// Every value carries its source and as-of, so the UI cannot show one without
// the other; a value that cannot be served is null with a reason, never a
// stand-in.
export const windowStartSchema = z.enum(["2021", "2016", "2010"]);
export type WindowStart = z.infer<typeof windowStartSchema>;

export const windowChangeSchema = z
  .object({
    // Null as a whole when the measure cannot be served for the country
    // (reason "euro" or "stale"); one window is null when its start point was
    // never published (reason "unpublished": Israel's 2010, bearing.md #99).
    change: z.record(windowStartSchema, z.number().nullable()).nullable(),
    years: z.record(z.string(), z.number()).nullable(),
    reason: z.enum(["euro", "stale", "unpublished"]).optional(),
    derived: z.literal("via USD").optional(), // Chile's currency (bearing.md #85)
    source: z.string().min(1),
    asOf: z.string().min(1),
  })
  .refine((m) => m.change !== null || m.reason !== undefined, {
    message: "a measure with no change must say why",
  });
export type WindowChange = z.infer<typeof windowChangeSchema>;

export const sourcedSchema = z
  .object({
    value: z.number().nullable(),
    unit: z.string().optional(),
    source: z.string().min(1),
    asOf: z.string().min(1),
    reason: z.string().optional(),
  })
  .refine((v) => v.value !== null || v.reason !== undefined, {
    message: "a value that is null must say why",
  });
export type Sourced = z.infer<typeof sourcedSchema>;

export const atlasRowSchema = z.object({
  slug: z.string().min(1), // the row's address: /atlas#italy
  city: z.string(),
  country: z.string(),
  code: z.string().length(2),
  sensor: z.string().nullable(), // market-sensor symbol, or null
  hasCityPage: z.boolean(),
  region: z.enum(["americas", "europe", "asia-pacific", "africa", "middle-east"]),
  shares: windowChangeSchema,
  housing: windowChangeSchema,
  prices: windowChangeSchema,
  currency: windowChangeSchema,
  everydaySpendingEur: sourcedSchema,
  gniPpp: sourcedSchema,
  unemployment: sourcedSchema,
  lifeExpectancy: sourcedSchema,
});
export type AtlasRow = z.infer<typeof atlasRowSchema>;

export const atlasResponseSchema = z.object({
  generatedAt: z.string(),
  windows: z.array(windowStartSchema),
  end: z.string().regex(/^\d{4}$/), // the latest year every country has for all four change measures
  rows: z.array(atlasRowSchema),
});
export type AtlasResponse = z.infer<typeof atlasResponseSchema>;

// SSE payloads (§8 `GET /stream`) — parsed client-side in lib/sse.ts, not
// through lib/ticker-client.ts.
export const quoteEventSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
  time: z.string(),
});
export type QuoteEvent = z.infer<typeof quoteEventSchema>;

export const candleEventSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  time: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
export type CandleEvent = z.infer<typeof candleEventSchema>;

export const heartbeatEventSchema = z.object({
  time: z.string(),
});
export type HeartbeatEvent = z.infer<typeof heartbeatEventSchema>;
