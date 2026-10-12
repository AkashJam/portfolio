import type { AtlasRow, Sourced, WindowChange, WindowStart } from "@/lib/market-schemas";

// Pure helpers for the /atlas countries table (Phase 11 step 1). Kept out of
// the "use client" component so the server page and the unit tests get the
// real functions (see the note at the top of lib/format.ts).

export const MINUS = "−";

export type ChangeKey = "shares" | "housing" | "prices" | "currency";
export type LevelKey = "everydaySpendingEur" | "gniPpp" | "unemployment" | "lifeExpectancy";
export type ColumnKey = ChangeKey | LevelKey;

export type SortDir = "asc" | "desc";

/** The value a column sorts on for one row; null when the cell has no figure. */
export function columnValue(row: AtlasRow, key: ColumnKey, window: WindowStart): number | null {
  switch (key) {
    case "shares":
    case "housing":
    case "prices":
    case "currency":
      return row[key].change?.[window] ?? null;
    default:
      return row[key].value;
  }
}

/**
 * Sorts by one column. Rows with no figure go last in both directions: a gap
 * is not a smallest or a largest value, so it must not lead a sorted column.
 * Ties keep the order the API served them in (Array.prototype.sort is stable).
 */
export function sortRows(rows: AtlasRow[], key: ColumnKey, dir: SortDir, window: WindowStart): AtlasRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = columnValue(a, key, window);
    const bv = columnValue(b, key, window);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return (av - bv) * sign;
  });
}

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "+364%", "−26%", "0%": a change is read for its sign, so the sign is always shown. */
export function formatChange(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : MINUS}${wholeNumber.format(Math.abs(rounded))}%`;
}

export function formatEur(value: number): string {
  return `€${wholeNumber.format(value)}`;
}

export function formatUsd(value: number): string {
  return `$${wholeNumber.format(value)}`;
}

export function formatPercent(value: number): string {
  return `${oneDecimal.format(value)}%`;
}

export function formatYears(value: number): string {
  return oneDecimal.format(value);
}

/** The text a gap shows beside its dash, from the reason the API gave. */
export function gapLabel(reason: string | undefined, window: WindowStart): string {
  if (reason === "unpublished") return `no ${window} rate`;
  return reason ?? "";
}

/** "OECD via FRED · as of 2024" — the title and screen-reader text on every value. */
export function provenance(m: Pick<WindowChange | Sourced, "source" | "asOf">): string {
  return `${m.source} · as of ${m.asOf}`;
}
