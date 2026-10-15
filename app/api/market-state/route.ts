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
      // Whether a sensor tripped. Nothing can yet: the trigger is Phase 15's, and it
      // will read GET /market/events for the latest session. Until then the honest
      // answer is no, and the indicator says quiet or unreachable, never tripped.
      tripped: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
