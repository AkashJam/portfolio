import { CITY_H, CITY_W, cityAlt, cityGeometry, type Scale } from "@/lib/city-path";
import type { CityChart } from "@/lib/market-schemas";

const MUTED = "font-mono text-[12px] leading-relaxed text-text-muted";

/**
 * One long series on a city page (Phase 16 step 4). The line is server-built SVG;
 * the axis labels are HTML placed by percentage so a stretched box cannot distort
 * them. The scale is stated under the chart, and the text alternative gives the
 * first, peak, lowest and last values. A series the ticker cannot serve says why
 * in place of the chart.
 */
export function LongChart({
  id,
  title,
  chart,
  scale,
  unit,
  caption,
  note,
}: {
  id: string;
  title: string;
  chart: CityChart;
  scale: Scale;
  /** What the values are in: `index, 2015 = 100`. */
  unit: string;
  caption: string;
  note?: string | null;
}) {
  const g = chart.series ? cityGeometry(chart.series, scale) : null;
  return (
    <section aria-labelledby={`${id}-h`} data-testid={`chart-${id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={`${id}-h`} className="text-[15px] font-medium text-text">
          {title}
        </h3>
        <span className={MUTED}>
          {chart.source} · latest {chart.asOf}
        </span>
      </div>
      {g ? (
        <figure className="mt-3">
          <div className="relative rounded-[14px] border border-hairline bg-panel py-2 pl-12 pr-4">
            <div className="relative">
              <svg
                viewBox={`0 0 ${CITY_W} ${CITY_H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={cityAlt(title, unit, g)}
                data-scale={g.scale}
                className="block h-[220px] w-full"
              >
                {g.yTicks.map((t) => (
                  <line key={t.label} x1={0} x2={CITY_W} y1={(t.pct / 100) * CITY_H} y2={(t.pct / 100) * CITY_H} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--hairline)", strokeWidth: 1 }} />
                ))}
                <path d={g.area} style={{ fill: "var(--brand)", fillOpacity: 0.08 }} />
                <polyline
                  points={g.line}
                  vectorEffect="non-scaling-stroke"
                  style={{ fill: "none", stroke: "var(--brand-hover)", strokeWidth: 1.6, strokeLinejoin: "round" }}
                />
              </svg>
              {g.yTicks.map((t) => (
                <span key={t.label} aria-hidden="true" className="absolute -left-11 w-10 -translate-y-1/2 text-right font-mono text-[11px] text-text-muted" style={{ top: `${t.pct}%` }}>
                  {t.label}
                </span>
              ))}
            </div>
            <div aria-hidden="true" className="relative mt-1 h-4">
              {g.xTicks.map((t) => (
                <span key={t.label} className="absolute -translate-x-1/2 font-mono text-[11px] text-text-muted" style={{ left: `${t.pct}%` }}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          <figcaption className={`${MUTED} mt-2`}>
            {caption} · {g.scale === "log" ? "logarithmic scale: equal distance is equal percentage change" : "linear scale"}
          </figcaption>
        </figure>
      ) : (
        <p data-testid={`chart-${id}-absent`} className={`${MUTED} mt-3 rounded-[14px] border border-dashed border-hairline px-4 py-5`}>
          {`Not shown: ${chart.reason ?? "the series cannot be served"}.`}
        </p>
      )}
      {note && <p className={`${MUTED} mt-1`}>{note}</p>}
    </section>
  );
}
