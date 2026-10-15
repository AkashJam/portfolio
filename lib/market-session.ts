import { deriveMarketState, toFeed, toSession, type MarketState } from "@/lib/market-state";
import { dayKey } from "@/lib/prices";

/**
 * The closed state's rules (portfolio.md §15 Phase 14 step 7), pure so they are
 * testable without a browser, and shared by `/market` now and by the symbol page
 * (step 8) and the home band (step 9) after it.
 *
 * "Closed" is the regular session, not feed silence: US hours are 15:30-22:00 CET,
 * and a closed page freezes at the close and counts down to the next open.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** How long until `opensAt`: `2d 17h` · `4h 12m` · `12m` · `under a minute` · `now`. */
export function countdown(opensAt: string, now: Date): string {
  const ms = Date.parse(opensAt) - now.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "now";
  if (ms < MIN) return "under a minute";
  if (ms < HOUR) return `${Math.floor(ms / MIN)}m`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h ${Math.floor((ms % HOUR) / MIN)}m`;
  return `${Math.floor(ms / DAY)}d ${Math.floor((ms % DAY) / HOUR)}h`;
}

/** `opens in 4h 12m` · `opens in under a minute` · `opening now`. */
export function opensIn(opensAt: string, now: Date): string {
  const c = countdown(opensAt, now);
  return c === "now" ? "opening now" : `opens in ${c}`;
}

const sessionDay = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

/** `6 Oct`: the day of the newest price, a session's close or a trade's New York day. */
export function lastSessionLabel(newestAsOf: string | null): string | null {
  if (newestAsOf === null || Number.isNaN(Date.parse(newestAsOf))) return null;
  return sessionDay.format(new Date(`${dayKey(newestAsOf)}T00:00:00Z`));
}

/** The as-of line while closed: the frozen vintage, and when it opens. */
export function frozenLine(vintage: string, opensAt: string | null, now: Date): string {
  return ["Frozen", vintage, opensAt ? opensIn(opensAt, now) : null].filter(Boolean).join(" · ");
}

export type StateTone = "open" | "closed" | "unreachable";

export interface StateLine {
  tone: StateTone;
  /** The bold lead: `Closed.` */
  word: string;
  /** What follows it. */
  facts: string;
}

/**
 * The line under the page's intro. Closed, as the mock draws it, says when it
 * opens and the last session, and no trip clause until Phase 15 can fire one. The
 * page never says closed when it does not know: an unknown session reads as open
 * only if the feed is reachable, and as unreachable when it is not.
 */
export function stateLine(state: MarketState, now: Date, newestAsOf: string | null): StateLine {
  if (state.state === "unreachable") {
    return { tone: "unreachable", word: "Unreachable.", facts: "The feed is not answering." };
  }
  if (state.session === "closed") {
    const last = lastSessionLabel(newestAsOf);
    const when = state.opensAt ? opensIn(state.opensAt, now) : null;
    const facts = [when ? when[0].toUpperCase() + when.slice(1) : null, last ? `last session ${last}` : null]
      .filter(Boolean)
      .join(" · ");
    return { tone: "closed", word: "Closed.", facts };
  }
  return { tone: "open", word: "Open.", facts: "Live while New York trades." };
}

/**
 * The server's own answer from `GET /market/state`, as the first paint's state, so
 * a closed market does not flash its open treatment before the shell's poll lands.
 */
export function seedFromResponse(
  res: { feed: string; session?: string; opensAt?: string | null } | null,
): MarketState {
  if (res === null) return deriveMarketState({ feed: "unreachable", tripped: false });
  return deriveMarketState({
    feed: toFeed(res.feed),
    tripped: false, // Phase 15 reads GET /market/events
    session: toSession(res.session),
    opensAt: typeof res.opensAt === "string" ? res.opensAt : null,
  });
}
