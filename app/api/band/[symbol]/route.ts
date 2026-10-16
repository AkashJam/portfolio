import { NextResponse } from "next/server";

import { fetchBandSeries } from "@/lib/band-fetch";
import { findSensor } from "@/lib/sensor-title";
import { getSensors, getSymbolSnapshot } from "@/lib/ticker-client";

// The home band's picker (portfolio.md §15 Phase 14 step 9): the chosen sensor's
// line, read on demand so the static home page carries one sensor's series, not
// eighteen. Same-origin, like /api/market-state. A symbol that is not one of the
// eighteen sensors is a 404: this route is not a window onto the whole ticker.
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const symbol = decodeURIComponent((await params).symbol);
  const mode = new URL(request.url).searchParams.get("mode") === "closed" ? "closed" : "open";

  const sensors = await getSensors({ revalidateSeconds: 3600 });
  if (!findSensor(sensors, symbol)) return NextResponse.json({ series: null }, { status: 404 });

  const snapshot = await getSymbolSnapshot(symbol);
  const series = await fetchBandSeries(symbol, mode, snapshot?.asOf ?? null);
  return NextResponse.json({ series, asOf: snapshot?.asOf ?? null });
}
