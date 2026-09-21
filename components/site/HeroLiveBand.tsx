"use client";

import * as React from "react";
import { Area, AreaChart, YAxis } from "recharts";

import { subscribeToStream } from "@/lib/sse";
import { Container } from "@/components/shell/Container";
import type { SymbolSnapshot } from "@/lib/market-schemas";

interface TapeRow {
  symbol: string;
  price: number;
  changePercent: number;
  prevClose: number;
}

// Internal coordinate space for the chart's viewBox only — stretched to the
// real box via preserveAspectRatio="none" below, so the actual numbers don't
// matter beyond being a consistent aspect ratio. Reuses the numbers
// mockups/phase6-visual/home.html's static reference chart already uses.
const HERO_CHART_VIEWBOX_WIDTH = 1440;
const HERO_CHART_VIEWBOX_HEIGHT = 256;
// The fixed cadence the track advances one slot — deliberately decoupled
// from when real ticks actually arrive. Real gaps observed live are
// irregular (630-2973ms), so a glide *triggered per-tick* either overlaps
// itself (fast ticks restart mid-transition) or sits dead-still for the
// remainder of a slow gap (portfolio.md §15 Phase 6 Step 9's "moves for
// .5s then stays still for .5s" finding) — no fixed duration fixes that
// while the trigger is still tick arrival. A real ticker tape reads as
// continuous because it moves at a constant rate regardless of when new
// prices land; this loop does the same. 1500ms is close to the observed
// average real gap, so most slots do carry a genuinely new price rather
// than a repeat.
const GLIDE_INTERVAL_MS = 1500;
const DOMAIN_PADDING_RATIO = 0.12;
// Real tick cadence is irregular (roughly 1-3s apart) — 60 ticks covers a
// few minutes, long enough that a single noisy tick can't dominate it.
const DOMAIN_HISTORY_SIZE = 60;

function prefersNoMotion(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

/**
 * Home hero's live band (portfolio.md §15 Phase 6 step 6, glide rewritten
 * in step 9's follow-up) — a ticker tape of the sim roster plus a live
 * area chart of one symbol, replacing the static glow orb + LiveChip pill.
 * One shared subscription drives both, matching SymbolCardGrid's "single
 * owner, presentational children" shape rather than opening a separate
 * EventSource per widget.
 */
export function HeroLiveBand({
  initialSnapshots,
  chartSymbol,
  initialSparkline,
}: {
  initialSnapshots: SymbolSnapshot[];
  chartSymbol: string;
  initialSparkline: number[];
}) {
  const [rows, setRows] = React.useState<TapeRow[]>(() =>
    initialSnapshots.map((s) => ({
      symbol: s.symbol,
      price: s.price,
      changePercent: s.changePercent,
      prevClose: s.prevClose,
    }))
  );
  // One point beyond initialSparkline's own length is kept off-screen
  // (clipped by overflow-hidden) as a "lookahead" point that glides into
  // view on each cycle — see the chart markup below.
  const POINTS_VISIBLE = initialSparkline.length;
  const [points, setPoints] = React.useState<number[]>(() =>
    initialSparkline.length > 0
      ? [...initialSparkline, initialSparkline.at(-1)!]
      : initialSparkline
  );
  // The Y domain is computed from this separate, longer buffer rather than
  // from `points` — real tick noise in a ~20-point window is enough to
  // swing a tight min/max every tick, snapping the whole curve's shape at
  // the same instant it's gliding horizontally. A longer, independent
  // history keeps the vertical scale stable and only drifting with real
  // sustained price movement.
  const [domainHistory, setDomainHistory] = React.useState<number[]>(() =>
    initialSparkline.slice()
  );

  // Latest known price for the charted symbol — a ref, not state. A tick
  // updates *what* the next slot should show; it deliberately does not
  // trigger a render or a glide itself, since the fixed-rate loop below
  // owns *when* the chart advances.
  const latestPriceRef = React.useRef<number | null>(initialSparkline.at(-1) ?? null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const symbols = initialSnapshots.map((s) => s.symbol);
    return subscribeToStream(symbols, {
      onQuote: (quote) => {
        setRows((prev) =>
          prev.map((row) =>
            row.symbol === quote.symbol
              ? {
                  ...row,
                  price: quote.price,
                  changePercent: row.prevClose
                    ? ((quote.price - row.prevClose) / row.prevClose) * 100
                    : 0,
                }
              : row
          )
        );
        if (quote.symbol === chartSymbol) {
          latestPriceRef.current = quote.price;
          setDomainHistory((prev) => [...prev.slice(-(DOMAIN_HISTORY_SIZE - 1)), quote.price]);
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The glide loop — fixed-rate, independent of tick timing. Each cycle:
  // instantly reset the track to its resting position while shifting the
  // data array in the same instant (drop the oldest point, promote the
  // lookahead, append a new lookahead for whatever's most recently known),
  // force a reflow so the browser commits that reset before re-enabling
  // the transition, then animate one slot left. The reset is what makes it
  // seamless — the new array's visible window is exactly the old array's
  // shifted-by-one window, so the "reset" frame is pixel-identical to the
  // frame just shown at the end of the previous glide; nothing jumps, only
  // relabels. Skipped entirely under reduced-motion/touch, but the data
  // itself keeps progressing either way — the transform is what's
  // decoration, not the value it reveals.
  React.useEffect(() => {
    if (POINTS_VISIBLE === 0) return;
    const reduceMotion = prefersNoMotion();

    const id = window.setInterval(() => {
      setPoints((prev) => {
        const next = prev.slice(1);
        next.push(latestPriceRef.current ?? prev.at(-1)!);
        return next;
      });

      const el = trackRef.current;
      if (!el || reduceMotion) return;
      el.style.transition = "none";
      el.style.transform = "translateX(0)";
      void el.offsetWidth; // force the reset to commit before re-enabling the transition
      requestAnimationFrame(() => {
        el.style.transition = `transform ${GLIDE_INTERVAL_MS}ms linear`;
        el.style.transform = `translateX(calc(-100% / ${POINTS_VISIBLE}))`;
      });
    }, GLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [POINTS_VISIBLE]);

  const domain = React.useMemo<[number, number]>(() => {
    const min = Math.min(...domainHistory);
    const max = Math.max(...domainHistory);
    const range = max - min;
    const padding = (range > 0 ? range : Math.abs(max) || 1) * DOMAIN_PADDING_RATIO;
    return [min - padding, max + padding];
  }, [domainHistory]);

  const chartUp = points.length > 1 ? points[POINTS_VISIBLE - 1] >= points[0] : true;
  const chartColor = chartUp ? "var(--color-market-up)" : "var(--color-market-down)";

  return (
    <section aria-label="Live market feed" className="mt-14">
      <Container className="flex flex-wrap items-center justify-between gap-4 pb-3.5">
        <span className="inline-flex flex-none items-center gap-2 rounded-full border border-market-up/35 bg-market-up/10 px-3 py-1.5 font-mono text-xs font-semibold text-market-up">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-market-up motion-safe:animate-pulse"
          />
          LIVE
        </span>
        <div className="flex flex-1 flex-wrap gap-7 overflow-hidden font-mono text-[13px] text-text-muted">
          {rows.map((row) => {
            const up = row.changePercent >= 0;
            return (
              <span key={row.symbol}>
                {row.symbol} <b className="font-semibold text-text">{row.price.toFixed(2)}</b>{" "}
                <span className={up ? "text-market-up" : "text-market-down"}>
                  {up ? "+" : ""}
                  {row.changePercent.toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
        <span className="flex-none font-mono text-[11px] tracking-[0.1em] text-text-muted uppercase">
          SSE · 1s
        </span>
      </Container>

      <div className="h-56 w-full md:h-64" role="img" aria-label="Live price series">
        <div className="hero-chart-clip h-full w-full overflow-hidden">
          <div
            ref={trackRef}
            className="hero-chart-track h-full"
            style={{ width: `calc(100% * ${POINTS_VISIBLE} / ${POINTS_VISIBLE - 1})` }}
          >
            <AreaChart
              width={HERO_CHART_VIEWBOX_WIDTH}
              height={HERO_CHART_VIEWBOX_HEIGHT}
              data={points.map((value) => ({ value }))}
              style={{ width: "100%", height: "100%" }}
              // @ts-expect-error — Recharts 3.10.1 forwards preserveAspectRatio to
              // the rendered <svg> at runtime (svgPropertiesNoEvents.js's allowlist
              // includes it; CategoricalChart.js doesn't exclude it), but
              // CartesianChartProps has no such field. Needed so the non-1:1
              // viewBox stretches to fill instead of letterboxing.
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={domain} hide />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={1.75}
                fill="url(#hero-chart-fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </div>
        </div>
      </div>
    </section>
  );
}
