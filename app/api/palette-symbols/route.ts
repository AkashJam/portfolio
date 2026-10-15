import { NextResponse } from "next/server";

import { getSensors } from "@/lib/ticker-client";
import type { PaletteSymbol } from "@/lib/nav";

// Fetched client-side by CommandPalette on mount, not from app/layout.tsx —
// a root-layout fetch would force every page (including the static Home
// and About) into dynamic, server-rendered-on-demand mode just to feed the
// ⌘K "Sensors" group. Isolating it to its own route keeps that dynamism
// scoped to exactly this one endpoint (portfolio.md §15 Phase C).
//
// The eighteen sensors, in the ticker's fixed order. A country sensor reads
// "Japan · Mitsubishi UFJ", a global one its theme ("Semiconductors"); each
// links to its own page, never to a ledger anchor (portfolio.md Phase 14).
export async function GET() {
  const sensors = await getSensors({ revalidateSeconds: 300 });

  const paletteSymbols: PaletteSymbol[] = (sensors ?? []).map((s) => ({
    href: `/market/${s.symbol}`,
    label: s.symbol,
    sublabel: s.country ? `${s.country} · ${s.name}` : (s.theme ?? s.name),
  }));

  return NextResponse.json(paletteSymbols);
}
