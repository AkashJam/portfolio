"use client";

import { useSessionState } from "@/components/market/useMarketSession";
import type { MarketState } from "@/lib/market-state";

/**
 * The stream pill beside "Prices". It says the browser's connection is alive,
 * not that the market is: while the session is closed the connection is still up,
 * but "live" would claim motion that is not there.
 */
export function SessionPill({ initial }: { initial: MarketState }) {
  const closed = useSessionState(initial).session === "closed";
  return closed ? (
    <span className="rounded-full border border-hairline bg-panel-2 px-2.5 py-1 font-mono text-meta font-medium text-text-muted">
      ○ SSE connected
    </span>
  ) : (
    <span className="rounded-full border border-market-up/30 bg-panel-2 px-2.5 py-1 font-mono text-meta font-medium text-market-up">
      ● SSE live
    </span>
  );
}
