"use client";

import * as React from "react";

import { FeedTracker, formatAge } from "@/lib/feed-freshness";
import { cn } from "@/lib/utils";

const FeedTrackerContext = React.createContext<FeedTracker | null>(null);

/**
 * One tracker per SSE subscription owner, for pages where the owner and the
 * status pill are in different parts of the tree — `/market`'s pill sits in
 * the server-rendered header, its subscription in `SymbolCardGrid` below.
 * Owners that render their own pill use `useLocalFeedTracker` instead.
 */
export function FeedFreshnessProvider({
  seedQuoteAt,
  children,
}: {
  seedQuoteAt?: string | null;
  children: React.ReactNode;
}) {
  const [tracker] = React.useState(() => new FeedTracker(seedQuoteAt));
  return <FeedTrackerContext.Provider value={tracker}>{children}</FeedTrackerContext.Provider>;
}

export function useFeedTracker(): FeedTracker {
  const tracker = React.useContext(FeedTrackerContext);
  if (!tracker) throw new Error("useFeedTracker must be used inside a FeedFreshnessProvider");
  return tracker;
}

export function useLocalFeedTracker(seedQuoteAt?: string | null): FeedTracker {
  const [tracker] = React.useState(() => new FeedTracker(seedQuoteAt));
  return tracker;
}

/**
 * The staleness indicator (portfolio.md §13, §15 Phase 7 step 1). Renders
 * `fresh` — the surface's own "live" pill — while events keep arriving, and
 * swaps it for an amber "last tick 43s ago" once none has for
 * `STALE_AFTER_MS`. Amber because §17 settles it as *stale data vintage*.
 *
 * Owns the only 1s clock: it reads the tracker, and sets state only when
 * its own output changes, so a fresh feed costs no renders at all.
 *
 * The wrapper is a persistent `role="status"` region, so the swap itself is
 * announced once ("Live feed interrupted", then the fresh pill's text on
 * recovery). The counting seconds are `aria-hidden` — a live region that
 * re-announces every second is noise, not information.
 */
export function FeedStatus({
  tracker: trackerProp,
  fresh,
  className,
}: {
  tracker?: FeedTracker;
  fresh?: React.ReactNode;
  /** Size/shape classes for the stale pill, to match the pill it replaces. */
  className?: string;
}) {
  const contextTracker = React.useContext(FeedTrackerContext);
  const tracker = trackerProp ?? contextTracker;
  // null = fresh; "" = stale with no known quote; otherwise the age.
  const [staleAge, setStaleAge] = React.useState<string | null>(null);
  // False until the clock below is running — server HTML and the first
  // client render say "pending", so tests (and anything else) can tell a
  // hydrated indicator from one that simply hasn't started watching yet.
  const [watching, setWatching] = React.useState(false);

  React.useEffect(() => {
    if (!tracker) return;
    const check = () => {
      const { stale, sinceQuoteMs } = tracker.status();
      const next = !stale ? null : sinceQuoteMs === null ? "" : formatAge(sinceQuoteMs);
      setStaleAge((prev) => (prev === next ? prev : next));
      setWatching(true);
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, [tracker]);

  return (
    <span
      role="status"
      data-feed-status={!watching ? "pending" : staleAge === null ? "fresh" : "stale"}
      className="inline-flex flex-none"
    >
      {staleAge === null ? (
        fresh
      ) : (
        <span
          data-testid="feed-stale"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-simulated/35 bg-simulated/10 font-mono text-simulated",
            className ?? "px-2.5 py-1 text-[11px] font-medium"
          )}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-simulated" />
          <span className="sr-only">Live feed interrupted</span>
          <span aria-hidden="true">{staleAge ? `last tick ${staleAge} ago` : "feed interrupted"}</span>
        </span>
      )}
    </span>
  );
}
