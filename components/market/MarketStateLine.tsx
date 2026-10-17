"use client";

import { useNow, useSessionState } from "@/components/market/useMarketSession";
import { DotFor } from "@/components/shell/MarketDot";
import { stateLine } from "@/lib/market-session";
import type { MarketState } from "@/lib/market-state";
import { cn } from "@/lib/utils";

/**
 * The line under the page's intro (portfolio.md §15 Phase 14 step 7): the state
 * in a word and the facts that go with it. Closed says when it opens and the last
 * session. What the last close tripped is the ledger's own line (LedgerHead). It is the
 * module steps 8 and 9 share, so the symbol page and the home band say the same
 * thing in the same words.
 */
export function MarketStateLine({
  initial,
  renderedAt,
  newestAsOf,
  note,
  className,
}: {
  initial: MarketState;
  renderedAt: string;
  newestAsOf: string | null;
  /** A closing clause for the closed line, such as the home band's `last 20 sessions`. */
  note?: string | null;
  className?: string;
}) {
  const state = useSessionState(initial);
  const now = useNow(renderedAt);
  const line = stateLine(state, now, newestAsOf);

  return (
    <p
      data-testid="market-state-line"
      data-tone={line.tone}
      className={cn("mt-5 flex items-start gap-3 font-mono text-[13px] leading-normal text-text-muted", className)}
    >
      {/* Beside the first line, not on a line of its own, when the facts wrap on a phone. */}
      <DotFor state={state} decorative className="mt-[6px] size-2" />
      <span>
        <b className={cn("font-medium", line.tone === "unreachable" ? "text-stale" : "text-read")}>{line.word}</b>{" "}
        <span data-testid="market-state-facts">
          {line.facts}
          {note && line.tone === "closed" ? ` · ${note}` : ""}
        </span>
      </span>
    </p>
  );
}
