import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LiveSnapshot } from "@/components/market/LiveSnapshot";
import { SymbolChartPanel } from "@/components/market/SymbolChartPanel";
import {
  getCandles,
  getIndicatorSeries,
  getSymbolSnapshot,
} from "@/lib/ticker-client";
import { pageMetadata } from "@/lib/metadata";

const DEFAULT_INTERVAL = "1h";

export async function generateMetadata({
  params,
}: PageProps<"/market/[symbol]">): Promise<Metadata> {
  const symbol = decodeURIComponent((await params).symbol);
  // Canonical keeps the raw symbol (`/market/SIM:NOVA`), the form
  // PricesTable and the palette link to, not a `%3A`-encoded variant.
  return pageMetadata({
    path: `/market/${symbol}`,
    title: `${symbol} — Market — Akash James`,
    description: `${symbol}: live price, candlesticks and indicators, streamed from the Ticker backend.`,
  });
}

export default async function SymbolPage({ params }: PageProps<"/market/[symbol]">) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);

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
