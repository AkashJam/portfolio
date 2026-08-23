import type { Metadata } from "next";

import { MarketTable, type MarketRow } from "@/components/market/MarketTable";
import { CostOfLivingTable } from "@/components/market/CostOfLivingTable";
import { getCandles, getCostOfLiving, getSymbolSnapshot, getSymbols } from "@/lib/ticker-client";

export const metadata: Metadata = {
  title: "Market — Akash James",
  description: "Live SIM: markets and simulated cost-of-living data, streamed from the Ticker backend.",
};

const DEFAULT_INTERVAL = "1h";
const SPARKLINE_POINTS = 20;

export default async function MarketPage() {
  const [symbols, costOfLiving] = await Promise.all([getSymbols(), getCostOfLiving()]);

  const rows = symbols
    ? (
        await Promise.all(
          symbols.map(async (s): Promise<MarketRow | null> => {
            const [snapshot, candles] = await Promise.all([
              getSymbolSnapshot(s.symbol),
              getCandles(s.symbol, DEFAULT_INTERVAL),
            ]);
            if (!snapshot) return null;
            return {
              symbol: s.symbol,
              name: s.name,
              snapshot,
              sparkline: (candles?.candles ?? []).slice(-SPARKLINE_POINTS).map((c) => c.close),
            };
          })
        )
      ).filter((row): row is MarketRow => row !== null)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Market</p>
        <h1 className="text-4xl font-light">Live Markets</h1>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Live Markets</h2>
        {rows.length > 0 ? (
          <MarketTable rows={rows} />
        ) : (
          <p className="text-sm text-text-muted">Live market data is temporarily unavailable.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Cost of Living</h2>
        {costOfLiving && costOfLiving.length > 0 ? (
          <CostOfLivingTable rows={costOfLiving} />
        ) : (
          <p className="text-sm text-text-muted">Cost-of-living data is temporarily unavailable.</p>
        )}
      </section>
    </div>
  );
}
