"use client";

import { useMarketState } from "@/components/shell/MarketStateProvider";
import { TRIP_DOT_LABEL, type MarketState } from "@/lib/market-state";
import { cn } from "@/lib/utils";

/**
 * The Market tab's dot (phase19.md step 3, I12; it supersedes the three-state dot of
 * portfolio.md §15 Phase 14 step 6 and bearing.md #94, #104). It appears only after
 * a trip at the last close: solid indigo (not market-down, because a trip can be a
 * rise), named "An unusual move at the last close" on hover and to a screen reader.
 * Quiet draws nothing, and an unreachable ticker is said on /market itself.
 *
 * Whatever the state, the slot is kept (invisible when empty), so the tab after
 * Market does not move when a trip arrives with the first answer. `DotFor` below is
 * the three-looks dot the Market pages still draw beside their own state lines.
 */
const BASE = "box-border inline-block size-[7px] shrink-0 rounded-full align-[1px]";

const LOOK = {
  quiet: "border-[1.5px] border-text-muted bg-transparent",
  tripped: "bg-brand-hover",
  unreachable: "border-[1.5px] border-stale bg-transparent",
} as const;

export function MarketDot({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  const state = useMarketState();
  if (state?.state !== "tripped") {
    // Empty and invisible, so there is nothing for a screen reader to find; it only holds the space.
    return <span aria-hidden="true" data-market-state={state?.state ?? "unknown"} data-dot="hidden" className={cn(BASE, "opacity-0", className)} />;
  }
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": TRIP_DOT_LABEL, title: TRIP_DOT_LABEL })}
      data-market-state="tripped"
      data-dot="shown"
      className={cn(BASE, LOOK.tripped, className)}
    />
  );
}

/** The dot as the Market pages draw it, beside their state line: all three looks. */
export function DotFor({ state, className, decorative = false }: { state: Pick<MarketState, "state" | "live">; className?: string; decorative?: boolean }) {
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": state.state === "tripped" ? TRIP_DOT_LABEL : state.state })}
      data-market-state={state.state}
      data-market-live={state.live ? "true" : "false"}
      className={cn(BASE, LOOK[state.state], className)}
    />
  );
}
