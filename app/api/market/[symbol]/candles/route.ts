import { NextResponse } from "next/server";

import { getCandles, getIndicatorSeries } from "@/lib/ticker-client";

// Same-origin proxy (mockups/v3 interval switcher) exposing the
// "server-only" ticker-client.ts functions to SymbolChartPanel — the same
// pattern app/api/stream/route.ts and app/api/palette-symbols/route.ts
// already use. Combines candles + indicators into one response so
// switching intervals is one client round-trip, not two.
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);
  const interval = new URL(request.url).searchParams.get("interval") ?? "1h";

  const [candlesResponse, indicators] = await Promise.all([
    getCandles(symbol, interval),
    getIndicatorSeries(symbol, ["ema", "rsi"], interval),
  ]);

  return NextResponse.json({ candles: candlesResponse?.candles ?? [], indicators });
}
