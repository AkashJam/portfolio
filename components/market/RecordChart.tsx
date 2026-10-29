import { sectorName, sessionShort } from "@/lib/ledger";
import type { SensorRecord } from "@/lib/market-schemas";
import { RECORD_HEIGHT, RECORD_WIDTH, recordGeometry } from "@/lib/record-path";

const CAPTION = "mt-2 font-mono text-meta leading-relaxed text-text-muted";

/**
 * The company against its sector since the first session they share, both rebased
 * to 100 (Phase 16 step 2, decisions 1 and 2; redrawn by Phase 21 step 4, I42): the
 * gap between the lines is what makes a move unusual. The company is in text ink,
 * the sector muted and dashed, and the lines are told apart by the labels at their
 * ends, not by colour. A dot marks each session that moved unusually, in the colour
 * of its direction. The lines are server-built SVG in a stretched box; the axis
 * labels, end labels and dots are HTML placed by percentage, so a stretched box
 * cannot distort them (the pattern of the city pages' LongChart). No band: each
 * entry's own range is in the ledger.
 */
export function RecordChart({ record }: { record: SensorRecord }) {
  const g = recordGeometry(record);
  const base = record.baseSession;
  if (!g || !base) {
    return (
      <p data-testid="record-chart-empty" className="font-mono text-meta text-text-muted">
        The series is too short to draw: it needs two sessions.
      </p>
    );
  }
  const first = record.series.dates[0];
  const last = record.series.dates[record.series.dates.length - 1];
  const bench = record.benchmark;
  const benchName = bench ? sectorName(bench) : null;
  const label =
    `${record.name}${benchName ? ` and ${benchName}` : ""} since ${sessionShort(first)}, both rebased to 100 on ${sessionShort(base)}. ` +
    `${record.name} ends at ${g.last.sensor.toFixed(1)}` +
    (g.last.benchmark !== null ? `, ${benchName} at ${g.last.benchmark.toFixed(1)}` : "") +
    `. ` +
    (g.dots.length === 0 ? "It has had no unusual moves." : `Unusual moves on ${g.dots.map((d) => sessionShort(d.date)).join(", ")}.`);
  return (
    <figure>
      <div className="relative rounded-[14px] border border-hairline bg-panel py-3 pl-11 pr-20 sm:pr-24">
        <div className="relative">
          <svg
            data-testid="record-chart"
            viewBox={`0 0 ${RECORD_WIDTH} ${RECORD_HEIGHT}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={label}
            className="block h-[240px] w-full"
          >
            {g.yTicks.map((t) => (
              <line
                key={t.label}
                x1={0}
                x2={RECORD_WIDTH}
                y1={(t.pct / 100) * RECORD_HEIGHT}
                y2={(t.pct / 100) * RECORD_HEIGHT}
                vectorEffect="non-scaling-stroke"
                style={{ stroke: t.base ? "var(--text-muted)" : "var(--hairline)", strokeWidth: t.base ? 1.2 : 1 }}
              />
            ))}
            {g.benchmark && (
              <polyline
                points={g.benchmark}
                vectorEffect="non-scaling-stroke"
                style={{ fill: "none", stroke: "var(--text-muted)", strokeWidth: 1.4, strokeDasharray: "2 4", strokeLinecap: "round" }}
              />
            )}
            <polyline
              points={g.sensor}
              vectorEffect="non-scaling-stroke"
              style={{ fill: "none", stroke: "var(--text)", strokeWidth: 1.8, strokeLinejoin: "round" }}
            />
          </svg>
          {g.yTicks.map((t) => (
            <span
              key={t.label}
              aria-hidden="true"
              data-testid="record-ytick"
              className={`absolute -left-10 w-9 -translate-y-1/2 text-right font-mono text-meta ${t.base ? "text-text" : "text-text-muted"}`}
              style={{ top: `${t.pct}%` }}
            >
              {t.label}
            </span>
          ))}
          {g.dots.map((d) => (
            <i
              key={d.date}
              aria-hidden="true"
              data-testid="record-dot"
              data-direction={d.direction}
              className="absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-panel"
              style={{ left: `${d.xPct}%`, top: `${d.yPct}%`, background: `var(--market-${d.direction})` }}
            />
          ))}
          <span
            aria-hidden="true"
            data-testid="record-end-sensor"
            className="absolute left-full ml-2 -translate-y-1/2 whitespace-nowrap font-mono text-meta font-semibold text-text"
            style={{ top: `${g.ends.sensor.yPct}%` }}
          >
            {record.symbol} {g.ends.sensor.value.toFixed(1)}
          </span>
          {bench && g.ends.benchmark && (
            <span
              aria-hidden="true"
              data-testid="record-end-benchmark"
              className="absolute left-full ml-2 -translate-y-1/2 whitespace-nowrap font-mono text-meta text-text-muted"
              style={{ top: `${g.ends.benchmark.yPct}%` }}
            >
              {bench} {g.ends.benchmark.value.toFixed(1)}
            </span>
          )}
        </div>
        <div aria-hidden="true" className="relative mt-1.5 h-4">
          {g.xTicks.map((t) => (
            <span key={`${t.label}-${t.pct}`} data-testid="record-xtick" className="absolute font-mono text-meta text-text-muted" style={{ left: `${t.pct}%` }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <figcaption className={CAPTION}>
        {bench ? "Both start" : "It starts"} at 100 on {sessionShort(base)}: each close divided by that day&rsquo;s close.{" "}
        {g.sessions} sessions to {sessionShort(last)}. A dot is a session that moved unusually.
      </figcaption>
    </figure>
  );
}
