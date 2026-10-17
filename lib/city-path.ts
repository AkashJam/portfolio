import type { LongSeries } from "@/lib/market-schemas";

/**
 * A city page's long series as SVG (Phase 16 step 4; mockups/atlas-v1/atlas-city.html).
 * The line is plain SVG in a box CSS stretches, built on the server so it is in the
 * HTML before any script runs (§17); the axis labels are HTML placed by percentage,
 * because text in a stretched SVG distorts. Pure, so the geometry is testable.
 *
 * The share index and the currency are drawn on a log axis (owner, step 4): equal
 * vertical distance is equal percentage change, so 1980 reads like 2020 in every
 * country, hyperinflation included. Real house prices stay linear.
 */
export const CITY_W = 900;
export const CITY_H = 290;
const PAD = 12;

export type Scale = "log" | "linear";

export interface AxisTick {
  /** Position along the axis, 0 to 100 percent from the left or the top. */
  pct: number;
  label: string;
}

export interface CityGeometry {
  scale: Scale;
  line: string;
  /** The line closed down to the baseline, for the fill. */
  area: string;
  xTicks: AxisTick[];
  yTicks: AxisTick[];
  first: Point;
  last: Point;
  peak: Point;
  trough: Point;
  sessions: number;
}

export interface Point {
  /** `1959-01`, or `2025-Q4` for a quarterly series. */
  date: string;
  value: number;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** The label of observation i: a month for a monthly series, a quarter for a quarterly one. */
export function seriesDate(s: LongSeries, i: number): string {
  const [y, m] = s.start.split("-").map(Number);
  const idx = y * 12 + (m - 1) + i * s.step;
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return s.step === 3 ? `${year}-Q${Math.floor((month - 1) / 3) + 1}` : `${year}-${String(month).padStart(2, "0")}`;
}

function year(s: LongSeries, i: number): number {
  const [y, m] = s.start.split("-").map(Number);
  return Math.floor((y * 12 + (m - 1) + i * s.step) / 12);
}

/** 1, 2 and 5 times a power of ten inside [lo, hi]. */
export function logTicks(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let p = Math.floor(Math.log10(lo)); p <= Math.ceil(Math.log10(hi)); p++) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** p;
      if (v >= lo && v <= hi) out.push(v);
    }
  }
  return out;
}

/** About `n` round values inside [lo, hi]. */
export function linearTicks(lo: number, hi: number, n = 4): number[] {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(r2(v));
  return out;
}

const fmt = (v: number): string => (v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(r2(v)));

/** Null when there is nothing to draw: under two points, or a non-positive value on a log axis. */
export function cityGeometry(s: LongSeries, scale: Scale): CityGeometry | null {
  const n = s.values.length;
  if (n < 2) return null;
  if (scale === "log" && s.values.some((v) => v <= 0)) return null;
  const f = scale === "log" ? Math.log : (v: number) => v;
  const lo = Math.min(...s.values);
  const hi = Math.max(...s.values);
  const flo = f(lo);
  const span = f(hi) - flo || 1;
  const x = (i: number): number => r2((i / (n - 1)) * CITY_W);
  const y = (v: number): number => r2(PAD + (1 - (f(v) - flo) / span) * (CITY_H - 2 * PAD));
  const pts = s.values.map((v, i) => `${x(i)},${y(v)}`);

  let peak = 0;
  let trough = 0;
  s.values.forEach((v, i) => {
    if (v > s.values[peak]) peak = i;
    if (v < s.values[trough]) trough = i;
  });
  const at = (i: number): Point => ({ date: seriesDate(s, i), value: r2(s.values[i]) });

  // A tick every 5, 10 or 20 years, whichever leaves six or fewer.
  const years = year(s, n - 1) - year(s, 0);
  const every = [5, 10, 20].find((e) => years / e <= 6) ?? 20;
  const xTicks: AxisTick[] = [];
  for (let i = 0; i < n; i++) {
    const y0 = year(s, i);
    if (y0 % every === 0 && (i === 0 || year(s, i - 1) !== y0)) xTicks.push({ pct: r2((i / (n - 1)) * 100), label: String(y0) });
  }
  const values = scale === "log" ? logTicks(lo, hi) : linearTicks(lo, hi);
  const yTicks = values.map((v) => ({ pct: r2(((y(v) - 0) / CITY_H) * 100), label: fmt(v) }));

  return {
    scale,
    line: pts.join(" "),
    area: `M0,${CITY_H} L${pts.join(" L")} L${CITY_W},${CITY_H} Z`,
    xTicks,
    yTicks,
    first: at(0),
    last: at(n - 1),
    peak: at(peak),
    trough: at(trough),
    sessions: n,
  };
}

/** The chart's text alternative: where it starts, peaks, troughs and ends. */
export function cityAlt(name: string, unit: string, g: CityGeometry): string {
  return (
    `${name}, ${g.first.date} to ${g.last.date}, on a ${g.scale === "log" ? "logarithmic" : "linear"} scale${unit ? ` (${unit})` : ""}. ` +
    `It starts at ${g.first.value}, peaks at ${g.peak.value} in ${g.peak.date}, lowest ${g.trough.value} in ${g.trough.date}, and ends at ${g.last.value}.`
  );
}
