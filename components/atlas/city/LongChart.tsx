import { CITY_H, CITY_W, cityAlt, cityGeometry, type Scale } from "@/lib/city-path";
import type { CityChart } from "@/lib/market-schemas";

const MUTED = "text-meta leading-relaxed text-text-muted";

/**
 * One long series on a city page (Phase 16 step 4; Phase 22 step 4, I57). The line is
 * server-built SVG; the axis labels are HTML placed by percentage so a stretched box
 * cannot distort them. A one-line reading sits under the title; the source, the base
 * and the scale are behind "How this is calculated". The text alternative gives the
 * first, peak, lowest and last values. A series the ticker cannot serve says why in
 * place of the chart.
 */
export function LongChart({
  id,
  title,
  chart,
  scale,
  unit,
  reading,
}: {
  id: string;
  title: string;
  chart: CityChart;
  scale: Scale;
  /** What the values are in, for the text alternative: `index, 2015 = 100`. */
  unit: string;
  /** The one-line reading under the title (lib/city-reading.ts). */
  reading: string | null;
}) {
  const g = chart.series ? cityGeometry(chart.series, scale) : null;
  return (
    <section aria-labelledby={`${id}-h`} data-testid={`chart-${id}`}>
      <h3 id={`${id}-h`} className="text-body font-medium text-text">
        {title}
      </h3>
      {g && reading && (
        <p data-testid={`chart-${id}-reading`} className="mt-1 max-w-measure text-small text-read">
          {reading}
        </p>
      )}
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
                <path d={g.area} style={{ fill: "var(--read)", fillOpacity: 0.06 }} />
                <polyline
                  points={g.line}
                  vectorEffect="non-scaling-stroke"
                  style={{ fill: "none", stroke: "var(--read)", strokeWidth: 1.6, strokeLinejoin: "round" }}
                />
              </svg>
              {g.yTicks.map((t) => (
                <span key={t.label} aria-hidden="true" className="absolute -left-11 w-10 -translate-y-1/2 text-right font-mono text-meta text-text-muted" style={{ top: `${t.pct}%` }}>
                  {t.label}
                </span>
              ))}
            </div>
            <div aria-hidden="true" className="relative mt-1 h-4">
              {g.xTicks.map((t) => (
                <span key={t.label} className="absolute -translate-x-1/2 font-mono text-meta text-text-muted" style={{ left: `${t.pct}%` }}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </figure>
      ) : (
        <p data-testid={`chart-${id}-absent`} className={`${MUTED} mt-3 rounded-[14px] border border-dashed border-hairline px-4 py-5`}>
          {`Not shown: ${chart.reason ?? "the series cannot be served"}.`}
        </p>
      )}
    </section>
  );
}
