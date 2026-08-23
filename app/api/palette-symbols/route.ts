import { NextResponse } from "next/server";

import { getCostOfLiving, getSymbols } from "@/lib/ticker-client";
import type { PaletteSymbol } from "@/lib/nav";

// Fetched client-side by CommandPalette on mount, not from app/layout.tsx —
// a root-layout fetch would force every page (including the static Home
// and About) into dynamic, server-rendered-on-demand mode just to feed the
// ⌘K "Symbols" group. Isolating it to its own route keeps that dynamism
// scoped to exactly this one endpoint (portfolio.md §15 Phase C).
export async function GET() {
  const [symbols, costOfLiving] = await Promise.all([getSymbols(), getCostOfLiving()]);

  const paletteSymbols: PaletteSymbol[] = [
    ...(symbols ?? []).map((s) => ({ href: `/market/${s.symbol}`, label: s.symbol, sublabel: s.name })),
    ...(costOfLiving ?? []).map((c) => ({
      href: `/market/COL:${c.city}`,
      label: c.city,
      sublabel: "Cost of living · simulated",
    })),
  ];

  return NextResponse.json(paletteSymbols);
}
