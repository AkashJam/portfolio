import { count } from "@/lib/atlas-provenance";
import type { AtlasRow } from "@/lib/market-schemas";

// The stated absences under the countries table (Phase 11 step 9; bearing.md
// #101): what the page does not have, said once, with the counts taken from the
// rows. Nothing here promises a later release: a promise on the page goes stale
// if the work slips.

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * "Eleven of these rows name a US-listed bank or telecom as their market
 * sensor; the other twelve have none." The name is text because this page shows
 * no market figure, so it never depends on a market feed.
 */
export function sensorLine(rows: AtlasRow[]): string {
  const withSensor = rows.filter((r) => r.sensor).length;
  const without = rows.length - withSensor;
  const tail =
    " The name is text, not a link: this page shows no market figure, so it never depends on a market feed.";
  if (withSensor === 0) return `No row names a market sensor.${tail}`;
  if (without === 0)
    return `Every row names a US-listed bank or telecom as its market sensor.${tail}`;
  return `${cap(count(withSensor))} of these rows name a US-listed bank or telecom as their market sensor; the other ${count(without)} have none.${tail}`;
}

export function anyCityPage(rows: AtlasRow[]): boolean {
  return rows.some((r) => r.hasCityPage);
}

/** The line about city pages: none yet, or how a name tells you whether one exists. */
export function cityPageLine(rows: AtlasRow[]): string {
  return anyCityPage(rows)
    ? "Where a city has a page its name is a link; the rest say no city page yet."
    : "No city has a page yet, so no name is a link.";
}

/** A city's page address, only where the page exists (`hasCityPage` means it exists, not that one is planned). */
export function cityHref(row: AtlasRow): string | null {
  return row.hasCityPage ? `/atlas/${row.slug}` : null;
}

/**
 * Once at least one city has a page, a row without one says so. While none do,
 * the one line above says it for all twenty-three, rather than each row.
 */
export function noCityPageNote(row: AtlasRow, rows: AtlasRow[]): string | null {
  return anyCityPage(rows) && !row.hasCityPage ? "no city page yet" : null;
}
