import { cn } from "@/lib/utils";
import { PLOT, type PlotModel, measureOf } from "@/lib/atlas-plot";
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
}: {
  model: PlotModel;
  xKey: ColumnKey;
  yKey: ColumnKey;
  targetSlug: string | null;
  windowLabel: string;
}) {
  const xm = measureOf(xKey);
  const ym = measureOf(yKey);
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
              className="fill-text-muted font-mono text-[10.5px]"
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
            className="fill-text-muted font-mono text-[10.5px]"
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
          className="fill-text-muted font-mono text-[11px]"
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
          className="fill-text-muted font-mono text-[11px]"
        >
          {xm.tick(t)}
        </text>
      ))}
      <text
        x={(PLOT.left + PLOT.right) / 2}
        y={PLOT.height - 12}
        textAnchor="middle"
        className="fill-text-muted font-mono text-[11px] font-semibold uppercase tracking-[0.14em]"
      >
        {xm.title}
      </text>
      <text
        x={15}
        y={(PLOT.top + PLOT.bottom) / 2}
        textAnchor="middle"
        transform={`rotate(-90 15 ${(PLOT.top + PLOT.bottom) / 2})`}
        className="fill-text-muted font-mono text-[11px] font-semibold uppercase tracking-[0.14em]"
      >
        {ym.title}
      </text>

      {model.points.map((p) => {
        const target = p.slug === targetSlug;
        return (
          <g
            key={p.slug}
            data-slug={p.slug}
            data-target={target || undefined}
            data-clipped={
              p.clip ? p.clip.map((c) => c.axis).join(" ") : undefined
            }
          >
            <circle
              cx={p.cx}
              cy={p.cy}
              r={target ? 8 : 5.5}
              className={cn(
                target
                  ? "fill-brand-hover stroke-text"
                  : "fill-brand stroke-canvas",
                // A label suppressed for collision: the point sits in a crowded
                // region, so it is drawn a little back. A rule driven by the
                // collision, not a hand-edited radius; nothing is encoded, so no legend.
                "data-[q=true]:opacity-[.72]",
              )}
              strokeWidth={target ? 2.5 : 1.5}
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
                className="fill-read font-sans text-[12.5px]"
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
