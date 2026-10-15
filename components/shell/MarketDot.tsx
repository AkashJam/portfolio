"use client";

import { useMarketState } from "@/components/shell/MarketStateProvider";
import { stateAriaLabel, type MarketState } from "@/lib/market-state";
import { cn } from "@/lib/utils";

/**
 * The three-state dot (portfolio.md §15 Phase 14 step 6; bearing.md #94, #104),
 * 7px, as the mocks draw it: a hollow ring for quiet, solid indigo for tripped
 * (indigo, not market-down, because a trip can be a rise and up and down colours
 * are data only), an amber ring for unreachable. The quiet ring is
 * `text-muted`, not the mock's `--text-faint`, which is 3.0-3.15:1 on the
 * canvas where a non-text mark needs 3:1.
 *
 * Until the first answer it reserves its space and draws nothing, so the tab does
 * not jump and nothing guesses.
 */
const BASE = "box-border inline-block size-[7px] shrink-0 rounded-full align-[1px]";

const LOOK = {
  quiet: "border-[1.5px] border-text-muted bg-transparent",
  tripped: "bg-brand-hover",
  unreachable: "border-[1.5px] border-stale bg-transparent",
} as const;

export function MarketDot({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  const state = useMarketState();
  // Empty and invisible, so there is nothing for a screen reader to find; it only holds the space.
  if (!state) return <span data-market-state="unknown" className={cn(BASE, "opacity-0", className)} />;
  return <DotFor state={state} className={className} decorative={decorative} />;
}

export function DotFor({ state, className, decorative = false }: { state: Pick<MarketState, "state" | "live">; className?: string; decorative?: boolean }) {
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": stateAriaLabel(state) })}
      data-market-state={state.state}
      data-market-live={state.live ? "true" : "false"}
      className={cn(BASE, LOOK[state.state], className)}
    />
  );
}
