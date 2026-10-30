import { CHANGE_LEFT, CHANGE_RIGHT, CHG_H, CHG_W, changeGeometry } from "@/lib/city-change";
import { changeReading } from "@/lib/city-reading";
import type { ChangeBlock as Block } from "@/lib/market-schemas";

const MUTED = "text-meta leading-relaxed text-text-muted";

/**
 * *How it has changed since 2014* (Phase 22 step 4, M22; mockups/site-review/atlas-city-milan.html):
 * the survey's own figure against consumer prices and average spending per person, each 100 in
 * the first year the survey was published on one method. Rates of change only, never a level, so
 * it reads the way /atlas does. A city with a single edition has no block, and says so in a line.
 */
export function ChangeBlock({
  block,
  city,
  country,
  kindLabel,
  average = false,
}: {
  block: Block | null;
  /** The place the figure is for: the survey's area where it has one, else the city. */
  city: string;
  country: string;
  /** The kind, short and capitalised: "Poverty line". */
  kindLabel: string;
  /** The survey is itself average spending, so the spending line is named as the national figure. */
  average?: boolean;
}) {
  if (!block) {
    return (
      <p data-testid="no-change" className="mt-7 max-w-measure text-small text-text-muted">
        No earlier edition of this {kindLabel.toLowerCase()} is on file on the same method, so there is no change since an earlier year to show.
      </p>
    );
  }
  const g = changeGeometry(block, kindLabel, city, country, average);
  return (
    <div data-testid="change-block" className="mt-7 rounded-[14px] border border-hairline bg-panel px-4 pb-3 pt-5 sm:px-5">
      <h3 className="text-body font-medium text-text">How it has changed since {block.baseYear}</h3>
      <p data-testid="change-reading" className="mt-1.5 max-w-measure text-small text-read">
        {changeReading(block, city, country, kindLabel, average)}
      </p>
      {/* The drawing keeps its size below the measure and scrolls sideways, so the region is focusable for a keyboard (axe: scrollable-region-focusable). */}
      <div role="region" aria-label={`${kindLabel} since ${block.baseYear}, chart`} tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-hover">
        <svg viewBox={`0 0 ${CHG_W} ${CHG_H}`} role="img" aria-label={g.alt} className="mt-3 block h-auto w-full min-w-[520px]">
          {g.yTicks.map((t) => (
            <g key={t.label}>
              <line
                x1={CHANGE_LEFT}
                x2={CHANGE_RIGHT}
                y1={t.y}
                y2={t.y}
                style={{ stroke: t.base ? "color-mix(in oklab, var(--text) 22%, transparent)" : "var(--hairline)", strokeDasharray: t.base ? "2 3" : undefined }}
              />
              <text x={CHANGE_LEFT - 8} y={t.y + 4} textAnchor="end" className="fill-text-muted font-mono text-[12px]">
                {t.label}
              </text>
            </g>
          ))}
          {g.xTicks.map((t) => (
            <text key={t.label} x={t.x} y={272} textAnchor="middle" className="fill-text-muted font-mono text-[12px]">
              {t.label}
            </text>
          ))}
          <polyline points={g.lines.prices} style={{ fill: "none", stroke: "var(--text-muted)", strokeWidth: 1.4, strokeDasharray: "5 4", strokeLinejoin: "round" }} />
          <polyline points={g.lines.spending} style={{ fill: "none", stroke: "var(--text)", strokeWidth: 1.6, strokeLinejoin: "round" }} />
          <polyline points={g.lines.survey} style={{ fill: "none", stroke: "var(--brand-hover)", strokeWidth: 2.2, strokeLinejoin: "round" }} />
          {g.ends.map((e) => (
            <g key={e.key} data-end={e.key}>
              {e.key !== "prices" && <circle cx={e.x} cy={e.y} r={3.5} style={{ fill: e.key === "survey" ? "var(--brand-hover)" : "var(--text)" }} />}
              <text x={e.x + 14} y={e.labelY} className="font-sans text-[13px] font-medium" style={{ fill: e.key === "survey" ? "var(--brand-hover)" : e.key === "prices" ? "var(--text-muted)" : "var(--text)" }}>
                {e.name}
              </text>
              <text x={e.x + 14} y={e.labelY + 15} className="fill-text-muted font-mono text-[12px]">
                {e.rise}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p className={`${MUTED} mt-2 max-w-measure`}>
        Each line is 100 in {block.baseYear}. {block.note}
        {average && ` The line marked National is household spending per person across ${country}, not ${city}'s.`}
      </p>
    </div>
  );
}
