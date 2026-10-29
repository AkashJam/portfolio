import { spendingName } from "@/lib/atlas-labels";
import { cn } from "@/lib/utils";
import { PLOT, type Measure, type PlotModel, measureOf } from "@/lib/atlas-plot";
import type { ColumnKey } from "@/lib/atlas";

/**
 * The /atlas scatter (Phase 11 step 2; mockups/atlas-v1/atlas.html #compare).
 * Hand-drawn SVG so the geometry is in the server HTML (Recharts cannot do
 * that, portfolio.md §16.1). All placement is decided in lib/atlas-plot.ts.
 */
export function Scatter({
  model,
  xKey,
  yKey,
  targetSlug,
  windowLabel,
  homeSlug = null,
  spending,
}: {
  model: PlotModel;
  xKey: ColumnKey;
  yKey: ColumnKey;
  targetSlug: string | null;
  windowLabel: string;
  /** The home city: its dot is highlighted and crosshairs run through it. Nothing else on the plot moves. */
  homeSlug?: string | null;
  /** When spending is shown in the home currency: its code and tick format (the values are already converted). */
  spending?: { code: string; tick: (v: number) => string };
}) {
  const shown = (m: Measure): Measure =>
    m.key === "everydaySpendingEur" && spending
      ? {
          ...m,
          tick: spending.tick,
          option: spendingName(spending.code),
          title: spendingName(spending.code),
        }
      : m;
  const xm = shown(measureOf(xKey));
  const ym = shown(measureOf(yKey));
  const home = homeSlug ? (model.points.find((p) => p.slug === homeSlug) ?? null) : null;
  const { xDomain, yDomain } = model;
  const px = (v: number) =>
    PLOT.left +
    ((v - xDomain.min) / (xDomain.max - xDomain.min)) *
      (PLOT.right - PLOT.left);
  const py = (v: number) =>
    PLOT.bottom +
    ((v - yDomain.min) / (yDomain.max - yDomain.min)) *
      (PLOT.top - PLOT.bottom);
  const suffix =
    xm.kind === "change" || ym.kind === "change"
      ? ` (change ${windowLabel})`
      : "";
  const label = `${xm.option} against ${ym.option}${suffix}, ${model.points.length} countries.`;

  return (
    <svg
      viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
      role="img"
      aria-label={label}
      className="block h-auto w-full"
    >
      {xDomain.ticks.map((t) => (
        <line
          key={`gx${t}`}
          x1={px(t)}
          y1={PLOT.top}
          x2={px(t)}
          y2={PLOT.bottom}
          className="stroke-hairline"
        />
      ))}
      {yDomain.ticks.map((t) => (
        <line
          key={`gy${t}`}
          x1={PLOT.left}
          y1={py(t)}
          x2={PLOT.right}
          y2={py(t)}
          className="stroke-hairline"
        />
      ))}

      {model.zeroX !== null && (
        <line
          x1={model.zeroX}
          y1={PLOT.top}
          x2={model.zeroX}
          y2={PLOT.bottom}
          className="stroke-text-faint"
          strokeDasharray="5 4"
        />
      )}
      {model.zeroY !== null && (
        <>
          <line
            x1={PLOT.left}
            y1={model.zeroY}
            x2={PLOT.right}
            y2={model.zeroY}
            className="stroke-text-faint"
            strokeDasharray="5 4"
          />
          {ym.zeroLabel && (
            <text
              x={PLOT.right - 4}
              y={model.zeroY - 6}
              textAnchor="end"
              className="fill-text-muted font-mono text-meta"
            >
              {ym.zeroLabel}
            </text>
          )}
        </>
      )}
      {model.diagonal && (
        <>
          <line
            x1={model.diagonal.x1}
            y1={model.diagonal.y1}
            x2={model.diagonal.x2}
            y2={model.diagonal.y2}
            className="stroke-brand-hover"
            strokeDasharray="5 4"
            strokeWidth={1.25}
          />
          <text
            x={model.diagonal.x2 - 6}
            y={model.diagonal.y2 + 16}
            textAnchor="end"
            className="fill-text-muted font-mono text-meta"
          >
            kept pace with prices
          </text>
        </>
      )}

      <line
        x1={PLOT.left}
        y1={PLOT.top}
        x2={PLOT.left}
        y2={PLOT.bottom}
        className="stroke-hairline"
        strokeWidth={1.5}
      />
      <line
        x1={PLOT.left}
        y1={PLOT.bottom}
        x2={PLOT.right}
        y2={PLOT.bottom}
        className="stroke-hairline"
        strokeWidth={1.5}
      />

      {yDomain.ticks.map((t) => (
        <text
          key={`ty${t}`}
          x={PLOT.left - 10}
          y={py(t) + 4}
          textAnchor="end"
          className="fill-text-muted font-mono text-meta"
        >
          {ym.tick(t)}
        </text>
      ))}
      {xDomain.ticks.map((t) => (
        <text
          key={`tx${t}`}
          x={px(t)}
          y={PLOT.bottom + 20}
          textAnchor="middle"
          className="fill-text-muted font-mono text-meta"
        >
          {xm.tick(t)}
        </text>
      ))}
      <text
        x={(PLOT.left + PLOT.right) / 2}
        y={PLOT.height - 12}
        textAnchor="middle"
        className="fill-text-muted text-meta font-semibold uppercase tracking-[0.14em]"
      >
        {xm.title}
      </text>
      <text
        x={15}
        y={(PLOT.top + PLOT.bottom) / 2}
        textAnchor="middle"
        transform={`rotate(-90 15 ${(PLOT.top + PLOT.bottom) / 2})`}
        className="fill-text-muted text-meta font-semibold uppercase tracking-[0.14em]"
      >
        {ym.title}
      </text>

      {home && (
        <g data-testid="home-crosshairs" data-home={home.slug} aria-hidden="true">
          <line x1={home.cx} y1={PLOT.top} x2={home.cx} y2={PLOT.bottom} className="stroke-brand-hover" strokeDasharray="2 4" strokeWidth={1.25} />
          <line x1={PLOT.left} y1={home.cy} x2={PLOT.right} y2={home.cy} className="stroke-brand-hover" strokeDasharray="2 4" strokeWidth={1.25} />
        </g>
      )}

      {model.points.map((p) => {
        const target = p.slug === targetSlug;
        const isHome = p.slug === homeSlug;
        return (
          <g
            key={p.slug}
            data-slug={p.slug}
            data-target={target || undefined}
            data-home={isHome || undefined}
            data-clipped={
              p.clip ? p.clip.map((c) => c.axis).join(" ") : undefined
            }
          >
            <circle
              cx={p.cx}
              cy={p.cy}
              r={target ? 8 : isHome ? 7 : 5.5}
              className={cn(
                target || isHome
                  ? "fill-brand-hover stroke-text"
                  : "fill-text-faint stroke-canvas hover:fill-read",
                // A label suppressed for collision: the point sits in a crowded
                // region, so it is drawn a little back. A rule driven by the
                // collision, not a hand-edited radius; nothing is encoded, so no legend.
                "data-[q=true]:opacity-[.72]",
              )}
              strokeWidth={target || isHome ? 2.5 : 1.5}
              // A point whose label was suppressed for collision (step 9 styles it).
              data-q={p.label ? undefined : "true"}
            >
              <title>
                {p.clip
                  ? `${p.city}: ${p.clip.map((c) => (c.axis === "x" ? xm : ym).tick(c.value)).join(" \u00b7 ")} (off the axis)`
                  : p.city}
              </title>
            </circle>
            {p.label && (
              <text
                x={p.label.x}
                y={p.label.y}
                textAnchor={p.label.anchor}
                className="fill-read font-sans text-meta"
              >
                {p.label.text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
