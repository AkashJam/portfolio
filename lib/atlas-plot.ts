import {
  type ColumnKey,
  columnValue,
  formatChange,
  formatEur,
  formatUsd,
  formatYears,
} from "@/lib/atlas";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

// Pure geometry for the /atlas scatter (Phase 11 step 2). The SVG itself is
// components/atlas/Scatter.tsx; everything that decides where a point goes,
// which ones clip and which labels fit lives here so it can be tested.

export const PLOT = { width: 900, height: 470, left: 62, right: 876, top: 20, bottom: 414 } as const;

export interface Measure {
  key: ColumnKey;
  /** Text of the picker option. */
  option: string;
  /** Axis title, set in capitals on the plot. */
  title: string;
  kind: "change" | "level";
  tick: (v: number) => string;
  /** Label for the zero line when this measure is on the vertical axis. */
  zeroLabel?: string;
}

const percentTick = (v: number) => (Number.isInteger(v) ? `${v}%` : `${v.toFixed(1)}%`);
const plainTick = (v: number) => formatYears(v);

export const MEASURES: Measure[] = [
  {
    key: "everydaySpendingEur",
    option: "Everyday spending · € per person, monthly",
    title: "Everyday spending · € per person, per month",
    kind: "level",
    tick: formatEur,
  },
  {
    key: "shares",
    option: "Shares · change before inflation",
    title: "Shares · change before inflation",
    kind: "change",
    tick: formatChange,
    zeroLabel: "share prices unchanged",
  },
  {
    key: "housing",
    option: "Housing · change after inflation",
    title: "House prices · change after inflation",
    kind: "change",
    tick: formatChange,
    zeroLabel: "house prices kept pace with inflation",
  },
  {
    key: "prices",
    option: "Prices · change",
    title: "Prices · change",
    kind: "change",
    tick: formatChange,
    zeroLabel: "prices unchanged",
  },
  {
    key: "currency",
    option: "Currency vs EUR · change",
    title: "Currency vs EUR · change",
    kind: "change",
    tick: formatChange,
    zeroLabel: "unchanged against the euro",
  },
  {
    key: "gniPpp",
    option: "Income · $ per person, price-adjusted",
    title: "Income · $ per person, price-adjusted",
    kind: "level",
    tick: formatUsd,
  },
  { key: "unemployment", option: "Unemployment", title: "Unemployment · %", kind: "level", tick: percentTick },
  { key: "lifeExpectancy", option: "Life expectancy", title: "Life expectancy · years", kind: "level", tick: plainTick },
];

export function measureOf(key: ColumnKey): Measure {
  return MEASURES.find((m) => m.key === key) ?? MEASURES[0];
}

// ---- domain ---------------------------------------------------------------

export interface Domain {
  min: number;
  max: number;
  ticks: number[];
  /** Values above `max` that are drawn on the axis edge instead. */
  clipped: number[];
}

/** 1, 2, 2.5, 5 times a power of ten: the step a tick row can read at a glance. */
export function niceStep(rough: number): number {
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * pow;
}

export function niceTicks(lo: number, hi: number, target = 5): number[] {
  if (hi <= lo) return [lo];
  const step = niceStep((hi - lo) / target);
  const first = Math.floor(lo / step + 1e-9) * step;
  const last = Math.ceil(hi / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let t = first; t <= last + step / 2; t += step) ticks.push(Math.round(t * 1e6) / 1e6);
  return ticks;
}

/**
 * The 2x rule (owner, 2026-10-12): walking down from the largest value, a value
 * more than twice the next one is out of range and is drawn on the axis edge
 * rather than stretching the axis until the other points are a smudge. Türkiye's
 * +1,725% shares sit 4.7x above India's +365%; the rest keep their room.
 */
export function splitClipped(values: number[]): { kept: number[]; clipped: number[] } {
  const sorted = [...values].sort((a, b) => b - a);
  // At least three values always stay: an axis built on one or two points says nothing.
  let i = 0;
  while (i < sorted.length - 3 && sorted[i + 1] > 0 && sorted[i] > 2 * sorted[i + 1]) i++;
  return { kept: sorted.slice(i), clipped: sorted.slice(0, i) };
}

export function buildDomain(values: number[]): Domain {
  if (values.length === 0) return { min: 0, max: 1, ticks: [0, 1], clipped: [] };
  const { kept, clipped } = splitClipped(values);
  const hi = Math.max(...kept);
  const lo = Math.min(...kept);
  // Zero belongs on the axis when the data straddles it or sits close to it;
  // a tight band like life expectancy (66 to 84) is not stretched down to 0.
  const lower = lo < 0 || (lo >= 0 && lo < 0.5 * hi) ? Math.min(lo, 0) : lo;
  // All kept values equal (a one-country test, a flat measure): pad so the scale has a width.
  const top = hi > lower ? hi + (hi - lower) * 0.04 : lower + 1;
  const ticks = niceTicks(lower, top);
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks, clipped };
}

// ---- points ---------------------------------------------------------------

export interface PlotPoint {
  slug: string;
  city: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  /** Each axis the point was clipped on, with its true value; null when it sits in range. */
  clip: { axis: "x" | "y"; value: number }[] | null;
  label: { x: number; y: number; anchor: "start" | "end"; text: string } | null;
}

export interface PlotModel {
  xDomain: Domain;
  yDomain: Domain;
  points: PlotPoint[];
  /** Rows left out because one of the two measures has no figure for them. */
  skipped: number;
  diagonal: { x1: number; y1: number; x2: number; y2: number } | null;
  zeroX: number | null;
  zeroY: number | null;
}

const scale = (v: number, d: Domain, from: number, to: number) => from + ((v - d.min) / (d.max - d.min)) * (to - from);
export const projectX = (v: number, d: Domain) => scale(v, d, PLOT.left, PLOT.right);
export const projectY = (v: number, d: Domain) => scale(v, d, PLOT.bottom, PLOT.top);

/** y = x is meaningful for exactly one pair: prices (x) against shares (y), same window. */
export function showsDiagonal(xKey: ColumnKey, yKey: ColumnKey): boolean {
  return xKey === "prices" && yKey === "shares";
}

const DOT = 5.5;
const LABEL_H = 14;
const CHAR_W = 6.6;

interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
const overlaps = (a: Rect, b: Rect) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

export function buildPlot(rows: AtlasRow[], xKey: ColumnKey, yKey: ColumnKey, window: WindowStart): PlotModel {
  const have = rows
    .map((r) => ({ r, x: columnValue(r, xKey, window), y: columnValue(r, yKey, window) }))
    .filter((p): p is { r: AtlasRow; x: number; y: number } => p.x !== null && p.y !== null);

  const xDomain = buildDomain(have.map((p) => p.x));
  const yDomain = buildDomain(have.map((p) => p.y));

  const points: PlotPoint[] = have.map(({ r, x, y }) => {
    const clipX = x > xDomain.max;
    const clipY = y > yDomain.max;
    return {
      slug: r.slug,
      city: r.city,
      x,
      y,
      cx: projectX(clipX ? xDomain.max : x, xDomain),
      cy: projectY(clipY ? yDomain.max : y, yDomain),
      clip: clipX || clipY ? [...(clipX ? [{ axis: "x" as const, value: x }] : []), ...(clipY ? [{ axis: "y" as const, value: y }] : [])] : null,
      label: null,
    };
  });

  // Labels go to the points farthest from the crowd first; one that would land
  // on an earlier label or on any dot is left off and keeps its <title> instead.
  const mx = points.reduce((s, p) => s + p.cx, 0) / (points.length || 1);
  const my = points.reduce((s, p) => s + p.cy, 0) / (points.length || 1);
  const order = [...points].sort((a, b) => Math.hypot(b.cx - mx, b.cy - my) - Math.hypot(a.cx - mx, a.cy - my));
  const dots: Rect[] = points.map((p) => ({ x1: p.cx - DOT - 1, y1: p.cy - DOT - 1, x2: p.cx + DOT + 1, y2: p.cy + DOT + 1 }));
  const placed: Rect[] = [];
  for (const p of order) {
    const text = p.clip
      ? `${p.city} \u25b8 ${p.clip.map((c) => measureOf(c.axis === "x" ? xKey : yKey).tick(c.value)).join(" \u00b7 ")}`
      : p.city;
    const w = text.length * CHAR_W;
    const onRight = p.cx + 9 + w <= PLOT.width - 6;
    const x = onRight ? p.cx + 9 : p.cx - 9;
    const rect: Rect = { x1: onRight ? x : x - w, y1: p.cy - LABEL_H / 2 - 1, x2: onRight ? x + w : x, y2: p.cy + LABEL_H / 2 - 1 };
    const hitsDot = dots.some((d, i) => points[i] !== p && overlaps(rect, d));
    if (hitsDot || placed.some((q) => overlaps(rect, q))) continue;
    placed.push(rect);
    p.label = { x, y: p.cy + 4, anchor: onRight ? "start" : "end", text };
  }

  let diagonal: PlotModel["diagonal"] = null;
  if (showsDiagonal(xKey, yKey)) {
    const lo = Math.max(xDomain.min, yDomain.min);
    const hi = Math.min(xDomain.max, yDomain.max);
    if (hi > lo) {
      diagonal = {
        x1: projectX(lo, xDomain),
        y1: projectY(lo, yDomain),
        x2: projectX(hi, xDomain),
        y2: projectY(hi, yDomain),
      };
    }
  }

  const strict = (d: Domain) => d.min < 0 && d.max > 0;
  const zeroOn = (key: ColumnKey) => measureOf(key).kind === "change";
  return {
    xDomain,
    yDomain,
    points,
    skipped: rows.length - have.length,
    diagonal,
    zeroX: zeroOn(xKey) && strict(xDomain) ? projectX(0, xDomain) : null,
    zeroY: zeroOn(yKey) && strict(yDomain) ? projectY(0, yDomain) : null,
  };
}
