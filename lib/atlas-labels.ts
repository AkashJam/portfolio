import type { ColumnKey } from "@/lib/atlas";

// The measure names, written once (Phase 22 step 3; phase18.md I52). Before this
// each was written in six places and drifted ("housing, real", "PPP"). "Before
// inflation" stays on the stock market: the before/after pair is load-bearing
// (bearing #40). The exact terms (GNI, PPP, BIS) live in the Tier 2 popovers.

export const LABEL: Record<ColumnKey, { name: string; short: string }> = {
  everydaySpendingEur: { name: "Average spending per person, monthly (€)", short: "Average spending a month" },
  shares: { name: "Stock market, before inflation", short: "Stock market" },
  housing: { name: "House prices, after inflation", short: "House prices" },
  prices: { name: "Inflation", short: "Inflation" },
  currency: { name: "Currency against the euro", short: "Currency" },
  gniPpp: { name: "Income per person, adjusted for local prices", short: "Income" },
  unemployment: { name: "Unemployment", short: "Unemployment" },
  lifeExpectancy: { name: "Life expectancy", short: "Life expectancy" },
};

/** A name as it reads inside a sentence: no comma, first letter lower-cased (none starts a proper noun). */
export const inSentence = (key: ColumnKey): string => {
  const n = LABEL[key].name.replace(",", "");
  return n.charAt(0).toLowerCase() + n.slice(1);
};

/** The spending name with a home currency in place of the euro: `Average spending per person, monthly (¥)`. */
export const spendingName = (code: string): string => `Average spending per person, monthly (${code})`;
