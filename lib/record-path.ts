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
}

export interface RecordGeometry {
  sensor: string;
  /** Empty for a sensor with no benchmark. */
  benchmark: string;
  dots: RecordDot[];
  /** The last session's rebased values, as the text alternative states them. */
  last: { sensor: number; benchmark: number | null };
  sessions: number;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Each close as a percentage of the first. Null when there is no first close to divide by. */
export function rebase(closes: number[]): number[] | null {
  const base = closes[0];
  if (!base) return null;
  return closes.map((c) => (c / base) * 100);
}

/** Null when there is nothing to draw: under two sessions, or a base close of zero. */
export function recordGeometry(record: Pick<SensorRecord, "series"> & { events: { sessionDate: string }[] }): RecordGeometry | null {
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

  const dots: RecordDot[] = [];
  for (const e of record.events) {
    const i = dates.indexOf(e.sessionDate);
    if (i >= 0) dots.push({ date: e.sessionDate, x: x(i), y: y(s[i]) });
  }
  return {
    sensor: pts(s),
    benchmark: b ? pts(b) : "",
    dots,
    last: { sensor: r2(s[n - 1]), benchmark: b ? r2(b[n - 1]) : null },
    sessions: n,
  };
}
