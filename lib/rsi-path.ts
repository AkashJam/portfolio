/**
 * The RSI(14) panel's line as an SVG path, in a fixed 900x160 box that CSS stretches
 * to fit (portfolio.md §15 Phase 14 step 8). Pure, so it is testable, and plain SVG
 * rather than Recharts: Recharts 3.10.1 reports its size from an effect, so even at a
 * fixed size it draws nothing in the server HTML, which is the thing this replaces
 * `ResponsiveContainer` to get.
 */
export const RSI_WIDTH = 900;
export const RSI_HEIGHT = 160;

/** The y of an RSI value in the box: 0 at the bottom, 100 at the top. */
export function rsiY(value: number): number {
  const clamped = Math.min(100, Math.max(0, value));
  return Math.round((RSI_HEIGHT - (clamped / 100) * RSI_HEIGHT) * 100) / 100;
}

/** `M0 80 L450 40 …`, the points spread evenly across the width; empty for no points. */
export function rsiPath(values: number[]): string {
  if (values.length === 0) return "";
  const step = values.length > 1 ? RSI_WIDTH / (values.length - 1) : 0;
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"}${Math.round(i * step * 100) / 100} ${rsiY(v)}`)
    .join(" ");
}
