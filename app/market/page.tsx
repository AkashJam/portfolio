import type { Metadata } from "next";

import { SymbolCardGrid } from "@/components/market/SymbolCardGrid";
import type { MarketRow } from "@/components/market/SymbolCard";
import { CostOfLivingTable } from "@/components/market/CostOfLivingTable";
import { volumeFormat } from "@/lib/format";
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
            const candleList = candles?.candles ?? [];
            return {
              symbol: s.symbol,
              name: s.name,
              type: s.type,
              exchange: s.exchange,
              regime: s.regime,
              snapshot,
              sparkline: candleList.slice(-SPARKLINE_POINTS).map((c) => c.close),
              lastVolume: candleList.at(-1)?.volume ?? 0,
            };
          })
        )
      ).filter((row): row is MarketRow => row !== null)
    : [];

  const avgChangePercent =
    rows.length > 0 ? rows.reduce((sum, r) => sum + r.snapshot.changePercent, 0) / rows.length : 0;
  const totalVolume = rows.reduce((sum, r) => sum + r.lastVolume, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Market</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-light">Live markets</h1>
          <span className="rounded-full border border-market-up/30 bg-panel-2 px-2.5 py-1 font-mono text-[11px] font-medium text-market-up">
            ● SSE live
          </span>
          <span className="rounded-full border border-simulated/30 bg-panel-2 px-2.5 py-1 font-mono text-[11px] font-medium text-simulated">
            ◆ Simulated feed
          </span>
        </div>
      </div>

      <section>
        {rows.length > 0 && (
          <p className="mb-5 font-mono text-sm text-text-muted">
            {rows.length} symbols · avg{" "}
            <span className={avgChangePercent >= 0 ? "text-market-up" : "text-market-down"}>
              {avgChangePercent >= 0 ? "+" : ""}
              {avgChangePercent.toFixed(2)}%
            </span>{" "}
            · {volumeFormat.format(totalVolume)} traded (1h)
          </p>
        )}
        <h2 className="mb-4 text-lg font-medium">Symbols</h2>
        {rows.length > 0 ? (
          <SymbolCardGrid rows={rows} />
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
