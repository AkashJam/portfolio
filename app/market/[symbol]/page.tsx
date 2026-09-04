import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CostOfLivingChart } from "@/components/market/CostOfLivingChart";
import { LiveSnapshot } from "@/components/market/LiveSnapshot";
import { SymbolChartPanel } from "@/components/market/SymbolChartPanel";
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16">
      <LiveSnapshot symbol={symbol} initialSnapshot={snapshot} />
      <SymbolChartPanel
        symbol={symbol}
        initialInterval={DEFAULT_INTERVAL}
        initialCandles={candles?.candles ?? []}
        initialIndicators={indicators}
      />
    </div>
  );
}
