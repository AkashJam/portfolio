import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LiveSnapshot } from "@/components/market/LiveSnapshot";
import { SymbolChartPanel } from "@/components/market/SymbolChartPanel";
import { seedFromResponse } from "@/lib/market-session";
import {
  getCandles,
  getIndicatorSeries,
  getMarketState,
  getSensors,
  getSymbolSnapshot,
} from "@/lib/ticker-client";
import { pageMetadata } from "@/lib/metadata";
import { findSensor, isSimulated, sensorTitle } from "@/lib/sensor-title";

const DEFAULT_INTERVAL = "1h";
// A sensor has daily bars from the sweep from the first day, but intraday bars only
// once its trades have streamed (and none overnight in the first session), so a page
// that opens on an empty 1h chart opens on the daily one instead.
const FALLBACK_INTERVAL = "1d";

export async function generateMetadata({
  params,
}: PageProps<"/market/[symbol]">): Promise<Metadata> {
  const symbol = decodeURIComponent((await params).symbol);
  const sensor = findSensor(await getSensors({ revalidateSeconds: 3600 }), symbol);
  const heading = sensor ? sensorTitle(sensor).heading : symbol;
  // Canonical keeps the raw symbol, the form PricesTable and the palette link
  // to, not a `%3A`-encoded variant.
  return pageMetadata({
    path: `/market/${symbol}`,
    title: `${heading} — Market — Akash James`,
    description: sensor
      ? `${sensorTitle(sensor).sub}: price, candlesticks and indicators, dated.`
      : `${symbol}: price, candlesticks and indicators, streamed from the Ticker backend.`,
  });
}

export default async function SymbolPage({ params }: PageProps<"/market/[symbol]">) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);
  const renderedAt = new Date().toISOString();

  const sensors = await getSensors({ revalidateSeconds: 3600 });
  const sensor = findSensor(sensors, symbol);
  // The eighteen sensors, and the simulator's symbols where the ticker has them
  // (dev and CI only: the production ticker has none, so they are a 404 there).
  // Everything else, the industry baskets included, has no page.
  if (!sensor && !isSimulated(symbol)) notFound();

  const [snapshot, intraday, intradayIndicators, marketState] = await Promise.all([
    getSymbolSnapshot(symbol),
    getCandles(symbol, DEFAULT_INTERVAL),
    getIndicatorSeries(symbol, ["ema", "rsi"], DEFAULT_INTERVAL),
    getMarketState(),
  ]);
  if (!snapshot) notFound();

  const useDaily = !intraday?.candles.length;
  const interval = useDaily ? FALLBACK_INTERVAL : DEFAULT_INTERVAL;
  const [candles, indicators] = useDaily
    ? await Promise.all([getCandles(symbol, interval), getIndicatorSeries(symbol, ["ema", "rsi"], interval)])
    : [intraday, intradayIndicators];

  const initialState = seedFromResponse(marketState);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16">
      <LiveSnapshot
        symbol={symbol}
        sensor={sensor ? sensorTitle(sensor) : null}
        initialSnapshot={snapshot}
        initialState={initialState}
        renderedAt={renderedAt}
      />
      <SymbolChartPanel
        symbol={symbol}
        initialInterval={interval}
        initialCandles={candles?.candles ?? []}
        initialIndicators={indicators}
        initialState={initialState}
      />
    </div>
  );
}
