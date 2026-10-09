import { NextResponse } from "next/server";

import { TICKER_API_URL } from "@/lib/ticker-client";

// End-to-end health for external uptime monitoring. Unlike /api/ready (a
// cheap liveness probe that stays green with the ticker dead), this checks
// the ticker's own /ready, which covers Redis + Timescale — the chain whose
// silent failure took the live market down on 2026-10-09.
export const dynamic = "force-dynamic";

const TICKER_TIMEOUT_MS = 3000;

export async function GET() {
  try {
    const res = await fetch(`${TICKER_API_URL}/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TICKER_TIMEOUT_MS),
    });
    if (res.ok) return NextResponse.json({ status: "ok" });
  } catch {
    // fall through to degraded
  }
  return NextResponse.json({ status: "degraded" }, { status: 503 });
}
