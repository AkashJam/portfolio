/**
 * The ten sector baskets on /market's Industries strip (portfolio.md §15
 * Phase 14 step 5): the sweep's iShares Global sector funds, priced once a day
 * at the close. `REET` is not here: Real Estate is the one sector with no
 * global story, and `IXP` (Communications) was missing from the earlier mocks.
 *
 * The labels are the strip's own short names. The ticker serves these symbols
 * by their fund names ("iShares Global Tech ETF"), and the contract test
 * (lib/ticker-client.contract.test.ts) fails if one of the ten stops being
 * known to the ticker.
 */
export interface Sector {
  symbol: string;
  label: string;
}

export const SECTORS: readonly Sector[] = [
  { symbol: "IXN", label: "Technology" },
  { symbol: "IXP", label: "Communications" },
  { symbol: "RXI", label: "Discretionary" },
  { symbol: "IXG", label: "Financials" },
  { symbol: "IXJ", label: "Health care" },
  { symbol: "IXC", label: "Energy" },
  { symbol: "KXI", label: "Staples" },
  { symbol: "EXI", label: "Industrials" },
  { symbol: "MXI", label: "Materials" },
  { symbol: "JXI", label: "Utilities" },
];
