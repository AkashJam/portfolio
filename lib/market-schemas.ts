import { z } from "zod";

// Hand-derived from portfolio.md §8 (the Ticker API contract) — only the
// shapes actually consumed by /market and /market/[symbol] (§18). No
// Movers schema: nothing in this phase renders GET /market/movers.

export const symbolSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
  exchange: z.string(),
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
  updatedAt: z.string(),
  simulated: z.boolean(),
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

// SSE payloads (§8 `GET /stream`) — parsed client-side in lib/sse.ts, not
// through lib/ticker-client.ts.
export const quoteEventSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
  time: z.string(),
  simulated: z.boolean(),
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
