/**
 * About's ambient element (portfolio.md §15 Phase 6 step 12, "F / Ingress"
 * — ported from `mockups/phase6-visual/about.html`, replacing step 4's B6
 * figure) — thirteen stars of varying magnitude joined by straight
 * sight-lines, a glow hopping between them breadth-first from the hub.
 * Replaces `LiveSignal`'s heartbeat waveform, which portfolio.md §15 names
 * as a defect: it sat `inset-0` over the reading column and degenerated to
 * a flat bar on narrow viewports. This renders as a sibling of the hero's
 * copy, not a container around it.
 *
 * Coordinates, radii and per-node delays are carried over verbatim from
 * the mock — a star chart, not a generated pattern; the exact positions
 * are the design. Hub at 196,168; three tiers fan out from it, with one
 * closed triangle at the outer tier (560,148 – 672,96 – 700,186).
 */

const EDGES: [number, number, number, number][] = [
  [196, 168, 330, 74],
  [196, 168, 352, 196],
  [196, 168, 438, 116],
  [196, 168, 245, 272],
  [196, 168, 410, 222],
  [438, 116, 536, 58],
  [438, 116, 560, 148],
  [410, 222, 528, 214],
  [560, 148, 672, 96],
  [560, 148, 700, 186],
  [672, 96, 808, 132],
  [700, 186, 788, 238],
  [672, 96, 700, 186],
  [352, 196, 560, 148],
];

const STARS: { x: number; y: number; nodeR: number; occlR: number; delay: string }[] = [
  { x: 196, y: 168, nodeR: 7.0, occlR: 7.6, delay: "0.0s" },
  { x: 330, y: 74, nodeR: 4.4, occlR: 5.0, delay: "3.6s" },
  { x: 352, y: 196, nodeR: 4.0, occlR: 4.6, delay: "5.4s" },
  { x: 245, y: 272, nodeR: 3.4, occlR: 4.0, delay: "1.8s" },
  { x: 438, y: 116, nodeR: 4.6, occlR: 5.2, delay: "9.0s" },
  { x: 410, y: 222, nodeR: 3.2, occlR: 3.8, delay: "7.2s" },
  { x: 536, y: 58, nodeR: 3.8, occlR: 4.4, delay: "14.4s" },
  { x: 560, y: 148, nodeR: 4.2, occlR: 4.8, delay: "10.8s" },
  { x: 528, y: 214, nodeR: 3.0, occlR: 3.6, delay: "12.6s" },
  { x: 672, y: 96, nodeR: 3.4, occlR: 4.0, delay: "16.2s" },
  { x: 700, y: 186, nodeR: 3.6, occlR: 4.2, delay: "18.0s" },
  { x: 808, y: 132, nodeR: 3.0, occlR: 3.6, delay: "19.8s" },
  { x: 788, y: 238, nodeR: 2.8, occlR: 3.4, delay: "21.6s" },
];

export function Asterism() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 z-0 h-[400px] w-[min(880px,170%)] -translate-x-1/2 opacity-90 [mask-image:radial-gradient(70%_58%_at_50%_16%,#000_42%,transparent_88%)] md:h-[500px] md:w-[min(1180px,138%)] md:opacity-100 md:[mask-image:radial-gradient(86%_88%_at_50%_32%,#000_60%,transparent_100%)] lg:h-[600px] lg:w-[min(1440px,116%)]"
    >
      <svg viewBox="0 0 900 380" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <g>
          {EDGES.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              fill="none"
              stroke="var(--brand-hover)"
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          ))}
        </g>
        {/* Cuts each sight-line where it meets a star: a translucent circle
            over a line still shows the line beneath at any opacity, so
            these canvas-filled discs sit between the edges and the nodes
            and carry no animation of their own. */}
        <g>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.occlR} fill="var(--canvas)" />
          ))}
        </g>
        <g>
          {STARS.map((s, i) => (
            <circle
              key={i}
              className="aster-node"
              cx={s.x}
              cy={s.y}
              r={s.nodeR}
              fill="var(--brand-hover)"
              style={
                {
                  "--d": s.delay,
                  filter:
                    "drop-shadow(0 0 3px color-mix(in oklab, var(--brand) 45%, transparent)) drop-shadow(0 0 5px color-mix(in oklab, var(--brand-hover) 25%, transparent))",
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
