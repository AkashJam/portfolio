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

export const costOfLivingSchema = z.object({
  city: z.string(),
  country: z.string(),
  localCurrency: z.string(),
  localValue: z.number(),
  eurValue: z.number(),
  changeYoY: z.number(),
  surveyYear: z.number(),
  source: z.string(),
  simulated: z.boolean(),
});
export type CostOfLiving = z.infer<typeof costOfLivingSchema>;
export const costOfLivingResponseSchema = z.array(costOfLivingSchema);

const costOfLivingSeriesPointSchema = z.object({
  time: z.string(),
  value: z.number(),
});
const costOfLivingBasketItemSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const costOfLivingDetailSchema = z.object({
  city: z.string(),
  localCurrency: z.string(),
  localValue: z.number(),
  eurValue: z.number(),
  surveyYear: z.number(),
  source: z.string(),
  fxToEur: z.number(),
  series: z.array(costOfLivingSeriesPointSchema),
  basket: z.array(costOfLivingBasketItemSchema),
  simulated: z.boolean(),
});
export type CostOfLivingDetail = z.infer<typeof costOfLivingDetailSchema>;

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
