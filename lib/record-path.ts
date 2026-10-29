import { linearTicks } from "@/lib/city-path";
import type { SensorRecord } from "@/lib/market-schemas";

/**
 * A sensor's record as SVG: the sensor and its benchmark, both rebased to 100 on the
 * first session they share, with a dot on each session that tripped (Phase 16 step 2;
 * mockups/market-v2/market-detail.html). Plain SVG in a fixed box that CSS stretches,
 * built on the server, because Recharts draws nothing in the server HTML (§17).
 * Pure, so the geometry and the rebase are testable.
 *
 * The rebase is a derived figure: each close divided by the close on the first
 * session, times 100. The record carries the closes as stored, so every leg of it is
 * on the page's data and the page can state the base date beside the chart.
 */
export const RECORD_WIDTH = 900;
export const RECORD_HEIGHT = 240;
const PAD = 14;

export interface RecordDot {
  /** The session, `2026-10-15`. */
  date: string;
  x: number;
  y: number;
  /** Where the dot sits as a share of the box, for HTML placed over a stretched SVG. */
  xPct: number;
  yPct: number;
  /** The side the close left on: the sign of the residual z. */
  direction: "up" | "down";
}

export interface RecordTick {
  /** Position as a share of the box. */
  pct: number;
  label: string;
  /** The 100 line, which every series starts on. */
  base?: boolean;
}

export interface RecordEnd {
  value: number;
  /** Where the label sits, as a share of the box height, nudged clear of the other line's. */
  yPct: number;
}

export interface RecordGeometry {
  sensor: string;
  /** Empty for a sensor with no benchmark. */
  benchmark: string;
  dots: RecordDot[];
  /** The price-index axis: round values, with the 100 line marked. */
  yTicks: RecordTick[];
  /** The month axis: a label at the first session of each month. */
  xTicks: RecordTick[];
  /** Each line's last value and label height. */
  ends: { sensor: RecordEnd; benchmark: RecordEnd | null };
  /** The last session's rebased values, as the text alternative states them. */
  last: { sensor: number; benchmark: number | null };
  sessions: number;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The least gap between the two end labels, as a share of the box height. */
const END_GAP = 9;

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Each close as a percentage of the first. Null when there is no first close to divide by. */
export function rebase(closes: number[]): number[] | null {
  const base = closes[0];
  if (!base) return null;
  return closes.map((c) => (c / base) * 100);
}

/** Null when there is nothing to draw: under two sessions, or a base close of zero. */
export function recordGeometry(record: Pick<SensorRecord, "series"> & { events: { sessionDate: string; trigger?: { z: number } }[] }): RecordGeometry | null {
  const { dates, close, benchmarkClose } = record.series;
  const n = dates.length;
  const s = rebase(close);
  if (n < 2 || !s || close.length !== n) return null;
  const b = benchmarkClose && benchmarkClose.length === n ? rebase(benchmarkClose) : null;

  const all = b ? [...s, ...b] : s;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const x = (i: number): number => r2((i / (n - 1)) * RECORD_WIDTH);
  const y = (v: number): number => r2(PAD + (1 - (v - lo) / span) * (RECORD_HEIGHT - 2 * PAD));
  const pts = (series: number[]): string => series.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const pctX = (i: number): number => r2((i / (n - 1)) * 100);
  const pctY = (v: number): number => r2((y(v) / RECORD_HEIGHT) * 100);

  const dots: RecordDot[] = [];
  for (const e of record.events) {
    const i = dates.indexOf(e.sessionDate);
    if (i >= 0) {
      dots.push({ date: e.sessionDate, x: x(i), y: y(s[i]), xPct: pctX(i), yPct: pctY(s[i]), direction: e.trigger && e.trigger.z < 0 ? "down" : "up" });
    }
  }

  const yTicks: RecordTick[] = linearTicks(lo, hi, 5).map((v) => ({ pct: pctY(v), label: String(v), ...(v === 100 ? { base: true } : {}) }));
  if (!yTicks.some((t) => t.base)) yTicks.push({ pct: pctY(100), label: "100", base: true });

  const xTicks: RecordTick[] = [];
  dates.forEach((d, i) => {
    if (i === 0 || d.slice(0, 7) !== dates[i - 1].slice(0, 7)) xTicks.push({ pct: pctX(i), label: MONTH[Number(d.slice(5, 7)) - 1] ?? d.slice(5, 7) });
  });

  let sensorY = pctY(s[n - 1]);
  let benchY = b ? pctY(b[n - 1]) : null;
  if (benchY !== null && Math.abs(sensorY - benchY) < END_GAP) {
    const mid = (sensorY + benchY) / 2;
    const half = END_GAP / 2;
    [sensorY, benchY] = sensorY <= benchY ? [mid - half, mid + half] : [mid + half, mid - half];
  }

  return {
    sensor: pts(s),
    benchmark: b ? pts(b) : "",
    dots,
    yTicks,
    xTicks,
    ends: {
      sensor: { value: r2(s[n - 1]), yPct: r2(sensorY) },
      benchmark: b && benchY !== null ? { value: r2(b[n - 1]), yPct: r2(benchY) } : null,
    },
    last: { sensor: r2(s[n - 1]), benchmark: b ? r2(b[n - 1]) : null },
    sessions: n,
  };
}
