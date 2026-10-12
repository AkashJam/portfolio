import {
  MINUS,
  columnValue,
  formatChange,
  windowLabel,
  type ChangeKey,
} from "@/lib/atlas";
import { niceStep } from "@/lib/atlas-plot";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

// Pure parts of the /atlas map (Phase 11 step 5; bearing.md #83, #106): the
// colour scale, the equal-tile layout, and the caveats that go into a link's
// name and under the legend. The drawing is components/atlas/WorldMap.tsx.

// ---- colour ----------------------------------------------------------------

const NEUTRAL = [0x13, 0x17, 0x1d] as const; // #13171d: no change
const UP = [0x26, 0xa6, 0x9a] as const; // #26a69a: the market-up teal
const DOWN = [0xef, 0x53, 0x50] as const; // #ef5350: the market-down red

/** Exponent fitted to the mock's legend swatches: a gentle curve, so small changes still show. */
const CURVE = 0.7;

export const NO_FIGURE = "#2a3038"; // an atlas country with no figure in this view
export const NO_ROW = "#161a20"; // a country with no atlas row at all

const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/**
 * Prices are one hue (the mock: indigo, #23283d to #818cf8, linear), because
 * every value is a rise and colour must not mean better or worse. The other
 * three measures run both ways and keep the diverging ramp.
 */
export type Scheme = "diverging" | "sequential";
export const schemeOf = (measure: MapMeasure): Scheme =>
  measure === "prices" ? "sequential" : "diverging";

const SEQ_FROM = [0x23, 0x28, 0x3d] as const;
const SEQ_TO = [0x81, 0x8c, 0xf8] as const;

/**
 * Fill for a change. Diverging: neutral at 0, full colour at `limit`, saturating
 * beyond it. Sequential: from the low end at 0 to full at `limit`; a fall clamps
 * to the low end and still carries its figure.
 */
export function colourFor(
  value: number,
  limit: number,
  scheme: Scheme = "diverging",
): string {
  if (scheme === "sequential") {
    const t = Math.min(Math.max(value, 0) / limit, 1);
    return `#${[0, 1, 2].map((i) => hex(SEQ_FROM[i] + (SEQ_TO[i] - SEQ_FROM[i]) * t)).join("")}`;
  }
  const t = Math.min(Math.abs(value) / limit, 1) ** CURVE;
  const to = value < 0 ? DOWN : UP;
  return `#${[0, 1, 2].map((i) => hex(NEUTRAL[i] + (to[i] - NEUTRAL[i]) * t)).join("")}`;
}

/** The legend's nine swatches from the same function: fall to rise, or low to high. */
export function legendStops(
  limit: number,
  scheme: Scheme = "diverging",
): { value: number; fill: string }[] {
  const fractions =
    scheme === "sequential"
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => i / 8)
      : [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  return fractions.map((f) => ({
    value: f * limit,
    fill: colourFor(f * limit, limit, scheme),
  }));
}

/**
 * The view's colour limit (owner, 2026-10-12): the third-largest absolute change
 * among the countries that have a figure, rounded up to a tidy step. The two
 * biggest movers saturate and the rest keep their gradation, and no view needs a
 * hand-set number. With fewer than three figures the largest is used.
 */
export function limitFor(values: number[]): number {
  const abs = values.map(Math.abs).sort((a, b) => b - a);
  if (abs.length === 0 || abs[0] === 0) return 1;
  const v = abs[Math.min(2, abs.length - 1)] || abs[0];
  const step = niceStep(v / 5);
  return Math.ceil(v / step - 1e-9) * step;
}

// ---- text on a fill ----------------------------------------------------------

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
function luminance(fill: string): number {
  const n = parseInt(fill.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * White or black, whichever reads better on the fill. Pure white and black, not
 * the site's text greys: with those, a band of mid teals clears neither at 4.5:1.
 */
export function textColourFor(fill: string): "#ffffff" | "#000000" {
  return contrast(fill, "#ffffff") >= contrast(fill, "#000000")
    ? "#ffffff"
    : "#000000";
}

// ---- equal tiles -------------------------------------------------------------

/** Column, row of each country on the equal-tile map: a rough geography, 8 by 6. */
export const TILES: Record<string, [number, number]> = {
  CA: [0, 0],
  US: [0, 1],
  MX: [0, 2],
  BR: [1, 3],
  CL: [1, 4],
  IE: [2, 1],
  GB: [3, 0],
  NL: [3, 1],
  FR: [3, 2],
  NO: [4, 0],
  DE: [4, 1],
  IT: [4, 2],
  ZA: [4, 4],
  PL: [5, 1],
  TR: [5, 2],
  IL: [5, 3],
  KR: [6, 0],
  CN: [6, 1],
  IN: [6, 2],
  AU: [6, 4],
  JP: [7, 0],
  ID: [7, 3],
  NZ: [7, 5],
};
export const TILE = { size: 42, pitch: 44, cols: 8, rows: 6 } as const;

// ---- what the map is showing -------------------------------------------------

export type MapMeasure = ChangeKey;
export const MAP_MEASURES: MapMeasure[] = [
  "housing",
  "shares",
  "prices",
  "currency",
];

export const MEASURE_LABEL: Record<MapMeasure, string> = {
  housing: "Housing",
  shares: "Shares",
  prices: "Prices",
  currency: "Currency",
};

export const MEASURE_NAME: Record<MapMeasure, string> = {
  housing: "house prices after inflation",
  shares: "share prices before inflation",
  prices: "consumer prices",
  currency: "currency against the euro",
};

/** The whole shared window, or one calendar year (bearing.md #88). */
export interface MapView {
  period: "window" | "year";
  year: number;
}

/** What a country's colour and figure read: the window's change, or one year's. */
export function mapValue(
  row: AtlasRow,
  measure: MapMeasure,
  view: MapView,
  window: WindowStart,
): number | null {
  if (view.period === "window") return columnValue(row, measure, window);
  return row[measure].years?.[String(view.year)] ?? null;
}

/** The start the "no rate" caveat names: the window's first year, or the year itself. */
const startOf = (view: MapView, window: WindowStart) =>
  view.period === "year" ? String(view.year) : window;

export function viewLabel(
  view: MapView,
  window: WindowStart,
  end: string,
): string {
  return view.period === "year"
    ? `during ${view.year}`
    : windowLabel(window, end);
}

/** One decimal in the small-change views (a year of prices is +6.6%), whole numbers otherwise. */
export const digitsFor = (limit: number): 0 | 1 => (limit < 20 ? 1 : 0);

const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatMapChange(value: number, digits: 0 | 1): string {
  if (digits === 0) return formatChange(value);
  const r = Math.round(value * 10) / 10;
  if (r === 0) return "0.0%";
  return `${r > 0 ? "+" : MINUS}${oneDecimal.format(Math.abs(r))}%`;
}

// ---- caveats and names -------------------------------------------------------

export type CaveatKind = "euro" | "unpublished" | "stale" | "derived";

/** What stands between a country and a plain figure in this view, from the data itself. */
export function caveatKind(
  row: AtlasRow,
  measure: MapMeasure,
  view: MapView,
  window: WindowStart,
): CaveatKind | null {
  const m = row[measure];
  if (mapValue(row, measure, view, window) === null) {
    return m.reason === "euro" ||
      m.reason === "stale" ||
      m.reason === "unpublished"
      ? m.reason
      : "unpublished";
  }
  return m.derived ? "derived" : null;
}

export function caveatText(kind: CaveatKind, start: string): string {
  switch (kind) {
    case "euro":
      return "euro area, no rate against itself";
    case "unpublished":
      return `no ${start} rate`;
    case "stale":
      return "source out of date";
    case "derived":
      return "derived via the dollar";
  }
}

export function figureOf(
  row: AtlasRow,
  measure: MapMeasure,
  view: MapView,
  window: WindowStart,
  digits: 0 | 1,
): string | null {
  const v = mapValue(row, measure, view, window);
  return v === null ? null : formatMapChange(v, digits);
}

/** "Italy: −26%, house prices after inflation, change 2010–24" plus any caveat. */
export function linkName(
  row: AtlasRow,
  measure: MapMeasure,
  view: MapView,
  window: WindowStart,
  end: string,
  digits: 0 | 1,
): string {
  const kind = caveatKind(row, measure, view, window);
  const fig = figureOf(row, measure, view, window, digits) ?? "no figure";
  const base = `${row.country}: ${fig}, ${MEASURE_NAME[measure]}, change ${viewLabel(view, window, end)}`;
  return kind ? `${base}, ${caveatText(kind, startOf(view, window))}` : base;
}

/**
 * The line under the legend (#106). It names only the kinds of exception that
 * occur in the current view, so on housing there is none. Chile's country is the
 * asterisked one.
 */
export function exceptionsLine(
  rows: AtlasRow[],
  measure: MapMeasure,
  view: MapView,
  window: WindowStart,
): string | null {
  const by: Record<CaveatKind, string[]> = {
    euro: [],
    unpublished: [],
    stale: [],
    derived: [],
  };
  for (const r of rows) {
    const k = caveatKind(r, measure, view, window);
    if (k) by[k].push(r.country);
  }
  const start = startOf(view, window);
  const parts: string[] = [];
  if (by.euro.length) parts.push("the euro area has no rate against itself");
  if (by.unpublished.length)
    parts.push(
      `${list(by.unpublished)} ${by.unpublished.length > 1 ? "have" : "has"} no ${start} rate`,
    );
  if (by.stale.length) parts.push(`${list(by.stale)}'s source is out of date`);
  const tail = by.derived.length
    ? ` * ${list(by.derived)}'s figure is derived via the dollar.`
    : "";
  if (parts.length === 0 && !tail) return null;
  const head = parts.length ? `No figure: ${parts.join("; ")}.` : "";
  return `${head}${tail}`.trim();
}

function list(items: string[]): string {
  return items.length > 1
    ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
    : items[0];
}

// ---- the controls' state and its address ---------------------------------------

export interface MapState extends MapView {
  measure: MapMeasure;
}

export interface YearBounds {
  first: number;
  last: number;
}

/** The measure's own years (#103): prices start a year after the others, Israel's currency too. */
export function yearBounds(rows: AtlasRow[], measure: MapMeasure): YearBounds {
  const years = rows
    .flatMap((r) => Object.keys(r[measure].years ?? {}).map(Number))
    .filter(Number.isFinite);
  if (years.length === 0) return { first: 0, last: 0 };
  return { first: Math.min(...years), last: Math.max(...years) };
}

const inRange = (year: number, b: YearBounds) =>
  Number.isInteger(year) && year >= b.first && year <= b.last;

/** Changing measure keeps the year if the new measure has it, else moves to its first (#103). */
export function switchMeasure(
  state: MapState,
  measure: MapMeasure,
  rows: AtlasRow[],
): MapState {
  const b = yearBounds(rows, measure);
  return {
    ...state,
    measure,
    year: inRange(state.year, b) ? state.year : b.first,
  };
}

/**
 * Reads `?measure=&year=` (decision #88; defaults omitted). A year the measure
 * lacks opens one-year mode on the measure's first year, and the caller rewrites
 * the address to name it (owner, 2026-10-12). An unreadable measure is housing;
 * an unreadable year is no year.
 */
export function parseAddress(search: string, rows: AtlasRow[]): MapState {
  const q = new URLSearchParams(search);
  const asked = q.get("measure");
  const measure = MAP_MEASURES.find((m) => m === asked) ?? "housing";
  const b = yearBounds(rows, measure);
  const raw = q.get("year");
  const year = raw !== null && /^\d{4}$/.test(raw) ? Number(raw) : null;
  if (year === null) return { measure, period: "window", year: b.last };
  return { measure, period: "year", year: inRange(year, b) ? year : b.first };
}

/** `?measure=currency&year=2022`, or "" when everything is the default (housing, whole window). */
export function serialiseAddress(state: MapState): string {
  const q = new URLSearchParams();
  if (state.measure !== "housing") q.set("measure", state.measure);
  if (state.period === "year") q.set("year", String(state.year));
  const s = q.toString();
  return s ? `?${s}` : "";
}
