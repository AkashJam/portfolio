import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LiveSnapshot } from "@/components/market/LiveSnapshot";
import { SymbolChartPanel } from "@/components/market/SymbolChartPanel";
import { seedFromResponse } from "@/lib/market-session";
import { INTRADAY_INTERVAL, chooseInterval, isInterval } from "@/lib/price-interval";
import {
  getCandles,
  getIndicatorSeries,
  getMarketState,
  getSensors,
  getSymbolSnapshot,
} from "@/lib/ticker-client";
import { pageMetadata } from "@/lib/metadata";
import { findSensor, isSimulated, sensorHref, sensorPriceHref, sensorTitle } from "@/lib/sensor-title";

// `/market/japan/price` and `/market/MUFG/price` are one page (Phase 16 step 2): the
// segment is a country slug or a symbol, and the canonical is the slug form, the one
// the site links to. A simulator symbol (dev and CI only) keeps its raw form.
export async function generateMetadata({
  params,
}: PageProps<"/market/[sensor]/price">): Promise<Metadata> {
  const name = decodeURIComponent((await params).sensor);
  const sensor = findSensor(await getSensors({ revalidateSeconds: 3600 }), name);
  const heading = sensor ? sensorTitle(sensor).heading : name;
  return pageMetadata({
    path: sensor ? sensorPriceHref(sensor) : `/market/${name}/price`,
    title: `${heading} — Market — Akash James`,
    description: sensor
      ? `${sensorTitle(sensor).sub}: price, candlesticks and indicators, dated.`
      : `${name}: price, candlesticks and indicators, streamed from the Ticker backend.`,
  });
}

export default async function SymbolPage({ params, searchParams }: PageProps<"/market/[sensor]/price">) {
  const { sensor: rawName } = await params;
  const requested = (await searchParams).interval;
  const name = decodeURIComponent(rawName);
  const renderedAt = new Date().toISOString();

  const sensors = await getSensors({ revalidateSeconds: 3600 });
  const sensor = findSensor(sensors, name);
  // The eighteen sensors, and the simulator's symbols where the ticker has them
  // (dev and CI only: the production ticker has none, so they are a 404 there).
  // Everything else, the industry baskets included, has no page.
  if (!sensor && !isSimulated(name)) notFound();
  const symbol = sensor ? sensor.symbol : name;

  const [snapshot, marketState] = await Promise.all([getSymbolSnapshot(symbol), getMarketState()]);
  if (!snapshot) notFound();

  // The interval follows the session (I44): a closed market opens on the daily view, an open
  // one on the hour, and a reader's ?interval= wins (I51). Only an open market with no say
  // from the reader needs the hourly bars, to see whether RSI has enough of them.
  const initialState = seedFromResponse(marketState);
  const closed = initialState.session === "closed";
  const wanted = Array.isArray(requested) ? requested[0] : requested;
  const intraday =
    !isInterval(wanted) && !closed
      ? await Promise.all([getCandles(symbol, INTRADAY_INTERVAL), getIndicatorSeries(symbol, ["ema", "rsi"], INTRADAY_INTERVAL)])
      : null;
  const interval = chooseInterval({ requested: wanted, closed, intradayBars: intraday?.[0]?.candles.length ?? 0 });
  const [candles, indicators] =
    intraday && interval === INTRADAY_INTERVAL
      ? intraday
      : await Promise.all([getCandles(symbol, interval), getIndicatorSeries(symbol, ["ema", "rsi"], interval)]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16">
      <LiveSnapshot
        symbol={symbol}
        sensor={sensor ? sensorTitle(sensor) : null}
        recordHref={sensor ? sensorHref(sensor) : null}
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
