import type { Band } from "@/lib/market-schemas";

/**
 * The expectation band as SVG, in a fixed box that CSS stretches to fit
 * (portfolio.md §15 Phase 15 step 7; §17). Plain SVG built here rather than
 * through Recharts: Recharts reports its size from an effect, so even at a fixed
 * size it draws nothing in the server HTML. Pure, so the geometry is testable.
 *
 * The line is drawn in two pieces: the stretch inside the band in the reading
 * ink, and the stretch from the last session inside it onward in the colour of
 * the side it left on, so the departure is the thing the eye lands on.
 */
export const BAND_WIDTH = 560;
export const BAND_HEIGHT = 130;
const PAD = 10;

export interface BandGeometry {
  /** The shaded area between the edges, as a closed path. */
  fill: string;
  upper: string;
  lower: string;
  /** The close, up to the last session inside the band. */
  inside: string;
  /** From the last session inside the band to the end: the departure. */
  outside: string;
  dot: { x: number; y: number };
  /** Which side the final close left on. */
  side: "above" | "below" | "inside";
  sessions: number;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Null when there is nothing to draw (under two sessions). */
export function bandGeometry(band: Band): BandGeometry | null {
  const n = band.close.length;
  if (n < 2 || band.lower.length !== n || band.upper.length !== n) return null;
  const lo = Math.min(...band.lower, ...band.close);
  const hi = Math.max(...band.upper, ...band.close);
  const span = hi - lo || 1;
  const x = (i: number): number => r2((i / (n - 1)) * BAND_WIDTH);
  const y = (v: number): number => r2(PAD + (1 - (v - lo) / span) * (BAND_HEIGHT - 2 * PAD));
  const pts = (series: number[], from = 0, to = n): string =>
    series
      .slice(from, to)
      .map((v, k) => `${x(from + k)},${y(v)}`)
      .join(" ");

  const outsideAt = (i: number): boolean => band.close[i] < band.lower[i] || band.close[i] > band.upper[i];
  let firstOut = n;
  while (firstOut > 0 && outsideAt(firstOut - 1)) firstOut--;
  const split = Math.max(1, firstOut); // the last session inside is firstOut-1; the break starts there

  const upper = pts(band.upper);
  const lowerReversed = band.lower
    .map((v, i) => `${x(i)},${y(v)}`)
    .reverse()
    .join(" ");
  const last = n - 1;
  const side = band.close[last] > band.upper[last] ? "above" : band.close[last] < band.lower[last] ? "below" : "inside";
  return {
    fill: `M${upper.replaceAll(" ", " L")} L${lowerReversed.replaceAll(" ", " L")} Z`,
    upper,
    lower: pts(band.lower),
    inside: pts(band.close, 0, split),
    outside: firstOut === n ? "" : pts(band.close, split - 1 < 0 ? 0 : split - 1),
    dot: { x: x(last), y: y(band.close[last]) },
    side,
    sessions: n,
  };
}

/** The sparkline's box. */
export const SPARK_WIDTH = 104;
export const SPARK_HEIGHT = 26;

/** Polyline points for a row's closes, or null for under two. */
export function sparkPoints(closes: number[]): string | null {
  const n = closes.length;
  if (n < 2) return null;
  const lo = Math.min(...closes);
  const hi = Math.max(...closes);
  const span = hi - lo || 1;
  return closes
    .map((v, i) => `${r2((i / (n - 1)) * SPARK_WIDTH)},${r2(2 + (1 - (v - lo) / span) * (SPARK_HEIGHT - 4))}`)
    .join(" ");
}

/** The σ column's bar, in pixels: 11px a sigma, no more than 3.3σ. */
export function sigmaBarWidth(z: number): number {
  return Math.round(Math.min(Math.abs(z), 3.3) * 11);
}
