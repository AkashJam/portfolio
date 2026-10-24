"use client";

import * as React from "react";

import { deriveMarketState, toFeed, toSession, type MarketState } from "@/lib/market-state";

const POLL_MS = 60_000;

const MarketStateContext = React.createContext<MarketState | null>(null);

/**
 * The Market indicator's one source (portfolio.md §15 Phase 14 step 6). The nav
 * is on every page, static ones included, so the state arrives by a small poll of
 * /api/market-state: on mount, every minute, and when the tab comes back. It is
 * null until the first answer, so nothing guesses "quiet" for a feed that may be
 * dead. A failed request is unreachable, not "unchanged".
 */
export function MarketStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<MarketState | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      let next: MarketState;
      try {
        const res = await fetch("/api/market-state", { cache: "no-store" });
        const body: unknown = await res.json();
        const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
        next = deriveMarketState({
          feed: res.ok ? toFeed(record.feed) : "unreachable",
          tripped: record.tripped === true,
          trips: typeof record.trips === "number" && Number.isInteger(record.trips) && record.trips > 0 ? record.trips : 0,
          session: res.ok ? toSession(record.session) : "unknown",
          opensAt: typeof record.opensAt === "string" ? record.opensAt : null,
        });
      } catch {
        next = deriveMarketState({ feed: "unreachable", tripped: false });
      }
      if (!cancelled) {
        setState((prev) =>
          prev && prev.state === next.state && prev.live === next.live && prev.trips === next.trips && prev.session === next.session && prev.opensAt === next.opensAt
            ? prev
            : next,
        );
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <MarketStateContext.Provider value={state}>{children}</MarketStateContext.Provider>;
}

export function useMarketState(): MarketState | null {
  return React.useContext(MarketStateContext);
}
