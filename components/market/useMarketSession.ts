"use client";

import * as React from "react";

import { useMarketState } from "@/components/shell/MarketStateProvider";
import type { MarketState } from "@/lib/market-state";

/**
 * The closed state's shared hooks (portfolio.md §15 Phase 14 step 7), used by
 * /market now and by the symbol page (step 8) and the home band (step 9).
 */

/**
 * The session as the page should draw it: the shell's poll once it has answered,
 * and the server's own answer before that, so a closed market does not flash its
 * open treatment on the first paint.
 */
export function useSessionState(initial: MarketState): MarketState {
  return useMarketState() ?? initial;
}

/**
 * The clock for a countdown. It starts at the page's render time, so the server's
 * HTML and the client's first render agree, then follows the browser's clock. One
 * second is fine-grained enough for a countdown that reads minutes, and the first
 * tick lands a second after mount.
 */
export function useNow(renderedAt: string, intervalMs = 1000): Date {
  const [now, setNow] = React.useState(() => new Date(renderedAt));
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
