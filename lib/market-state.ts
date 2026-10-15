/**
 * The Market indicator's states (portfolio.md §15 Phase 14 step 6; bearing.md
 * #94, #104). Pure, so the rules are testable without a browser.
 *
 * Three states, and only three:
 * - **tripped** — a sensor moved further than it normally does. Built here, but
 *   it cannot occur until Phase 15 switches the trigger on.
 * - **quiet** — nothing has. A hollow ring, never an absent mark: absence is
 *   indistinguishable from a styling bug.
 * - **unreachable** — the feed cannot be vouched for. A dot that looked the same
 *   when the feed is dead would be a lie of exactly the kind §15 forbids.
 *
 * "Live" is not a fourth state: it qualifies quiet or tripped, and only while
 * ticks are flowing, that is, in US hours.
 */

/** The ticker's `GET /market/state`, plus `unreachable`: the probe itself failed. */
export type Feed = "live" | "closed" | "stale" | "down" | "unreachable";

export type MarketStateName = "tripped" | "quiet" | "unreachable";

export interface MarketState {
  state: MarketStateName;
  /** Ticks are flowing now. Never true when unreachable. */
  live: boolean;
}

const FEEDS: readonly string[] = ["live", "closed", "stale", "down", "unreachable"];

/** Anything the route sends that is not a known feed reads as unreachable. */
export function toFeed(value: unknown): Feed {
  return typeof value === "string" && FEEDS.includes(value) ? (value as Feed) : "unreachable";
}

/**
 * Unreachable outranks tripped: a feed that cannot be vouched for does not get to
 * claim a trip. A closed market is not unreachable, it is quiet and not live.
 */
export function deriveMarketState({ feed, tripped }: { feed: Feed; tripped: boolean }): MarketState {
  if (feed === "stale" || feed === "down" || feed === "unreachable") return { state: "unreachable", live: false };
  return { state: tripped ? "tripped" : "quiet", live: feed === "live" };
}

/** What the drawer's Market row says: the state word, plus `live` only while ticks flow. */
export function stateLabel({ state, live }: MarketState): string {
  const word = state === "tripped" ? "a sensor tripped" : state;
  return live ? `${word} · live` : word;
}

/** The same as a spoken label for the dot on the tab. */
export function stateAriaLabel(s: MarketState): string {
  return stateLabel(s).replace(" · ", ", ");
}
