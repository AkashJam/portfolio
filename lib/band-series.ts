import { sessionDayKey, vintageNote } from "@/lib/prices";

/**
 * The home band's line (portfolio.md §15 Phase 14 step 9), pure so the windows and
 * the shaping are testable without a ticker. Open, the band charts the last twenty
 * 1m closes and glides; closed, it draws the last regular session's path, or, for a
 * sensor with no intraday bars for it, its last twenty daily closes, and says so.
 */

export type BandMode = "open" | "closed";

export interface BandSeries {
  mode: BandMode;
  points: number[];
  /** `daily` is the fallback: a path of closes, not of one session. */
  source: "1m" | "daily";
}

export const BAND_POINTS = 20;

/** The ticker answers the oldest 1000 bars from `from`, so every read is bounded. */
const HOUR = 3_600_000;

interface Bar {
  time: string;
  close: number;
}

/** Open: three hours is wide enough to hold twenty minutes of bars for a quiet name. */
export function openWindow(now: Date): { from: Date } {
  return { from: new Date(now.getTime() - 3 * HOUR) };
}

/**
 * The window that holds one session's regular hours: from 12:00 UTC on the session
 * date (08:00 New York in summer, 07:00 in winter) to midnight UTC after it. That is
 * at most about 720 bars, under the ticker's limit; `regularSession` trims the rest.
 */
export function sessionWindow(asOf: string): { from: Date; to: Date } {
  const day = sessionDayKey(asOf);
  const from = new Date(`${day}T12:00:00Z`);
  return { from, to: new Date(from.getTime() + 12 * HOUR) };
}

const NY_HM = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });

/** New York minutes since midnight. */
function nyMinutes(iso: string): number {
  const [h, m] = NY_HM.format(new Date(iso)).split(":").map(Number);
  return h * 60 + m;
}

/** 09:30 to 16:00 New York, the regular session: extended-hours bars are not "the session". */
export function regularSession(bars: Bar[]): number[] {
  return bars.filter((b) => {
    const m = nyMinutes(b.time);
    return m >= 9 * 60 + 30 && m < 16 * 60;
  }).map((b) => b.close);
}

/** The newest `n` closes. */
export function lastCloses(bars: Bar[], n = BAND_POINTS): number[] {
  return bars.slice(-n).map((b) => b.close);
}

/** At least two points draw a line; fewer is "no series". */
export const drawable = (points: number[]): boolean => points.length >= 2;

export function shapeOpen(intraday: Bar[], daily: Bar[]): BandSeries | null {
  const points = lastCloses(intraday);
  if (drawable(points)) return { mode: "open", points, source: "1m" };
  const fallback = lastCloses(daily);
  return drawable(fallback) ? { mode: "open", points: fallback, source: "daily" } : null;
}

export function shapeClosed(session: Bar[], daily: Bar[]): BandSeries | null {
  const points = regularSession(session);
  if (drawable(points)) return { mode: "closed", points, source: "1m" };
  const fallback = lastCloses(daily);
  return drawable(fallback) ? { mode: "closed", points: fallback, source: "daily" } : null;
}

/** What the state line adds when the line is the daily fallback. */
export function seriesNote(series: BandSeries): string | null {
  return series.source === "daily" ? `last ${series.points.length} sessions` : null;
}

/** `6 Oct close`, or `last trade 07:21 ET` when the newest price is a trade, never a close: the tape's note beside a closed price. */
export function closeLabel(asOf: string | null): string | null {
  if (asOf === null || Number.isNaN(Date.parse(asOf))) return null;
  return vintageNote(asOf);
}

/** Points to SVG path coordinates in a `width` × `height` box, padded so the line never touches an edge. */
export function toPath(points: number[], width: number, height: number, pad = 24): { line: string; area: string; last: [number, number] } {
  if (points.length === 0) return { line: "", area: "", last: [0, 0] };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const xy = points.map((v, i): [number, number] => [
    Math.round(i * step * 100) / 100,
    Math.round((height - pad - ((v - min) / range) * (height - 2 * pad)) * 100) / 100,
  ]);
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const last = xy[xy.length - 1];
  return { line, area: `${line} L${last[0]} ${height} L0 ${height} Z`, last };
}
