import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LiveBadge } from "@/components/market/LiveBadge";
import { PriceChart } from "@/components/market/PriceChart";
import { IndicatorPanel } from "@/components/market/IndicatorPanel";
import { CostOfLivingChart } from "@/components/market/CostOfLivingChart";
import {
  getCandles,
  getCostOfLivingDetail,
  getIndicatorSeries,
  getSymbolSnapshot,
} from "@/lib/ticker-client";

const DEFAULT_INTERVAL = "1h";
const COL_PREFIX = "COL:";

export async function generateMetadata({
  params,
}: PageProps<"/market/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${decodeURIComponent(symbol)} — Market — Akash James` };
}

export default async function SymbolPage({ params }: PageProps<"/market/[symbol]">) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);

  if (symbol.startsWith(COL_PREFIX)) {
    const city = symbol.slice(COL_PREFIX.length);
    const detail = await getCostOfLivingDetail(city);
    if (!detail) notFound();
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <CostOfLivingChart detail={detail} />
      </div>
    );
  }

  const [snapshot, candles, indicators] = await Promise.all([
    getSymbolSnapshot(symbol),
    getCandles(symbol, DEFAULT_INTERVAL),
    getIndicatorSeries(symbol, ["ema", "rsi"], DEFAULT_INTERVAL),
  ]);
  if (!snapshot) notFound();

  const up = snapshot.change >= 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{snapshot.name}</p>
          <h1 className="font-mono text-3xl">{snapshot.symbol}</h1>
        </div>
        <div className="text-right">
          <p className={`font-mono text-3xl ${up ? "text-market-up" : "text-market-down"}`}>
            {snapshot.price.toFixed(2)}
          </p>
          <p className={`font-mono text-sm ${up ? "text-market-up" : "text-market-down"}`}>
            {up ? "+" : ""}
            {snapshot.change.toFixed(2)} ({up ? "+" : ""}
            {snapshot.changePercent.toFixed(2)}%)
          </p>
          <LiveBadge simulated={snapshot.simulated} className="mt-2" />
        </div>
      </div>

      {/* §8's snapshot has no distinct "Open" field — showing exactly
          what's real (High/Low/Prev Close) rather than mislabeling
          prevClose as Open to match the mockup's 4-stat layout. */}
      <div className="grid grid-cols-3 gap-4 font-mono text-sm text-text-muted">
        <div>
          <p className="text-text-muted">High</p>
          <p className="text-text">{snapshot.dayHigh.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-text-muted">Low</p>
          <p className="text-text">{snapshot.dayLow.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-text-muted">Prev Close</p>
          <p className="text-text">{snapshot.prevClose.toFixed(2)}</p>
        </div>
      </div>

      <PriceChart symbol={symbol} initialCandles={candles?.candles ?? []} initialIndicators={indicators} />
      <IndicatorPanel indicators={indicators} />
    </div>
  );
}
