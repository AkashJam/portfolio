import { z } from "zod";

// Hand-derived from portfolio.md §8 (the Ticker API contract) — only the
// shapes actually consumed by /market and /market/[symbol] (§18). There is no
// Movers schema: GET /market/movers is deleted (Phase 15 step 7), because "what
// moved most?" is the question the threshold exists not to ask.

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
  // Absent on the sweep's daily bars, which carry price only (Phase 8); a schema that
  // required it rejected the whole `1d` response, so the daily chart came back empty.
  volume: z.number().optional(),
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
  // Whether the last close tripped something: the newest event is from the newest
  // session with bars (Phase 15 step 7). Defaults to false so a ticker that
  // predates the ledger still parses.
  tripped: z.boolean().default(false),
});
export type MarketStateResponse = z.infer<typeof marketStateSchema>;

// GET /market/events (§8, Phase 15 step 7): the ledger. Every event the trigger
// recorded, newest session first and never ranked. The split and the coverage are
// stored JSON the ticker passes through whole, so they are described here by what
// the view reads and nothing is required that a source can legitimately lack.
export const sideSchema = z.enum(["before", "after"]);
export type Side = z.infer<typeof sideSchema>;

export const splitPartSchema = z.object({ value: z.number(), sigma: z.number(), z: z.number() });

export const splitSchema = z.object({
  status: z.enum(["ok", "none"]),
  // Why there is no split, from a closed set (no_home_currency, no_ecb_currency,
  // monthly_only, ecb_not_published, insufficient_history, zero_sigma).
  reason: z.string().optional(),
  label: z.enum(["currency-led", "stock-led", "both", "neither"]).optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  fixDate: z.string().optional(),
  ratePrevious: z.number().optional(),
  rateCurrent: z.number().optional(),
  residual: z.number().optional(),
  currencyPart: splitPartSchema.optional(),
  stockPart: splitPartSchema.optional(),
  threshold: z.number().optional(),
  window: z.number().optional(),
  windowStart: z.string().optional(),
});
export type Split = z.infer<typeof splitSchema>;

const headlineSchema = z.object({
  title: z.string(),
  link: z.string(),
  publishedAt: z.string(),
  side: sideSchema,
});

export const coverageOutletSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  items: z.array(headlineSchema),
});
export type CoverageOutlet = z.infer<typeof coverageOutletSchema>;

export const coverageItemSchema = headlineSchema.extend({
  language: z.string().optional(),
  form: z.string().optional(),
  itemCodes: z.array(z.object({ code: z.string(), title: z.string().optional() })).optional(),
});
export type CoverageItem = z.infer<typeof coverageItemSchema>;

export const coverageSourceSchema = z.object({
  status: z.enum(["ok", "empty", "error"]),
  attempts: z.number(),
  fetchedAt: z.string(),
  error: z.string().optional(),
  absent: z.object({ reason: z.string() }).optional(),
  query: z.string().optional(),
  outlets: z.array(coverageOutletSchema).optional(),
  total: z.number().optional(),
  excluded: z.number().optional(),
  nonEnglish: z.number().optional(),
  undated: z.number().optional(),
  items: z.array(coverageItemSchema).optional(),
  categorised: z.boolean().optional(),
});
export type CoverageSource = z.infer<typeof coverageSourceSchema>;

export const coverageSchema = z.object({
  stage: z.enum(["trip", "followUp"]),
  complete: z.boolean(),
  routing: z.string(),
  window: z.object({ from: z.string(), to: z.string() }),
  closedAt: z.string(),
  sources: z.record(z.string(), coverageSourceSchema),
});
export type Coverage = z.infer<typeof coverageSchema>;

export const bandSchema = z.object({
  dates: z.array(z.string()),
  close: z.array(z.number()),
  lower: z.array(z.number()),
  upper: z.array(z.number()),
});
export type Band = z.infer<typeof bandSchema>;

export const ledgerEventSchema = z.object({
  id: z.string(), // the fragment: /market#japan-2026-10-15
  symbol: z.string(),
  name: z.string(),
  sessionDate: z.string(),
  closedAt: z.string(),
  sessionsAgo: z.number(),
  // Every country sensor carries one (Colombia and Peru too, with atlas false);
  // a global name has none and a theme instead.
  country: z.object({ slug: z.string(), name: z.string(), atlas: z.boolean() }).nullable(),
  theme: z.string().nullable(),
  price: z
    .object({ close: z.number(), prevClose: z.number(), change: z.number(), changePercent: z.number() })
    .nullable(),
  trigger: z.object({
    symbolReturn: z.number(),
    benchmark: z.string().nullable(),
    benchmarkReturn: z.number().nullable(),
    benchmarkReason: z.string().nullable(),
    residual: z.number(),
    sigma: z.number(),
    z: z.number(),
    threshold: z.number(),
    window: z.number(),
  }),
  band: bandSchema.nullable(),
  split: splitSchema.nullable(),
  coverage: coverageSchema.nullable(),
  caveats: z.array(z.string()),
  thin: z.object({ usdM: z.number(), asOf: z.string(), label: z.string() }).nullable(),
});
export type LedgerEvent = z.infer<typeof ledgerEventSchema>;

export const eventsResponseSchema = z.object({
  events: z.array(ledgerEventSchema),
  truncated: z.boolean(),
  latestSession: z.string().nullable(),
});
export type EventsResponse = z.infer<typeof eventsResponseSchema>;

// GET /market/tape (§8, Phase 15 step 7): the Prices table's two history columns.
// z is the trigger's own residual z on the last close, or null with the reason the
// trigger could not judge the sensor (insufficient_history under sixty returns).
export const tapeSensorSchema = z.object({
  symbol: z.string(),
  dates: z.array(z.string()),
  closes: z.array(z.number()),
  z: z.number().nullable(),
  sigma: z.number().nullable(),
  reason: z.string().optional(),
});
export type TapeSensor = z.infer<typeof tapeSensorSchema>;

export const tapeResponseSchema = z.object({
  asOf: z.string().nullable(),
  sensors: z.array(tapeSensorSchema),
});
export type TapeResponse = z.infer<typeof tapeResponseSchema>;

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
  // Absent on the sweep's daily bars, which carry price only (Phase 8); a schema that
  // required it rejected the whole `1d` response, so the daily chart came back empty.
  volume: z.number().optional(),
});
export type CandleEvent = z.infer<typeof candleEventSchema>;

export const heartbeatEventSchema = z.object({
  time: z.string(),
});
export type HeartbeatEvent = z.infer<typeof heartbeatEventSchema>;
