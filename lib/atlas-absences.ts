import type { AtlasRow } from "@/lib/market-schemas";

// What the countries table says about city pages (Phase 11 step 9, bearing.md
// #101; Phase 22 I59): once, with the count taken from the rows. Nothing here
// promises a later release: a promise on the page goes stale if the work slips.

/** "17 of 23 countries have a city page.": said once above the table, counted from the rows (I59). */
export function cityCountLine(rows: AtlasRow[]): string {
  const n = rows.filter((r) => r.hasCityPage).length;
  return `${n} of ${rows.length} countries have a city page.`;
}

/** A city's page address, only where the page exists (`hasCityPage` means it exists, not that one is planned). */
export function cityHref(row: AtlasRow): string | null {
  return row.hasCityPage ? `/atlas/${row.slug}` : null;
}
