/**
 * The Prices table's rules, pure so they are testable without a browser
 * (portfolio.md §15 Phase 14 step 3).
 *
 * A price's vintage is its `asOf`. A daily bar is dated to its session at
 * 00:00:00 UTC ("a close"); a live trade carries its real time. Nothing else
 * in this system is stamped at exactly midnight UTC during trading hours, so
 * the two are told apart by that, and a close is shown as a date, a trade as
 * a time in New York (where the sensors trade).
 */

export interface PriceRow {
  symbol: string;
  price: number;
  /** Zero when there is no prior daily bar, which the Change cell shows as a dash. */
  prevClose: number;
  change: number;
  changePercent: number;
  /** Null when the ticker has neither a quote nor a bar. */
  asOf: string | null;
}

const NY = "America/New_York";
// An explicit locale, not the runtime's: the server and the browser would
// otherwise format the same instant differently and the page would not hydrate.
const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone: NY, hour: "2-digit", minute: "2-digit", hour12: false });
const nyDay = new Intl.DateTimeFormat("en-CA", { timeZone: NY, year: "numeric", month: "2-digit", day: "2-digit" });
const closeDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const closeShort = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const tradeShort = new Intl.DateTimeFormat("en-GB", { timeZone: NY, day: "numeric", month: "short" });

const MINUS = "−";

/** A daily bar's `asOf`: midnight UTC on the session date. */
export function isClose(iso: string): boolean {
  const d = new Date(iso);
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
}

/** The calendar day a vintage belongs to: a close's session date, a trade's New York date. */
export function dayKey(iso: string): string {
  return isClose(iso) ? iso.slice(0, 10) : nyDay.format(new Date(iso));
}

/** Applies a live quote: the price, the change against yesterday's close, and the new vintage. */
export function applyQuote(row: PriceRow, quote: { price: number; time: string }): PriceRow {
  const change = quote.price - row.prevClose;
  return {
    ...row,
    price: quote.price,
    change,
    changePercent: row.prevClose !== 0 ? (change / row.prevClose) * 100 : 0,
    asOf: quote.time,
  };
}

/** `+0.48%` · `−4.83%` · `0.00%`; a dash when there is no price or nothing to compare it with. */
export function changeLabel(row: PriceRow): string {
  if (row.asOf === null || row.prevClose === 0) return "—";
  const pct = row.changePercent;
  if (Math.abs(pct) < 0.005) return "0.00%";
  return `${pct > 0 ? "+" : MINUS}${Math.abs(pct).toFixed(2)}%`;
}

export function changeDirection(row: PriceRow): "up" | "down" | "flat" {
  if (row.asOf === null || row.prevClose === 0 || Math.abs(row.changePercent) < 0.005) return "flat";
  return row.changePercent > 0 ? "up" : "down";
}

/**
 * The one line above the table that says how old the prices are. It reads the
 * newest vintage among the rows, so it is true for every state: a live trade,
 * a quiet afternoon, a closed market.
 */
export function pricesVintage(asOfs: (string | null)[], now: Date, sawLiveQuote: boolean): string {
  let newest: string | null = null;
  let newestMs = -Infinity;
  for (const v of asOfs) {
    const ms = v ? Date.parse(v) : NaN;
    if (!Number.isNaN(ms) && ms > newestMs) {
      newest = v;
      newestMs = ms;
    }
  }
  if (newest === null) return "No prices yet";

  const d = new Date(newest);
  if (isClose(newest)) return `Last close, ${closeDate.format(d)}`;
  const time = `${timeFormat.format(d)} ET`;
  if (sawLiveQuote) return `Live · last trade ${time}`;
  return nyDay.format(d) === nyDay.format(now)
    ? `Latest trade ${time}`
    : `Last trade ${tradeShort.format(d)}, ${time}`;
}

/**
 * A row's own date, shown inline only when it is not the table's: a sensor
 * whose last print is older than the rest should say so rather than sit among
 * them looking current.
 */
export function rowVintage(asOf: string | null, tableAsOf: string | null): string | null {
  if (asOf === null || tableAsOf === null) return null;
  if (dayKey(asOf) === dayKey(tableAsOf)) return null;
  return isClose(asOf) ? closeShort.format(new Date(asOf)) : tradeShort.format(new Date(asOf));
}

/** The newest vintage, for `rowVintage` to compare against. */
export function newestVintage(asOfs: (string | null)[]): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const v of asOfs) {
    const ms = v ? Date.parse(v) : NaN;
    if (!Number.isNaN(ms) && ms > bestMs) {
      best = v;
      bestMs = ms;
    }
  }
  return best;
}

/** `thin listing, $13M a day (9 Oct 2026)`. */
export function thinListing(usdM: number, asOf: string): string {
  return `thin listing, $${usdM}M a day (${closeDate.format(new Date(asOf))})`;
}
