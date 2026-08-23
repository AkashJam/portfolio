"use client";

import * as React from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import { subscribeToStream } from "@/lib/sse";
import type { Candle, IndicatorSeriesResponse } from "@/lib/market-schemas";

function toUTCTimestamp(iso: string): UTCTimestamp {
  return Math.floor(new Date(iso).getTime() / 1000) as UTCTimestamp;
}

/** Reads the actual design tokens (globals.css) rather than hardcoding hex
 * values a second time — lightweight-charts renders to canvas, so it needs
 * literal colors, not CSS var() references. */
function readTokens() {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();
  return {
    text: v("--text-muted") || "#8b929b",
    grid: v("--hairline") || "#1c2127",
    up: v("--market-up") || "#26a69a",
    down: v("--market-down") || "#ef5350",
    ema: v("--brand-hover") || "#818cf8",
  };
}

export function PriceChart({
  symbol,
  initialCandles,
  initialIndicators,
}: {
  symbol: string;
  initialCandles: Candle[];
  initialIndicators: IndicatorSeriesResponse | null;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tokens = readTokens();
    const chart = createChart(container, {
      layout: { background: { color: "transparent" }, textColor: tokens.text },
      grid: {
        vertLines: { color: tokens.grid },
        horzLines: { color: tokens.grid },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: tokens.up,
      downColor: tokens.down,
      borderVisible: false,
      wickUpColor: tokens.up,
      wickDownColor: tokens.down,
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(
      initialCandles.map((c) => ({
        time: toUTCTimestamp(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: tokens.up,
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;
    volumeSeries.setData(
      initialCandles.map((c) => ({
        time: toUTCTimestamp(c.time),
        value: c.volume,
        color: c.close >= c.open ? tokens.up : tokens.down,
      }))
    );

    const emaPoints = initialIndicators?.series.ema;
    if (emaPoints?.length) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: tokens.ema,
        lineWidth: 1,
        title: "EMA 9",
      });
      emaSeries.setData(emaPoints.map((p) => ({ time: toUTCTimestamp(p.time), value: p.value })));
    }

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // Re-mounts the whole chart on symbol/timeframe change (new initial
    // data) rather than diffing in place — simplest correct behavior for a
    // chart library that isn't a React-native component.
  }, [symbol, initialCandles, initialIndicators]);

  React.useEffect(() => {
    return subscribeToStream([symbol], {
      onCandle: (candle) => {
        const time = toUTCTimestamp(candle.time);
        candleSeriesRef.current?.update({
          time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
        const tokens = readTokens();
        volumeSeriesRef.current?.update({
          time,
          value: candle.volume,
          color: candle.close >= candle.open ? tokens.up : tokens.down,
        });
      },
    });
  }, [symbol]);

  return <div ref={containerRef} className="h-100 w-full" />;
}
