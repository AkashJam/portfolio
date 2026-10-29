import type { CoverageOutlet, CoverageSource, LedgerEvent, Side, Split } from "@/lib/market-schemas";
import { dayMonth } from "@/lib/dates";

/**
 * The ledger's rules, pure so they are testable without a browser (portfolio.md
 * §15 Phase 15 step 7). Everything here is a reading of what the ticker stored:
 * the ledger states its provenance and never recomputes a figure.
 */

const NY = "America/New_York";
const MINUS = "−";

// An explicit locale, not the runtime's: the server and the browser would
// otherwise format the same instant differently and the page would not hydrate.
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: NY, hour: "2-digit", minute: "2-digit", hour12: false });
const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" });

/** `HH:mm` in New York, the zone the sensors trade in and the close is read in. */
export function etClock(iso: string): string {
  return clock.format(new Date(iso));
}

/** `6 Oct` for a session date (`2026-10-06`), which is a calendar day, not an instant. */
export function sessionShort(date: string): string {
  return dayMonth(date);
}

/** `Wednesday` for a session date. */
export function sessionWeekday(date: string): string {
  return weekday.format(new Date(`${date}T00:00:00Z`));
}

/** A stored reason, which the ticker writes in lower case, as the start of a sentence. */
export function sentence(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** A signed percent with a true minus sign: `−4.83%`. */
export function signedPercent(value: number, places = 2): string {
  const abs = Math.abs(value).toFixed(places);
  if (Number(abs) === 0) return `${abs}%`;
  return `${value < 0 ? MINUS : "+"}${abs}%`;
}

/** A signed price change: `−0.58`. */
export function signedChange(value: number): string {
  const abs = Math.abs(value).toFixed(2);
  if (Number(abs) === 0) return abs;
  return `${value < 0 ? MINUS : "+"}${abs}`;
}

/** A z as the page writes it: `−3.1σ`, one decimal, a true minus. */
export function sigmaLabel(z: number, places = 1): string {
  const abs = Math.abs(z).toFixed(places);
  if (Number(abs) === 0) return `${abs}σ`;
  return `${z < 0 ? MINUS : "+"}${abs}σ`;
}

/** The unsigned z in a split line: `2.6σ`. */
export function sigmaMagnitude(z: number): string {
  return `${Math.abs(z).toFixed(1)}σ`;
}

export type Direction = "up" | "down";

/** The side of its band a close left: the sign of the residual z. */
export function breakoutDirection(event: LedgerEvent): Direction {
  return event.trigger.z < 0 ? "down" : "up";
}

/** `at the last close`, `one session ago`, `11 sessions ago`. */
export function sessionsAgoLabel(n: number): string {
  if (n <= 0) return "at the last close";
  if (n === 1) return "one session ago";
  return `${n} sessions ago`;
}

/** The entry's heading: its country, or a global name's theme. */
export function entryHeading(event: LedgerEvent): string {
  return event.country?.name ?? event.theme ?? event.name;
}

/** The sensor's record page: its country's slug, or a global name's symbol (Phase 16 step 2). */
export function recordHref(event: LedgerEvent): string {
  return `/market/${event.country?.slug ?? event.symbol}`;
}

/** `Japan's full record` or `NVDA's full record`. */
export function recordLinkText(event: LedgerEvent): string {
  return `${event.country?.name ?? event.symbol}'s full record`;
}

/** `as seen through MUFG · Mitsubishi UFJ · 6 Oct, at the close`. */
export function entryVia(event: LedgerEvent): string {
  const through = event.country ? "as seen through" : "through";
  return `${through} ${event.symbol} · ${event.name} · ${sessionShort(event.sessionDate)}, at the close`;
}

/** `−3.1σ against its sector.` or, with no benchmark, `against its own history.` */
export function contextLine(event: LedgerEvent): string {
  const z = sigmaLabel(event.trigger.z);
  return event.trigger.benchmark
    ? `${z} against its sector (${event.trigger.benchmark}).`
    : `${z} against its own history: it has no sector fund to measure against.`;
}

/** What the band chart's caption says for the side the line left on. */
export function bandCaption(event: LedgerEvent): string {
  const dir = breakoutDirection(event);
  const sigma = event.trigger.sigma * 100;
  const side = dir === "down" ? "below" : "above";
  return (
    `The shaded band is where this normally trades given what its sector did that day, so it drifts rather ` +
    `than sitting flat. The line left it ${side} on ${sessionWeekday(event.sessionDate)}, which is what fetched the ` +
    `news below. The band is ±${event.trigger.threshold}σ of the residual over ${event.trigger.window} sessions ` +
    `(σ = ${sigma.toFixed(2)}%).`
  );
}

// --- the currency split ---

const NO_SPLIT: Record<string, string> = {
  no_home_currency: "A global name has no home currency, so its move is not split.",
  no_ecb_currency: "The ECB publishes no daily rate for this country's currency, so the move is not split.",
  monthly_only: "Only a monthly figure exists for this currency, which is too coarse to split one session.",
  ecb_not_published: "The ECB had not published a rate for this session, so the move is not split.",
  insufficient_history: "There is not yet enough history of the currency to test it, so the move is not split.",
  zero_sigma: "The currency did not move over the window, so there is nothing to test it against.",
};

export function noSplitText(reason: string | undefined): string {
  return (reason && NO_SPLIT[reason]) || "The move is not split by currency.";
}

const ROUTED: Record<string, string> = {
  "currency-led": "The currency led, so the central bank and an economy query were asked.",
  "stock-led": "The currency was quiet, so the move is the company's: the filings and a sector query were asked, not an economy query.",
  both: "Both parts passed on their own, so the central bank, an economy query, the filings and a sector query were all asked.",
  neither: "Neither part passed alone, so the central bank, an economy query, the filings and a sector query were all asked.",
};

export function routedText(label: string | undefined): string {
  return (label && ROUTED[label]) || "";
}

export interface SplitView {
  label: string | null;
  currency: string;
  currencyLine: string;
  stockLine: string;
  note: string;
  fix: string;
}

/** The split block's words, or null when the event has none (see `noSplitText`). */
export function splitView(event: LedgerEvent): SplitView | null {
  const s: Split | null = event.split;
  if (!s || s.status !== "ok" || !s.currencyPart || !s.stockPart || !s.label) return null;
  return {
    label: s.label,
    currency: s.currency ?? "",
    currencyLine: `${s.currency ?? "currency"} against the dollar ${signedPercent(s.currencyPart.value * 100, 1)} (${sigmaMagnitude(s.currencyPart.z)})`,
    stockLine: `${event.symbol} net of its sector and its currency ${signedPercent(s.stockPart.value * 100, 1)} (${sigmaMagnitude(s.stockPart.z)})`,
    note: `${routedText(s.label)} Each part is tested at ${s.threshold ?? 2}σ against its own ${s.window ?? 60} sessions.`,
    fix: "Split at the ECB fix, about 16:00 CET: the currency's last six hours before this close are not in it.",
  };
}

// --- the coverage ---

export const SOURCE_ORDER = ["centralBank", "economyNews", "sectorNews", "topicNews", "filings"] as const;

export const SOURCE_LABEL: Record<string, string> = {
  centralBank: "Central bank",
  economyNews: "Economy news",
  sectorNews: "Sector news",
  topicNews: "Topic news",
  filings: "Company filing",
};

export interface OutletChip {
  name: string;
  time: string;
}

/** An outlet's earliest headline on a side, which is what orders and labels its chip. */
function earliestOn(outlet: CoverageOutlet, side: Side): string | null {
  const times = outlet.items.filter((i) => i.side === side).map((i) => i.publishedAt);
  return times.length === 0 ? null : times.reduce((a, b) => (a < b ? a : b));
}

/** The outlets that have a headline on a side, earliest first, each with that headline's New York time. */
export function chipsFor(source: CoverageSource, side: Side): OutletChip[] {
  const chips: { name: string; at: string }[] = [];
  for (const o of source.outlets ?? []) {
    const at = earliestOn(o, side);
    if (at !== null) chips.push({ name: o.name, at });
  }
  chips.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.name.localeCompare(b.name)));
  return chips.map((c) => ({ name: c.name, time: etClock(c.at) }));
}

/** `14 outlets`, `1 outlet`. */
export function outletCount(source: CoverageSource): number {
  return source.outlets?.length ?? 0;
}

/** What the coverage left out, in a sentence, or null when it left nothing out. */
export function leftOut(source: CoverageSource): string | null {
  const parts: string[] = [];
  if (source.excluded) parts.push(`${source.excluded} from outlets that generate pages from price or filing data`);
  if (source.nonEnglish) parts.push(`${source.nonEnglish} not in English`);
  if (source.undated) parts.push(`${source.undated} with no time`);
  return parts.length === 0 ? null : `Left out of the ${source.total ?? 0} headlines the search returned: ${parts.join(", ")}.`;
}

/** The sources an event holds, in the page's order. */
export function sourcesOf(event: LedgerEvent): { key: string; source: CoverageSource }[] {
  const sources = event.coverage?.sources ?? {};
  return SOURCE_ORDER.filter((k) => sources[k] !== undefined).map((key) => ({ key, source: sources[key] }));
}

// --- the ex-dividend caveat (bearing.md #112) ---

/** `$1.249`, or `1.249 CAD` for another currency, with no trailing zeros past the cents. */
function perShare(amount: number, currency: string | undefined): string {
  const n = String(Number(amount.toFixed(3)));
  const text = n.includes(".") && n.split(".")[1].length < 2 ? `${n}0` : n;
  return !currency || currency === "USD" ? `$${text}` : `${text} ${currency}`;
}

/**
 * The caveat line for the dividend source, or null when there is nothing to say.
 * On an ex-date the raw close falls by about the dividend, so a trip that session
 * can be partly that, and z is not corrected for it. An empty answer prints
 * nothing (no ex-date is the ordinary case); a failed lookup says it is unknown,
 * so a missing caveat is never mistaken for a negative one.
 */
export function dividendLine(event: LedgerEvent): string | null {
  const s = event.coverage?.sources.dividend;
  if (!s) return null;
  if (s.status === "ok" && s.dividend) {
    const prev = event.price?.prevClose;
    const share = prev && prev > 0 ? `, about ${((s.dividend.amount / prev) * 100).toFixed(1)}% of the previous close` : "";
    return `Ex-dividend session · ${perShare(s.dividend.amount, s.dividend.currency)} a share went ex on ${sessionShort(s.dividend.date)}${share}. The close falls by about the dividend on its ex-date, so part of this move can be the dividend; the figure above is not corrected for it.`;
  }
  if (s.status === "error") {
    return s.attempts >= 3
      ? "Whether this was an ex-dividend session could not be checked, so a dividend may be part of this move."
      : "Whether this was an ex-dividend session has not been checked yet; it is tried again after the next close.";
  }
  return null;
}

// --- the head of the ledger ---

export type HeadKind = "tripped" | "quiet" | "empty";

export interface Head {
  kind: HeadKind;
  /** The sentence in plain words. */
  text: string;
  /** The entry it points at (`#japan-2026-10-15`), or null with no entry to point at. */
  href: string | null;
}

/**
 * The sentence in /market's state row (market.html): what the last close did and,
 * when it did nothing, the last time it did. A move at the last close is named;
 * anything older reads quiet and says how long ago, because a record does not
 * refresh. Plain words only (I38): no "tripped", no "band", no "threshold".
 */
export function headLine(events: LedgerEvent[]): Head {
  if (events.length === 0) return { kind: "empty", text: "Nothing unusual yet", href: null };
  if (events[0].sessionsAgo === 0) {
    const names = events.filter((e) => e.sessionsAgo === 0).map(entryHeading);
    const subject = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    return { kind: "tripped", text: `${subject} moved unusually at the last close`, href: `#${events[0].id}` };
  }
  return {
    kind: "quiet",
    text: `Nothing unusual at the last close · last unusual move: ${entryHeading(events[0])}, ${sessionsAgoLabel(events[0].sessionsAgo)}`,
    href: `#${events[0].id}`,
  };
}
