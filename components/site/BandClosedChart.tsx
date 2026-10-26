import { toPath } from "@/lib/band-series";
import { cn } from "@/lib/utils";

const WIDTH = 1440;
const HEIGHT = 256;
/** The end point's x: a few units in from the edge, so the dot is not clipped. */
const END = WIDTH - 8;

/**
 * The band's still line (phase18.md D4, `site-review/home.html`): the last
 * session's path at half strength with a plain end dot, no label, no marker and
 * no motion. It fills the hero under the text. Plain SVG in a box that CSS
 * stretches, so it is in the server HTML: this is the state most visitors load,
 * and Recharts draws nothing before hydration. A live band whose feed has gone
 * quiet draws the same line (`BandOpenChart` hands over to it).
 */
export function BandClosedChart({ points, label, className }: { points: number[]; label: string; className?: string }) {
  const { line, area, last } = toPath(points, END, HEIGHT);
  return (
    <div className={cn("relative size-full overflow-hidden", className)} data-testid="band-chart-closed">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="band-closed-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-text-muted)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--color-text-muted)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[82, 165].map((y) => (
          <line key={y} x1={0} x2={WIDTH} y1={y} y2={y} stroke="var(--color-hairline)" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#band-closed-fill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-text)"
          strokeOpacity={0.5}
          strokeWidth={1.6}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* HTML, not SVG: in a box stretched this far a circle becomes a sliver. */}
      <span
        aria-hidden="true"
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text"
        // Centred on the line's end, but never closer than its own radius to the edge: on a
        // phone the end is under 3px from the edge, and a dot centred there would overflow.
        style={{ left: `min(${(last[0] / WIDTH) * 100}%, calc(100% - 4px))`, top: `${(last[1] / HEIGHT) * 100}%` }}
      />
    </div>
  );
}
