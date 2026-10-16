import { toPath } from "@/lib/band-series";

const WIDTH = 1440;
const HEIGHT = 256;
/** The CLOSE marker's x: a few units in from the edge, so the ring is not clipped. */
const END = WIDTH - 8;

/**
 * The closed band's line (portfolio.md §15 Phase 14 step 9; mock
 * `market-v2/home-band-closed.html`): the last session's path in muted ink, a
 * dashed CLOSE marker, and a hollow ring at the end, never a live dot. Plain SVG
 * in a fixed box that CSS stretches, so it is in the server HTML: this is the
 * state most visitors load, and Recharts draws nothing before hydration.
 */
export function BandClosedChart({ points, label }: { points: number[]; label: string }) {
  const { line, area, last } = toPath(points, END, HEIGHT);
  return (
    <div className="relative h-56 w-full md:h-64" data-testid="band-chart-closed">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="band-closed-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-text-muted)" stopOpacity={0.14} />
            <stop offset="100%" stopColor="var(--color-text-muted)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[64, 128, 192].map((y) => (
          <line key={y} x1={0} x2={WIDTH} y1={y} y2={y} stroke="var(--color-hairline)" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#band-closed-fill)" />
        <path d={line} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.75} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line
          x1={END}
          x2={END}
          y1={24}
          y2={HEIGHT}
          stroke="var(--color-text-muted)"
          strokeOpacity={0.6}
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* HTML, not SVG: in a box stretched this far a circle becomes a sliver and text a smear. */}
      <span
        aria-hidden="true"
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-text-muted bg-canvas"
        style={{ left: `${(last[0] / WIDTH) * 100}%`, top: `${(last[1] / HEIGHT) * 100}%` }}
      />
      <span aria-hidden="true" className="absolute top-1 right-4 font-mono text-[11px] tracking-[0.06em] text-text-muted">
        CLOSE
      </span>
    </div>
  );
}
