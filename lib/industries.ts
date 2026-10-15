import type { PriceRow } from "@/lib/prices";

/**
 * The Industries strip's rules, pure so they are testable without a browser
 * (portfolio.md §15 Phase 14 step 5).
 */

export interface SectorTile {
  symbol: string;
  label: string;
  row: PriceRow;
}

/**
 * Strongest to weakest by the day's change, ties by ticker, a tile with no price
 * last. Unlike the sensors, which are never re-ranked (bearing.md #92), the
 * baskets move once a day at the close, so this order cannot reshuffle under the
 * reader, and the strip's job is to show which industries led.
 */
export function rankTiles(tiles: SectorTile[]): SectorTile[] {
  const priced = (t: SectorTile) => t.row.asOf !== null && t.row.prevClose !== 0;
  return [...tiles].sort((a, b) => {
    if (priced(a) !== priced(b)) return priced(a) ? -1 : 1;
    if (priced(a) && a.row.changePercent !== b.row.changePercent) return b.row.changePercent - a.row.changePercent;
    return a.symbol.localeCompare(b.symbol);
  });
}

/**
 * A move of this size fills the half-bar; the mock's scale (−2.81% fills 31% of
 * it) is 11% per percentage point. Past it the bar stops and the printed figure
 * carries the rest.
 */
export const METER_FULL_PERCENT = 4.5;

/** The bar's length as a percentage of the strip's half-width (0 to 50). */
export function meterWidth(changePercent: number): number {
  const share = Math.min(Math.abs(changePercent) / METER_FULL_PERCENT, 1);
  return Math.round(share * 50 * 100) / 100;
}

/** Whether the bar stops short of the move, so the tile can say the number is larger. */
export function isClipped(changePercent: number): boolean {
  return Math.abs(changePercent) > METER_FULL_PERCENT;
}
