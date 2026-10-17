import { NextResponse } from "next/server";

import { getMarketState } from "@/lib/ticker-client";

// The Market indicator's input (portfolio.md §15 Phase 14 step 6). The nav is on
// every page, including the static ones, so it asks here once a minute instead of
// making any page dynamic. Never cached: a stale answer would be a stale indicator.
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getMarketState();
  return NextResponse.json(
    {
      // A ticker that cannot be reached, or answers late, is exactly what
      // "unreachable" means.
      feed: state?.feed ?? "unreachable",
      // Whether the regular session is open, and when it next opens. A ticker that
      // could not be asked says neither: the page does not claim closed on a guess.
      session: state?.session ?? "unknown",
      opensAt: state?.opensAt ?? null,
      // Whether the last close tripped something: the ticker says so when the newest
      // event is from the newest session with bars, and clears it after the next
      // close that trips nothing (Phase 15 step 7). A ticker that could not be asked
      // cannot claim a trip.
      tripped: state?.tripped ?? false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
