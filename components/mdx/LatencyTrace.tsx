import type { ReactNode } from "react";

import { LATENCY_WINDOW, formatCount, formatMeasure, type LatencyStats } from "@/lib/latency";

interface LatencyTraceProps {
  /** Supplied by the page, not the MDX (MDXRenderer binds it): measured by
   * Prometheus, or a status saying why there's nothing to show. */
  stats?: LatencyStats;
  caption: ReactNode;
}

/** Why the tiles are dashes, when they are — never a number standing in. */
function placeholderReason(stats: LatencyStats | undefined): string | null {
  if (!stats || stats.status === "unreachable") return "Live telemetry is unreachable right now, so nothing is shown rather than a guess.";
  if (stats.status === "no-viewers") return `Nobody held a live page open in the last ${LATENCY_WINDOW}, so there were no deliveries to time.`;
  return null;
}

/**
 * Stat tiles + a one-tick sequence diagram for project case studies
 * (portfolio.md §15 Phase 6 step 5) — the sequence itself (Finnhub →
 * Ingest → Redis → SSE hub → Browser) is Market Ticker's own pipeline,
 * not a generic diagram type, so unlike ArchFlow it isn't parameterized
 * beyond the tiles/caption: a case study with a different pipeline shape
 * would need its own SVG anyway.
 *
 * Every figure here is measured (portfolio.md §15 Phase 7 step 6): the tiles
 * and the end-to-end line come from Prometheus via the page. It used to carry
 * estimates, including per-hop "+N ms" labels nothing measures; those are
 * gone rather than kept as decoration.
 */
export function LatencyTrace({ stats, caption }: LatencyTraceProps) {
  const measured = stats && stats.status !== "unreachable" ? stats : null;
  const tiles = [
    { value: formatMeasure(measured?.p50Ms ?? null), unit: "ms", label: "tick → SSE write · p50" },
    { value: formatMeasure(measured?.p99Ms ?? null), unit: "ms", label: "tick → SSE write · p99" },
    { value: formatMeasure(measured?.ticksPerSec ?? null), unit: "ticks/s", label: `ingest · ${LATENCY_WINDOW} avg` },
    { value: formatCount(measured?.peakClients ?? null), label: `peak live viewers · ${LATENCY_WINDOW}` },
  ];
  const endToEnd =
    measured?.p50Ms != null && measured.p99Ms != null
      ? `tick → SSE write · p50 ${formatMeasure(measured.p50Ms)} ms · p99 ${formatMeasure(measured.p99Ms)} ms`
      : "tick → SSE write · not measured right now";
  const reason = placeholderReason(stats);

  return (
    <div className="not-prose my-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-hairline bg-panel-2 p-4">
            <div className="font-mono text-2xl font-medium text-text tabular-nums">
              {tile.value}
              {tile.unit && tile.value !== "—" && <small className="text-sm text-text-muted"> {tile.unit}</small>}
            </div>
            <div className="mt-2.5 font-mono text-[11px] tracking-[0.08em] text-text-muted uppercase">
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-hairline bg-canvas p-4.5">
        <svg
          viewBox="0 0 900 350"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Sequence for one live tick: Sim source to Ingest to Redis to SSE hub to Browser. ${endToEnd}.`}
          className="block h-auto w-full min-w-130"
        >
          <defs>
            <marker id="lt-ah" markerWidth="9" markerHeight="9" refX="7.5" refY="4" orient="auto">
              <path d="M0,0 L9,4 L0,8 z" fill="var(--brand-hover)" />
            </marker>
            <marker id="lt-aha" markerWidth="9" markerHeight="9" refX="7.5" refY="4" orient="auto">
              <path d="M0,0 L9,4 L0,8 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          {(
            [
              [24, "Sim source", 80],
              [204, "Ingest · Go", 260],
              [384, "Redis", 440],
              [564, "SSE hub", 620],
              [744, "Browser", 800],
            ] as const
          ).map(([x, label, cx]) => (
            <g key={label}>
              <rect x={x} y={10} width={112} height={30} rx={7} fill="var(--panel-2)" stroke="color-mix(in oklab, var(--brand) 30%, var(--hairline))" />
              <text x={cx} y={30} textAnchor="middle" fill="var(--text)" fontSize={12} fontWeight={500} fontFamily="var(--font-mono)">
                {label}
              </text>
              <line x1={cx} y1={40} x2={cx} y2={332} stroke="var(--hairline)" strokeWidth={1} strokeDasharray="3 4" />
            </g>
          ))}

          <text x={170} y={70} textAnchor="middle" fill="var(--read)" fontSize={11.5} fontFamily="var(--font-mono)">
            tick
          </text>
          <line x1={80} y1={76} x2={258} y2={76} stroke="var(--brand-hover)" strokeWidth={1.5} markerEnd="url(#lt-ah)" />

          <rect x={254} y={98} width={12} height={24} rx={2} fill="color-mix(in oklab, var(--brand) 42%, var(--panel))" stroke="color-mix(in oklab, var(--brand) 50%, var(--hairline))" />
          <text x={274} y={107} textAnchor="start" fill="var(--read)" fontSize={11.5} fontFamily="var(--font-mono)">
            normalize + Redis lease
          </text>

          <text x={350} y={144} textAnchor="middle" fill="var(--read)" fontSize={11.5} fontFamily="var(--font-mono)">
            XADD + PUBLISH
          </text>
          <line x1={260} y1={150} x2={438} y2={150} stroke="var(--brand-hover)" strokeWidth={1.5} markerEnd="url(#lt-ah)" />

          <line x1={260} y1={184} x2={360} y2={184} stroke="var(--text-muted)" strokeWidth={1.3} strokeDasharray="5 4" markerEnd="url(#lt-aha)" />
          <rect x={366} y={172} width={200} height={26} rx={4} fill="var(--panel-2)" stroke="var(--hairline)" />
          <text x={376} y={189} textAnchor="start" fill="var(--text-muted)" fontSize={11} fontFamily="var(--font-mono)">
            async · candle → TimescaleDB
          </text>

          <text x={530} y={214} textAnchor="middle" fill="var(--read)" fontSize={11.5} fontFamily="var(--font-mono)">
            consume + build event
          </text>
          <line x1={440} y1={220} x2={618} y2={220} stroke="var(--brand-hover)" strokeWidth={1.5} markerEnd="url(#lt-ah)" />

          <text x={710} y={250} textAnchor="middle" fill="var(--read)" fontSize={11.5} fontFamily="var(--font-mono)">
            event: quote · SSE
          </text>
          <line x1={620} y1={256} x2={798} y2={256} stroke="var(--brand-hover)" strokeWidth={1.5} markerEnd="url(#lt-ah)" />

          <rect x={794} y={278} width={12} height={24} rx={2} fill="color-mix(in oklab, var(--brand) 42%, var(--panel))" stroke="color-mix(in oklab, var(--brand) 50%, var(--hairline))" />
          <text x={786} y={287} textAnchor="end" fill="var(--read)" fontSize={11.5} fontFamily="var(--font-mono)">
            parse + paint · not measured
          </text>

          {/* The measured span ends at the hub's write, not the browser's paint:
              a server can't time a network hop and a repaint it never sees. */}
          <line x1={80} y1={320} x2={710} y2={320} stroke="var(--hairline)" strokeDasharray="3 3" />
          <text x={395} y={340} textAnchor="middle" fill="var(--brand-hover)" fontSize={12.5} fontWeight={600} fontFamily="var(--font-mono)">
            {endToEnd}
          </text>
        </svg>
      </div>
      <p className="mt-3.5 text-[13.5px] text-text-muted">
        {reason && <span data-testid="latency-placeholder">{reason} </span>}
        {caption}
      </p>
    </div>
  );
}
