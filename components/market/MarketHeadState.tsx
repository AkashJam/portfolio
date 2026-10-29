"use client";

import { FeedStatus } from "@/components/market/FeedStatus";
import type { FeedTracker } from "@/lib/feed-freshness";
import { useNow, useSessionState } from "@/components/market/useMarketSession";
import { lastSessionLabel, opensIn, stateLine } from "@/lib/market-session";
import type { MarketState } from "@/lib/market-state";
import type { Head } from "@/lib/ledger";
import { cn } from "@/lib/utils";

/**
 * /market's one state row under the intro (market.html; I41, M6): the state in
 * one place, then what the last close did. While New York trades it is the LIVE
 * chip. Otherwise it is the last close's time and when the market opens, with no
 * CLOSED pill and no second "Closed." elsewhere on the page. The stale-feed pill
 * takes the chip's place when ticks stop. The price page uses it too (Phase 21
 * step 5), with no ledger line and its own feed tracker.
 */
export function MarketHeadState({
  initial,
  renderedAt,
  newestAsOf,
  head,
  tracker,
}: {
  initial: MarketState;
  renderedAt: string;
  newestAsOf: string | null;
  /** What the last close did, from the ledger; null when the ledger could not be read. */
  head: Head | null;
  /** The page's own feed tracker, where the stream is owned below this row (the price page); /market uses the provider's. */
  tracker?: FeedTracker;
}) {
  const state = useSessionState(initial);
  const now = useNow(renderedAt);
  const unreachable = state.state === "unreachable";
  const open = state.session !== "closed";
  const last = lastSessionLabel(newestAsOf);
  const when = state.opensAt ? opensIn(state.opensAt, now) : null;
  const closedText = [last ? `Last close ${last}, 16:00 ET` : null, when].filter(Boolean).join(" · ");

  return (
    <div
      data-testid="market-state-line"
      data-tone={unreachable ? "unreachable" : open ? "open" : "closed"}
      className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-text-muted"
    >
      <FeedStatus
        tracker={tracker}
        fresh={
          unreachable ? (
            <span className="font-mono text-stale">{stateLine(state, now, newestAsOf).word} The feed is not answering.</span>
          ) : open ? (
            <span
              data-testid="live-chip"
              className="inline-flex items-center gap-2 rounded-full border border-market-up/35 bg-market-up/10 px-3 py-1.5 font-mono text-meta font-semibold text-market-up"
            >
              <i aria-hidden="true" className="size-1.5 rounded-full bg-market-up" />
              LIVE
            </span>
          ) : closedText ? (
            <span data-testid="market-state-facts" className="font-mono">
              {closedText}
            </span>
          ) : null
        }
      />
      {head && (
        <span data-testid="ledger-line" data-kind={head.kind} className={cn(head.href ? "" : "text-text-muted")}>
          {head.href ? (
            <a href={head.href} className="text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand">
              {head.text} <span aria-hidden="true">→</span>
            </a>
          ) : (
            head.text
          )}
        </span>
      )}
    </div>
  );
}
