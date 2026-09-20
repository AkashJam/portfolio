/**
 * About's ambient element (portfolio.md §15 Phase 6 step 4, ported from
 * `superseded/design-pass/about-ambient-angular-forms.html`) — thirteen
 * stars of varying magnitude joined by straight sight-lines, a glow
 * hopping between them. Replaces `LiveSignal`'s heartbeat waveform, which
 * portfolio.md §15 names as a defect: it sat `inset-0` over the reading
 * column and degenerated to a flat bar on narrow viewports. This renders
 * as a sibling of the hero's copy, not a container around it.
 *
 * Coordinates, radii and per-node delays are carried over verbatim from
 * the mock — a star chart, not a generated pattern; the exact positions
 * are the design.
 */

const EDGES: [number, number, number, number][] = [
  [110, 300, 190, 210],
  [190, 210, 262, 268],
  [190, 210, 330, 150],
  [330, 150, 285, 64],
  [330, 150, 470, 96],
  [330, 150, 420, 232],
  [420, 232, 540, 196],
  [470, 96, 540, 196],
  [540, 196, 610, 290],
  [540, 196, 668, 132],
  [668, 132, 820, 110],
  [668, 132, 745, 238],
  [745, 238, 610, 290],
  [610, 290, 560, 330],
];

const STARS: { x: number; y: number; nodeR: number; occlR: number; delay: string }[] = [
  { x: 110, y: 300, nodeR: 3.2, occlR: 3.8, delay: "0.0s" },
  { x: 190, y: 210, nodeR: 4.6, occlR: 5.2, delay: "1.8s" },
  { x: 262, y: 268, nodeR: 2.4, occlR: 3.0, delay: "3.6s" },
  { x: 330, y: 150, nodeR: 5.4, occlR: 6.0, delay: "5.4s" },
  { x: 420, y: 232, nodeR: 3.0, occlR: 3.6, delay: "12.6s" },
  { x: 470, y: 96, nodeR: 3.6, occlR: 4.2, delay: "9.0s" },
  { x: 540, y: 196, nodeR: 4.2, occlR: 4.8, delay: "10.8s" },
  { x: 610, y: 290, nodeR: 2.6, occlR: 3.2, delay: "14.4s" },
  { x: 668, y: 132, nodeR: 5.0, occlR: 5.6, delay: "18.0s" },
  { x: 745, y: 238, nodeR: 3.0, occlR: 3.6, delay: "16.2s" },
  { x: 820, y: 110, nodeR: 3.4, occlR: 4.0, delay: "19.8s" },
  { x: 285, y: 64, nodeR: 2.2, occlR: 2.8, delay: "7.2s" },
  { x: 560, y: 330, nodeR: 2.0, occlR: 2.6, delay: "21.6s" },
];

export function Asterism() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 z-0 h-[400px] w-[min(880px,170%)] -translate-x-1/2 opacity-90 [mask-image:radial-gradient(86%_88%_at_50%_32%,#000_60%,transparent_100%)] md:h-[500px] md:w-[min(1180px,138%)] md:opacity-100 lg:h-[600px] lg:w-[min(1440px,116%)]"
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
              strokeOpacity={0.3}
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
