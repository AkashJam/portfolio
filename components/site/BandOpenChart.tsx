"use client";

import * as React from "react";
import { Area, AreaChart, YAxis } from "recharts";

// Internal coordinate space for the chart's viewBox only — stretched to the
// real box via preserveAspectRatio="none" below, so the actual numbers don't
// matter beyond being a consistent aspect ratio.
const VIEWBOX_WIDTH = 1440;
const VIEWBOX_HEIGHT = 256;
// The fixed cadence the track advances one slot — deliberately decoupled
// from when real ticks actually arrive. Real gaps are irregular, so a glide
// *triggered per-tick* either overlaps itself or sits dead-still for the
// remainder of a slow gap (phase6.md Step 9's finding). A real ticker tape
// reads as continuous because it moves at a constant rate regardless of when
// new prices land; this loop does the same.
const GLIDE_INTERVAL_MS = 1500;
const DOMAIN_PADDING_RATIO = 0.12;
// Real tick cadence is irregular — 60 ticks covers a few minutes, long enough
// that a single noisy tick can't dominate the vertical scale.
const DOMAIN_HISTORY_SIZE = 60;

function prefersNoMotion(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

/**
 * The open band's live line (phase6.md Steps 6 and 9; Phase 14 step 9): the seed
 * series, then one new slot every `GLIDE_INTERVAL_MS` carrying the latest price,
 * gliding left. The parent keys it by sensor and mode, so a new sensor starts a
 * clean line. `latest` is the sensor's newest price, which updates the next slot
 * and the vertical scale; it deliberately does not trigger a glide itself.
 */
export function BandOpenChart({ seed, latest, label }: { seed: number[]; latest: number | null; label: string }) {
  const visible = seed.length;
  // One point beyond the visible window is kept off-screen (clipped by
  // overflow-hidden) as a "lookahead" that glides into view on each cycle.
  const [points, setPoints] = React.useState<number[]>(() => [...seed, seed.at(-1)!]);
  // The Y domain comes from a separate, longer buffer: real tick noise in a
  // ~20-point window would swing a tight min/max every tick and snap the curve's
  // shape at the instant it glides horizontally.
  const [domainHistory, setDomainHistory] = React.useState<number[]>(() => seed.slice());
  const trackRef = React.useRef<HTMLDivElement>(null);
  const latestRef = React.useRef<number | null>(latest);

  React.useEffect(() => {
    latestRef.current = latest;
  }, [latest]);
  // A new price joins the scale's history. Adjusted during render, from the prop that
  // changed, rather than in an effect that sets state.
  const [seen, setSeen] = React.useState(latest);
  if (latest !== seen) {
    setSeen(latest);
    if (latest !== null) setDomainHistory((prev) => [...prev.slice(-(DOMAIN_HISTORY_SIZE - 1)), latest]);
  }

  // The glide loop, fixed-rate. Each cycle: instantly reset the track to its resting
  // position while shifting the data in the same instant (drop the oldest point,
  // promote the lookahead, append the latest), force a reflow so the browser
  // commits that reset, then animate one slot left. The reset frame is
  // pixel-identical to the frame the last glide ended on, so nothing jumps. Skipped
  // under reduced-motion and touch; the data keeps progressing either way.
  React.useEffect(() => {
    const reduceMotion = prefersNoMotion();
    const id = window.setInterval(() => {
      setPoints((prev) => [...prev.slice(1), latestRef.current ?? prev.at(-1)!]);

      const el = trackRef.current;
      if (!el || reduceMotion) return;
      el.style.transition = "none";
      el.style.transform = "translateX(0)";
      void el.offsetWidth;
      requestAnimationFrame(() => {
        el.style.transition = `transform ${GLIDE_INTERVAL_MS}ms linear`;
        el.style.transform = `translateX(calc(-100% / ${visible}))`;
      });
    }, GLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [visible]);

  const domain = React.useMemo<[number, number]>(() => {
    const min = Math.min(...domainHistory);
    const max = Math.max(...domainHistory);
    const range = max - min;
    const padding = (range > 0 ? range : Math.abs(max) || 1) * DOMAIN_PADDING_RATIO;
    return [min - padding, max + padding];
  }, [domainHistory]);

  const up = points[visible - 1] >= points[0];
  const color = up ? "var(--color-market-up)" : "var(--color-market-down)";

  return (
    <div className="h-56 w-full md:h-64" role="img" aria-label={label} data-testid="band-chart-open">
      <div className="hero-chart-clip h-full w-full overflow-hidden">
        <div
          ref={trackRef}
          className="hero-chart-track h-full"
          style={{ width: `calc(100% * ${visible} / ${visible - 1})` }}
        >
          <AreaChart
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            data={points.map((value) => ({ value }))}
            style={{ width: "100%", height: "100%" }}
            // @ts-expect-error — Recharts 3.10.1 forwards preserveAspectRatio to
            // the rendered <svg> at runtime (svgPropertiesNoEvents.js's allowlist
            // includes it) but CartesianChartProps has no such field. Needed so the
            // non-1:1 viewBox stretches to fill instead of letterboxing.
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={domain} hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.75}
              fill="url(#hero-chart-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </div>
      </div>
    </div>
  );
}
