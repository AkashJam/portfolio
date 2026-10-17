import { BAND_HEIGHT, BAND_WIDTH, bandGeometry } from "@/lib/band-path";
import type { Band } from "@/lib/market-schemas";

/**
 * The expectation band behind an entry (portfolio.md §15 Phase 15 step 7): sixty
 * sessions of closes with the band around them, drawn in price terms but derived
 * from the residual, so it drifts with the sector rather than sitting flat. Plain
 * SVG at a fixed size, built on the server, so it is in the HTML before any
 * script runs (§17). The line is in reading ink inside the band and in the colour
 * of the side it left on from the last session inside it, so the departure is
 * where the eye lands.
 */
export function BandChart({ band, label }: { band: Band; label: string }) {
  const g = bandGeometry(band);
  if (!g) return null;
  const breakout = g.side === "above" ? "var(--market-up)" : "var(--market-down)";
  return (
    <svg
      data-testid="band-chart"
      data-side={g.side}
      viewBox={`0 0 ${BAND_WIDTH} ${BAND_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="mt-5 block h-[130px] w-full"
    >
      <path d={g.fill} style={{ fill: "var(--text-muted)", fillOpacity: 0.085 }} />
      {[g.upper, g.lower].map((points, i) => (
        <polyline
          key={i}
          points={points}
          vectorEffect="non-scaling-stroke"
          style={{ fill: "none", stroke: "var(--text-muted)", strokeWidth: 0.9, strokeDasharray: "4 4", opacity: 0.55 }}
        />
      ))}
      <polyline
        points={g.inside}
        vectorEffect="non-scaling-stroke"
        style={{ fill: "none", stroke: "var(--read)", strokeWidth: 1.7, strokeLinejoin: "round" }}
      />
      {g.outside && (
        <polyline
          points={g.outside}
          vectorEffect="non-scaling-stroke"
          style={{ fill: "none", stroke: breakout, strokeWidth: 2.2, strokeLinejoin: "round" }}
        />
      )}
      <circle cx={g.dot.x} cy={g.dot.y} r={4} style={{ fill: breakout }} />
    </svg>
  );
}
