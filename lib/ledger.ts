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

const nyDay = new Intl.DateTimeFormat("en-GB", { timeZone: NY, day: "numeric", month: "short" });

/** `20 Oct, 17:26 ET`: a headline's own day and time, in New York. */
export function etDateClock(iso: string): string {
  const d = new Date(iso);
  return `${nyDay.format(d)}, ${clock.format(d)} ET`;
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

/** `through Mitsubishi UFJ (MUFG) · 6 Oct, at the close`. */
export function entryThrough(event: LedgerEvent): string {
  return `through ${event.name} (${event.symbol}) · ${sessionShort(event.sessionDate)}, at the close`;
}

/** The sector funds a move is measured against, in the plain words the page uses (I38). */
export const SECTOR_WORDS: Record<string, string> = {
  IXN: "global technology companies",
  IXP: "global telecom companies",
  RXI: "global consumer discretionary companies",
  IXG: "global banks and financial companies",
  IXJ: "global health care companies",
  IXC: "global energy companies",
  KXI: "global consumer staples companies",
  EXI: "global industrial companies",
  MXI: "global materials companies",
  JXI: "global utilities",
};

/** `global telecom companies (IXP)`; the symbol alone for a fund the table does not know. */
export function sectorName(symbol: string, withSymbol = false): string {
  const words = SECTOR_WORDS[symbol];
  return words ? (withSymbol ? `${words} (${symbol})` : words) : symbol;
}

/** `Unusual move` from the trigger's 2.5σ, `Extremely unusual move` from 5σ (I38). */
export function badgeWord(z: number): string {
  return Math.abs(z) >= 5 ? "Extremely unusual move" : "Unusual move";
}

const verb = (v: number) => (v < 0 ? "fell" : "rose");
const oneDecimal = (v: number) => `${Math.abs(v).toFixed(1)}%`;

/**
 * The entry's sentence (I37), which asserts only what the code computed (bearing
 * #87): the company's move, the sector's, and how many times further than usual
 * the gap was, which is the residual z to one decimal. Null with no price to state.
 */
export function ledgerSentence(event: LedgerEvent): string | null {
  if (!event.price) return null;
  const { trigger } = event;
  const own = `${event.name} ${verb(event.price.changePercent)} ${oneDecimal(event.price.changePercent)} on ${sessionShort(event.sessionDate)}`;
  const times = `about ${Math.abs(trigger.z).toFixed(1)} times further than it usually moves`;
  const tail = "so the news from that day was fetched.";
  if (trigger.benchmark === null || trigger.benchmarkReturn === null) return `${own}, ${times}, ${tail}`;
  const pct = trigger.benchmarkReturn * 100;
  return `${own} while ${sectorName(trigger.benchmark)} ${verb(pct)} ${oneDecimal(pct)}, ${times} against them, ${tail}`;
}

/** What the chart's caption says for the side the line left on. */
export function bandCaption(event: LedgerEvent): string {
  const side = breakoutDirection(event) === "down" ? "below" : "above";
  return `The shaded area is the normal range given what its sector did each day; the line left it ${side} on ${sessionWeekday(event.sessionDate)}.`;
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

/** A currency in the words a reader uses; any other falls back to its code. */
const CURRENCY_WORD: Record<string, string> = {
  BRL: "real", CAD: "Canadian dollar", CLP: "peso", COP: "peso", GBP: "pound", IDR: "rupiah", INR: "rupee",
  JPY: "yen", KRW: "won", MXN: "peso", PEN: "sol", TRY: "lira", EUR: "euro",
};

/**
 * What moved, in words (I47): the stock, the currency, both or neither. Null with
 * no split to read; `noSplitText` then says why.
 */
export function splitVerdict(event: LedgerEvent): string | null {
  const s: Split | null = event.split;
  if (!s || s.status !== "ok" || !s.currencyPart || !s.stockPart || !s.label) return null;
  const word = CURRENCY_WORD[s.currency ?? ""] ?? s.currency ?? "currency";
  const the = `the ${word}`;
  const pct = s.currencyPart.value * 100;
  const move = `${the} ${verb(pct)} ${oneDecimal(pct)}`;
  switch (s.label) {
    case "stock-led":
      return `The stock moved; the currency was quiet (${move}).`;
    case "currency-led":
      return `Mostly the currency (${move}).`;
    case "both":
      return `Both moved: the stock and the currency each passed on their own (${move}).`;
    default:
      return "Both moved a little; neither explains it alone.";
  }
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
  if (source.noSubject) parts.push(`${source.noSubject} that do not name their subject`);
  if (source.nonEnglish) parts.push(`${source.nonEnglish} not in English`);
  if (source.undated) parts.push(`${source.undated} with no time`);
  if (source.duplicates) parts.push(`${source.duplicates} repeated`);
  return parts.length === 0 ? null : `Left out of the ${source.total ?? 0} headlines the search returned: ${parts.join(", ")}.`;
}

/** The sources an event holds, in the page's order. */
export function sourcesOf(event: LedgerEvent): { key: string; source: CoverageSource }[] {
  const sources = event.coverage?.sources ?? {};
  return SOURCE_ORDER.filter((k) => sources[k] !== undefined).map((key) => ({ key, source: sources[key] }));
}

// --- the news, as one list (I46) ---

export const NEWS_SOURCES = ["economyNews", "sectorNews", "topicNews"] as const;

export interface NewsItem {
  title: string;
  link: string;
  publishedAt: string;
  side: Side;
  outlet: string;
}

/** Every headline of the event's news sources, once each, earliest first. */
export function newsItems(event: LedgerEvent): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const key of NEWS_SOURCES) {
    for (const o of event.coverage?.sources[key]?.outlets ?? []) {
      for (const i of o.items) {
        if (seen.has(i.link)) continue;
        seen.add(i.link);
        out.push({ title: i.title, link: i.link, publishedAt: i.publishedAt, side: i.side, outlet: o.name });
      }
    }
  }
  return out.sort((a, b) => (a.publishedAt < b.publishedAt ? -1 : a.publishedAt > b.publishedAt ? 1 : a.outlet.localeCompare(b.outlet)));
}

/** The first `shown` headlines from distinct outlets, earliest first, and the rest. */
export function topNews(items: NewsItem[], shown = 3): { top: NewsItem[]; rest: NewsItem[] } {
  const top: NewsItem[] = [];
  const outlets = new Set<string>();
  for (const i of items) {
    if (top.length === shown) break;
    if (outlets.has(i.outlet)) continue;
    outlets.add(i.outlet);
    top.push(i);
  }
  const used = new Set(top.map((i) => i.link));
  return { top, rest: items.filter((i) => !used.has(i.link)) };
}

/** `+7 more, from 7 outlets`. */
export function moreLabel(rest: NewsItem[]): string {
  const outlets = new Set(rest.map((i) => i.outlet)).size;
  return `+${rest.length} more, from ${outlets} ${outlets === 1 ? "outlet" : "outlets"}`;
}

/** Why a news source holds nothing, one line each, so a quiet list is never mistaken for a missing one. */
export function newsAbsences(event: LedgerEvent): string[] {
  const lines: string[] = [];
  for (const key of NEWS_SOURCES) {
    const s = event.coverage?.sources[key];
    if (!s || s.status === "ok") continue;
    lines.push(s.status === "error" ? `${SOURCE_LABEL[key]} could not be read${s.attempts > 1 ? ` after ${s.attempts} attempts` : ""}.` : `${SOURCE_LABEL[key]}: ${sentence(s.absent?.reason ?? "nothing was found")}.`);
  }
  return lines;
}

// --- how this is calculated (M15, I49) ---

/** `+4.7σ against global telecom companies (IXP): ...` or the no-benchmark form. */
export function sigmaLine(event: LedgerEvent): string {
  const t = event.trigger;
  const sigma = `σ = ${(t.sigma * 100).toFixed(2)}%`;
  const rule = `the close sat outside ±${t.threshold}σ of the residual over the last ${t.window} trading days (${sigma})`;
  return t.benchmark
    ? `${sigmaLabel(t.z)} against ${sectorName(t.benchmark, true)}: ${rule}.`
    : `${sigmaLabel(t.z)} against its own history, since it has no sector fund to measure against: ${rule}.`;
}

/** Everything the page leaves out of the entry's face, in the words the owner agreed. */
export function methodLines(event: LedgerEvent): string[] {
  const lines = [sigmaLine(event)];
  lines.push(
    event.theme === null
      ? "Priced in US dollars on the NYSE; the country's own market had closed hours before this print."
      : "A global name: its move is about the world rather than about America, and it has no home currency.",
  );
  const s = event.split;
  if (s && s.status === "ok" && s.currencyPart && s.stockPart) {
    lines.push(
      `The currency part (${s.currency ?? "the currency"} against the dollar ${signedPercent(s.currencyPart.value * 100, 1)}, ${sigmaMagnitude(s.currencyPart.z)}) and the company's part net of its sector and its currency (${signedPercent(s.stockPart.value * 100, 1)}, ${sigmaMagnitude(s.stockPart.z)}) are each tested at ${s.threshold ?? 2}σ against their own ${s.window ?? 60} sessions. The currency is read at the European Central Bank's daily exchange rate (about 16:00 CET), so its last six hours before the close are not in it.`,
    );
  } else if (s && s.status !== "ok" && s.reason) {
    lines.push(noSplitText(s.reason));
  }
  const sources = event.coverage?.sources ?? {};
  const news = NEWS_SOURCES.map((k) => sources[k]).filter((x): x is CoverageSource => !!x && !!x.query);
  if (news.length > 0) {
    const total = news.reduce((n, x) => n + (x.total ?? 0), 0);
    const left = news.map(leftOut).filter((t): t is string => t !== null);
    lines.push(
      `Searched: ${news.map((x) => x.query).join("; ")}. The economy query is asked on every country move. ${total} headlines came back. ${left.join(" ")}`.trim(),
    );
  }
  const bank = sources.centralBank;
  if (bank?.status === "empty") lines.push(`Central bank: ${sentence(bank.absent?.reason ?? "no release was found")}.`);
  const filings = sources.filings;
  if (filings?.status === "empty") {
    lines.push(`No company announcement was filed with the US regulator in the window${filings.query ? ` (${filings.query.replace(/, form .*/, "")})` : ""}.`);
  }
  lines.push("Every outlet is listed, never one headline: the query returns many outlets for one story, and choosing one would be ranking. Each item's own time decides whether it came before or after the close.");
  lines.push("Links go via Google News. " + (event.coverage?.complete ? "Fetched at the close and once more after the next close." : "Fetched at the close; fetched once more after the next close, to add what was published after this move."));
  return lines;
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
