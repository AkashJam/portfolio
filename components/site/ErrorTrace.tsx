/**
 * The 404 and 500's trace (phase6.md Step 4/5; redrawn in Phase 19, M24): one line
 * that also does semantic work, flatlined for 404, broken for 500, the same motif as
 * the hero pulse. It sits in its own full-width band between the message and the
 * buttons, so nothing overlaps it, and fades into the canvas at both ends. The run
 * along the line (`.error-trace-run`, globals.css) is drawn only under
 * motion-allowed and off touch devices; without it the line is static.
 */
const POINTS = {
  flat: "0,60 600,60",
  broken: "0,60 300,60 322,18 344,104 366,60 452,60 468,38 484,82 500,60 600,60",
} as const;

export function ErrorTrace({ variant }: { variant: "flat" | "broken" }) {
  const color = variant === "flat" ? "var(--brand-hover)" : "var(--market-down)";
  const points = POINTS[variant];
  // The same marks, one in a wash of the colour and one running over it.
  const line = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" } as const;

  return (
    <div
      aria-hidden="true"
      className="relative h-30 w-full [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] max-md:h-22"
    >
      <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="absolute inset-0 block size-full">
        <polyline points={points} stroke={`color-mix(in oklab, ${color} 58%, transparent)`} strokeWidth={1.8} style={line} />
        <polyline className="error-trace-run" points={points} pathLength={100} stroke={color} strokeWidth={2.2} style={line} />
      </svg>
    </div>
  );
}
