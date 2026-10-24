/**
 * The Market indicator's states (portfolio.md §15 Phase 14 step 6; bearing.md
 * #94, #104). Pure, so the rules are testable without a browser.
 *
 * Three states are still derived (the page's session and live questions read them),
 * but only one is shown (phase19.md step 3, I12; it supersedes bearing.md #94 and
 * #104's three-state dot):
 * - **tripped** — the last close tripped something: a sensor moved further than it
 *   normally does, and the ticker's newest event is from its newest session. It
 *   clears itself after the next close that trips nothing (Phase 15 step 7). The
 *   only state the Market dot and the drawer draw; `trips` is how many.
 * - **quiet** — nothing has. Drawn as nothing at all.
 * - **unreachable** — the feed cannot be vouched for. Not drawn in the bar: the
 *   Market page says so itself, and a dot that looked the same when the feed is
 *   dead would still not claim a trip.
 *
 * "Live" is not a fourth state: it qualifies quiet or tripped, and only while
 * ticks are flowing and the regular session is open, that is, in US hours.
 *
 * The session is a separate question from the feed (Phase 14 step 7): the feed
 * can keep carrying extended-hours trades after the close, but the page is closed
 * when the regular session is, and counts down to `opensAt`.
 */

/** The ticker's `GET /market/state`, plus `unreachable`: the probe itself failed. */
export type Feed = "live" | "closed" | "stale" | "down" | "unreachable";

export type MarketStateName = "tripped" | "quiet" | "unreachable";

/** `unknown` when the ticker could not be asked: the page never claims closed on a guess. */
export type Session = "open" | "closed" | "unknown";

export interface MarketState {
  state: MarketStateName;
  /** How many events the last close recorded; 0 unless tripped, and at least 1 when it is. */
  trips: number;
  /** Ticks are flowing now and the session is open. Never true when unreachable. */
  live: boolean;
  session: Session;
  /** The next open, while the session is closed. */
  opensAt: string | null;
}

const FEEDS: readonly string[] = ["live", "closed", "stale", "down", "unreachable"];

/** Anything the route sends that is not a known feed reads as unreachable. */
export function toFeed(value: unknown): Feed {
  return typeof value === "string" && FEEDS.includes(value) ? (value as Feed) : "unreachable";
}

export function toSession(value: unknown): Session {
  return value === "open" || value === "closed" ? value : "unknown";
}

/**
 * Unreachable outranks tripped: a feed that cannot be vouched for does not get to
 * claim a trip, and does not get to claim the session is closed either. A closed
 * session is not unreachable, it is quiet and not live.
 */
export function deriveMarketState({
  feed,
  tripped,
  trips = 0,
  session = "open",
  opensAt = null,
}: {
  feed: Feed;
  tripped: boolean;
  trips?: number;
  session?: Session;
  opensAt?: string | null;
}): MarketState {
  if (feed === "stale" || feed === "down" || feed === "unreachable") {
    return { state: "unreachable", trips: 0, live: false, session: "unknown", opensAt: null };
  }
  return {
    state: tripped ? "tripped" : "quiet",
    // A ticker that predates the count says tripped and no number: that is one.
    trips: tripped ? Math.max(trips, 1) : 0,
    live: feed === "live" && session === "open",
    session,
    opensAt: session === "closed" ? opensAt : null,
  };
}

/** The dot's name, for the hover and for a screen reader (I12). */
export const TRIP_DOT_LABEL = "An unusual move at the last close";

/** What the drawer's Market row says after a trip: "1 unusual move", "3 unusual moves". */
export function tripsLabel(trips: number): string {
  return `${trips} unusual ${trips === 1 ? "move" : "moves"}`;
}
