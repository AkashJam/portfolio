import { z } from "zod";

// Hand-derived from portfolio.md §8 (the Ticker API contract) — only the
// shapes actually consumed by /market, /market/[sensor] and its price page (§18). There is no
// Movers schema: GET /market/movers is deleted (Phase 15 step 7), because "what
// moved most?" is the question the threshold exists not to ask.

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
  // The country's address (`japan`), which the site's links to the sensor's page
  // use; null for a global sensor, addressed by its symbol.
  slug: z.string().nullable(),
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
  country: z.object({ slug: z.string(), name: z.string(), atlas: z.boolean(), cityPage: z.boolean() }).nullable(),
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

// GET /market/sensors/{symbol} (§8, Phase 16 step 1): one sensor's accumulated
// record. Its events are the ledger's without the band (the record draws the
// longer series instead), so they parse into the same LedgerEvent with a null band
// and the ledger's row component renders both. `series` holds the closes as
// stored; the page divides by the close on baseSession to draw both lines at 100.
export const sensorRecordSchema = z.object({
  symbol: z.string(), // canonical, whichever form the request used
  name: z.string(),
  country: z.object({ slug: z.string(), name: z.string(), atlas: z.boolean(), cityPage: z.boolean() }).nullable(),
  theme: z.string().nullable(),
  benchmark: z.string().nullable(),
  benchmarkReason: z.string().nullable(),
  thin: z.object({ usdM: z.number(), asOf: z.string(), label: z.string() }).nullable(),
  baseSession: z.string().nullable(),
  series: z.object({
    dates: z.array(z.string()),
    close: z.array(z.number()),
    benchmarkClose: z.array(z.number()).nullable(),
  }),
  sessionsObserved: z.number(),
  latestSession: z.string().nullable(),
  // The first session the trigger tested and how many of the series fall on or after it:
  // the denominator of any rate of events (the bars start earlier, seeded).
  judgedFrom: z.string(),
  sessionsJudged: z.number(),
  eventCount: z.number(),
  events: z.array(ledgerEventSchema.omit({ band: true }).transform((e) => ({ ...e, band: null }))),
});
export type SensorRecord = z.infer<typeof sensorRecordSchema>;

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

// The one rate a view shown in a home city's currency converts at (Phase 16 step 6).
export const displayRateSchema = z.object({
  currency: z.string(),
  perEur: z.number().positive(),
  year: z.number(),
  source: z.string(),
});
export type DisplayRate = z.infer<typeof displayRateSchema>;

export const atlasResponseSchema = z.object({
  generatedAt: z.string(),
  windows: z.array(windowStartSchema),
  end: z.string().regex(/^\d{4}$/), // the latest year every country has for all four change measures
  rows: z.array(atlasRowSchema),
  // By country slug; absent for the euro area and for a currency with no ECB average.
  rates: z.record(z.string(), displayRateSchema).default({}),
});
export type AtlasResponse = z.infer<typeof atlasResponseSchema>;

// GET /atlas/cities/{city} (§8, Phase 16 step 3): one city's page. Every derived
// figure carries its legs and the date of each, so the page prints one without
// computing it. A series is null, with a reason, where it cannot be served.
export const housingTagSchema = z.enum([
  "private_rent",
  "welfare_ceiling",
  "imputed_rent",
  "imputed_rent_excluded",
  "averaged_all_residents",
  "derived_rent",
  "survey_component",
  "included_not_separate",
  "not_in_survey",
]);
export type HousingTag = z.infer<typeof housingTagSchema>;

export const cityPartSchema = z.object({
  label: z.string(),
  amount: z.number(),
  share: z.number(),
  derived: z.string().optional(),
  hatched: z.boolean().optional(),
  includesHousing: z.boolean().optional(),
});
export type CityPart = z.infer<typeof cityPartSchema>;

const seriesSchema = z.object({ start: z.string(), step: z.number(), values: z.array(z.number()) });
export type LongSeries = z.infer<typeof seriesSchema>;

export const cityChartSchema = z.object({
  series: seriesSchema.nullable(),
  source: z.string(),
  asOf: z.string(),
  derived: z.string().optional(),
  reason: z.string().optional(),
  behind: z.number(), // months this series ends before the newest country's
});
export type CityChart = z.infer<typeof cityChartSchema>;

const cpiLegSchema = z.object({ year: z.number(), index: z.number() });

// The cost of living as a share of everyday spending (Phase 16 step 5): a city page
// figure, derived from two sources of different dates, so it carries both legs, the
// years between them and a caveat where fast-moving prices make that gap matter.
export const affordabilitySchema = z.object({
  ratio: z.number().nullable(), // percent
  measure: z.enum(["floor", "average"]),
  cost: z.object({ eur: z.number().nullable(), priceYear: z.number(), basis: z.enum(["survey", "carried"]), rateYear: z.number() }),
  spending: sourcedSchema,
  gapYears: z.number(),
  direction: z.enum(["same", "cost-newer", "spending-newer"]).or(z.literal("")),
  inflation: sourcedSchema,
  caveat: z.string().optional(),
  reason: z.string().optional(),
});
export type Affordability = z.infer<typeof affordabilitySchema>;

export const cityResponseSchema = z.object({
  generatedAt: z.string(),
  slug: z.string(),
  city: z.string(),
  country: z.string(),
  code: z.string(),
  sensor: z.string().nullable(),
  region: z.string(),
  verified: z.boolean(),
  survey: z.object({
    instrument: z.string(),
    publisher: z.string(),
    headline: z.object({
      value: z.number(),
      currency: z.string(),
      year: z.number(),
      label: z.string(),
      method: z.string(),
      derived: z.string().optional(),
    }),
    secondLines: z.array(z.object({ label: z.string(), value: z.number(), eur: z.number().nullable() })),
    housing: z.object({ tag: housingTagSchema, note: z.string() }),
    parts: z.array(cityPartSchema).nullable(),
    splitNote: z.string().nullable(),
    sources: z.array(z.object({ label: z.string(), url: z.string(), detail: z.string(), retrieved: z.string() })),
    nextRelease: z.string().nullable(),
    openItems: z.array(z.string()),
  }),
  cost: z.object({
    carried: z.object({
      value: z.number().nullable(),
      year: z.number(),
      from: cpiLegSchema.nullable(),
      to: cpiLegSchema.nullable(),
      factor: z.number().nullable(),
      source: z.string(),
      reason: z.string().optional(),
    }),
    eur: z.object({
      value: z.number().nullable(),
      rate: z.number().nullable(),
      year: z.number(),
      source: z.string(),
      reason: z.string().optional(),
      basis: z.enum(["survey", "carried"]),
    }),
  }),
  affordability: affordabilitySchema,
  charts: z.object({ shares: cityChartSchema, currency: cityChartSchema, housing: cityChartSchema }),
  macro: z.object({
    everydaySpendingEur: sourcedSchema,
    gniPpp: sourcedSchema,
    unemployment: sourcedSchema,
    lifeExpectancy: sourcedSchema,
    inflation: sourcedSchema,
  }),
  composition: z.object({
    agriculture: sourcedSchema,
    industry: sourcedSchema,
    services: sourcedSchema,
    manufacturing: sourcedSchema,
    residual: sourcedSchema,
  }),
});
export type CityResponse = z.infer<typeof cityResponseSchema>;

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
