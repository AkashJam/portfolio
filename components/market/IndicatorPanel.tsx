import type { IndicatorSeriesResponse } from "@/lib/market-schemas";
import { RSI_HEIGHT, RSI_WIDTH, rsiPath, rsiY } from "@/lib/rsi-path";

/**
 * RSI(14) panel (portfolio.md §18 `/market/[sensor]/price`) — SSR-only from the
 * ticker API's `series=true` indicators response. Deliberately not
 * SSE-live: a correct live update means recomputing RSI over a sliding
 * window, which would mean either polling this endpoint or duplicating
 * Wilder's smoothing client-side — exactly what the Go API's `series=true`
 * extension exists to avoid. Refreshes on navigation/reload only.
 *
 * A fixed 900x160 box that CSS stretches (`preserveAspectRatio="none"`), the way
 * the hero band's is, never `ResponsiveContainer`: that measures its parent after
 * hydration and renders nothing before it. It is plain SVG rather than Recharts
 * because Recharts 3.10.1 reports its size from an effect, so even at a fixed size
 * it draws nothing in the server HTML (measured, Phase 14 step 8). Hence also no
 * client directive: this is a server component. `vector-effect` keeps the strokes
 * the same width however far the box is stretched.
 */
export function IndicatorPanel({ indicators }: { indicators: IndicatorSeriesResponse | null }) {
  const points = indicators?.series.rsi;
  if (!points?.length) {
    return <p className="text-sm text-text-muted">RSI unavailable — not enough candle history yet.</p>;
  }

  const guide = { stroke: "var(--color-text-faint)", strokeDasharray: "3 3", vectorEffect: "non-scaling-stroke" } as const;

  return (
    <div className="h-40 w-full" role="img" aria-label="RSI(14)">
      <svg
        viewBox={`0 0 ${RSI_WIDTH} ${RSI_HEIGHT}`}
        preserveAspectRatio="none"
        className="size-full"
        aria-hidden="true"
      >
        <line x1={0} x2={RSI_WIDTH} y1={rsiY(30)} y2={rsiY(30)} {...guide} />
        <line x1={0} x2={RSI_WIDTH} y1={rsiY(70)} y2={rsiY(70)} {...guide} />
        <path
          d={rsiPath(points.map((p) => p.value))}
          fill="none"
          stroke="var(--color-brand-hover)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
