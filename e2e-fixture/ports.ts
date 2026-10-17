// One built site, three copies of it, each reading a differently-shaped fixture
// ticker (portfolio.md §15 Phase 15 step 7, decision 6). A page's server-side
// fetches cannot be intercepted from the browser, so the three states of the
// ledger are three ports.
export const SITES = {
  /** The last close tripped something: the newest entry is at the last close. */
  tripped: { site: 3010, ticker: 4010 },
  /** The newest entry is eleven sessions old: nothing past threshold. */
  quiet: { site: 3011, ticker: 4011 },
  /** No entry at all: the trigger is watching and nothing has fired. */
  empty: { site: 3012, ticker: 4012 },
} as const;

export type Mode = keyof typeof SITES;

export const siteUrl = (mode: Mode): string => `http://localhost:${SITES[mode].site}`;
