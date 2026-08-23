/**
 * About's ambient element (portfolio.md §17/§18, mockups/v2 design refresh)
 * — a streaming pulse waveform, replacing the earlier ParallaxSphere.
 * Echoes the live SSE feed that's the portfolio's own thesis. Motion-safe +
 * touch-disabled via the shared `.signal-flow` class (globals.css), same
 * pattern as Glow's float/sphere loops.
 */
export function LiveSignal() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
    >
      <svg viewBox="0 0 1200 280" preserveAspectRatio="xMidYMid slice" className="size-full">
        <g className="signal-flow" style={{ transformBox: "view-box" }}>
          <polyline
            fill="none"
            stroke="var(--brand-hover)"
            strokeWidth={2}
            strokeOpacity={0.45}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="[filter:drop-shadow(0_0_6px_color-mix(in_oklab,var(--brand)_55%,transparent))]"
            points="0,140 104,140 138,140 150,70 162,205 176,140 196,140 404,140 438,140 450,70 462,205 476,140 496,140 704,140 738,140 750,70 762,205 776,140 796,140 1004,140 1038,140 1050,70 1062,205 1076,140 1096,140 1304,140 1338,140 1350,70 1362,205 1376,140 1396,140 1604,140 1638,140 1650,70 1662,205 1676,140 1696,140 1904,140 1938,140 1950,70 1962,205 1976,140 1996,140 2204,140 2238,140 2250,70 2262,205 2276,140 2296,140 2400,140"
          />
        </g>
      </svg>
    </div>
  );
}
