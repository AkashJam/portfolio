// One built site, two copies of it, each reading a real ticker whose database the
// `ticker fixture` command filled (phase17.md step 5). A page's server-side fetches
// cannot be intercepted from the browser, so the two states of the ledger are two
// ports. The empty state is the main suite's: its ticker has never tripped.
export const SITES = {
  /** The newest backfilled session (8 Oct) tripped: Japan and Canada. */
  tripped: { site: 3010, ticker: 4010 },
  /** The newest trip is two sessions old (Korea, 6 Oct): nothing past threshold. */
  quiet: { site: 3011, ticker: 4011 },
} as const;

export type Mode = keyof typeof SITES;

export const siteUrl = (mode: Mode): string => `http://localhost:${SITES[mode].site}`;

export const tickerUrl = (mode: Mode): string => `http://127.0.0.1:${SITES[mode].ticker}`;
