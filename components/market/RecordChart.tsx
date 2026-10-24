import { sessionShort } from "@/lib/ledger";
import type { SensorRecord } from "@/lib/market-schemas";
import { RECORD_HEIGHT, RECORD_WIDTH, recordGeometry } from "@/lib/record-path";

/**
 * The sensor against its benchmark since the first session they share, both rebased to
 * 100 (Phase 16 step 2, decisions 1 and 2): the gap between the lines is what the
 * trigger measures. The rebase is stated beside the chart with its base date, and the
 * figures it divides are in the record. A dot marks each session that tripped. No band:
 * sigma differs per event, and each event's own band is in the ledger. Plain SVG in a
 * fixed box, in the server HTML (§17).
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
  const label =
    `${record.symbol}${bench ? ` and ${bench}` : ""}, daily closes from ${sessionShort(first)} to ${sessionShort(last)}, ` +
    `both at 100 on ${sessionShort(base)}. ${record.symbol} ends at ${g.last.sensor.toFixed(1)}` +
    (g.last.benchmark !== null ? `, ${bench} at ${g.last.benchmark.toFixed(1)}` : "") +
    `. ` +
    (g.dots.length === 0 ? "It has not tripped." : `Tripped on ${g.dots.map((d) => sessionShort(d.date)).join(", ")}.`);
  return (
    <figure>
      <svg
        data-testid="record-chart"
        viewBox={`0 0 ${RECORD_WIDTH} ${RECORD_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="block h-[240px] w-full rounded-[14px] border border-hairline bg-panel"
      >
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
          style={{ fill: "none", stroke: "var(--read)", strokeWidth: 1.8, strokeLinejoin: "round" }}
        />
        {g.dots.map((d) => (
          <circle key={d.date} data-testid="record-dot" cx={d.x} cy={d.y} r={5} style={{ fill: "var(--brand-hover)" }} />
        ))}
      </svg>
      <figcaption className="mt-2 font-mono text-meta leading-relaxed text-text-muted">
        solid: {record.symbol}
        {bench ? ` · dotted: ${bench}` : ""} · {bench ? "both " : ""}at 100 on {sessionShort(base)}, each close divided by the
        close that day · {g.sessions} sessions to {sessionShort(last)} · a dot is a session that tripped
      </figcaption>
    </figure>
  );
}
