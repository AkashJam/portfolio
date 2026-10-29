import Link from "next/link";

import type { ColumnKey } from "@/lib/atlas";
import { spendingName } from "@/lib/atlas-labels";
import { PLOT, PLOT_PHONE, type Geometry, type Measure, type PlotModel, measureOf } from "@/lib/atlas-plot";
import { cn } from "@/lib/utils";

/**
 * The /atlas scatter (Phase 11 step 2; mockups/site-review/atlas.html). Hand-drawn
 * SVG so the geometry is in the server HTML (Recharts cannot do that, portfolio.md
 * §16.1). All placement is decided in lib/atlas-plot.ts. Two drawings, one per
 * screen (phase18.md I50): the desktop one, and a 360-unit phone one with its own
 * layout, so nothing scrolls sideways; CSS picks, so the server render needs no
 * media query.
 */
export interface ScatterProps {
  desktop: PlotModel;
  phone: PlotModel;
  xKey: ColumnKey;
  yKey: ColumnKey;
  targetSlug: string | null;
  windowLabel: string;
  /** The home city: its dot is highlighted and crosshairs run through it. Nothing else on the plot moves. */
  homeSlug?: string | null;
  /** The question's reading pair (slugs): highlighted, the rest muted (I55). Empty for a built comparison. */
  highlight?: string[];
  /** When spending is shown in the home currency: its code and tick format (the values are already converted). */
  spending?: { code: string; tick: (v: number) => string };
}

export function Scatter(props: ScatterProps) {
  return (
    <>
      <ScatterSvg {...props} model={props.desktop} g={PLOT} className="hidden md:block" />
      <ScatterSvg {...props} model={props.phone} g={PLOT_PHONE} className="md:hidden" isPhone />
    </>
  );
}

function ScatterSvg({
  model,
  g,
  isPhone = false,
  className,
  xKey,
  yKey,
  targetSlug,
  windowLabel,
  homeSlug = null,
  highlight = [],
  spending,
}: ScatterProps & { model: PlotModel; g: Geometry; isPhone?: boolean; className: string }) {
  const shown = (m: Measure): Measure =>
    m.key === "everydaySpendingEur" && spending
      ? { ...m, tick: spending.tick, option: spendingName(spending.code), title: spendingName(spending.code) }
      : m;
  const xm = shown(measureOf(xKey));
  const ym = shown(measureOf(yKey));
  const home = homeSlug ? (model.points.find((p) => p.slug === homeSlug) ?? null) : null;
  const { xDomain, yDomain } = model;
  const px = (v: number) => g.left + ((v - xDomain.min) / (xDomain.max - xDomain.min)) * (g.right - g.left);
  const py = (v: number) => g.bottom + ((v - yDomain.min) / (yDomain.max - yDomain.min)) * (g.top - g.bottom);
  const suffix = xm.kind === "change" || ym.kind === "change" ? ` (change ${windowLabel})` : "";
  const label = `${xm.option} against ${ym.option}${suffix}, ${model.points.length} countries.`;
  const text = isPhone ? "text-[11px]" : "text-meta";
  const midX = (g.left + g.right) / 2;
  const midY = (g.top + g.bottom) / 2;
  const axisTitleY = isPhone ? g.height - 6 : g.height - 12;

  return (
    <svg
      viewBox={`0 0 ${g.width} ${g.height}`}
      role="img"
      aria-label={label}
      data-drawing={isPhone ? "phone" : "desktop"}
      className={cn("atlas-scatter block h-auto w-full", className)}
    >
      {xDomain.ticks.map((t) => (
        <line key={`gx${t}`} x1={px(t)} y1={g.top} x2={px(t)} y2={g.bottom} className="stroke-hairline" />
      ))}
      {yDomain.ticks.map((t) => (
        <line key={`gy${t}`} x1={g.left} y1={py(t)} x2={g.right} y2={py(t)} className="stroke-hairline" />
      ))}

      {model.zeroX !== null && (
        <line x1={model.zeroX} y1={g.top} x2={model.zeroX} y2={g.bottom} className="stroke-text-faint" strokeDasharray="5 4" />
      )}
      {model.zeroY !== null && (
        <>
          <line x1={g.left} y1={model.zeroY} x2={g.right} y2={model.zeroY} className="stroke-text-faint" strokeDasharray="5 4" />
          {ym.zeroLabel && (
            <text x={g.right - 4} y={model.zeroY - 6} textAnchor="end" className={cn("fill-text-muted font-mono", text)}>
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
          <text x={model.diagonal.x2 - 6} y={model.diagonal.y2 + 16} textAnchor="end" className={cn("fill-text-muted font-mono", text)}>
            kept pace with prices
          </text>
        </>
      )}

      <line x1={g.left} y1={g.top} x2={g.left} y2={g.bottom} className="stroke-hairline" strokeWidth={1.5} />
      <line x1={g.left} y1={g.bottom} x2={g.right} y2={g.bottom} className="stroke-hairline" strokeWidth={1.5} />

      {yDomain.ticks.map((t) => (
        <text key={`ty${t}`} x={g.left - (isPhone ? 6 : 10)} y={py(t) + 4} textAnchor="end" className={cn("fill-text-muted font-mono", text)}>
          {ym.tick(t)}
        </text>
      ))}
      {xDomain.ticks.map((t) => (
        <text
          key={`tx${t}`}
          x={px(t)}
          y={g.bottom + 20}
          textAnchor={isPhone && px(t) > g.right - 8 ? "end" : "middle"}
          className={cn("fill-text-muted font-mono", text)}
        >
          {xm.tick(t)}
        </text>
      ))}
      <text
        x={midX}
        y={axisTitleY}
        textAnchor="middle"
        className={cn("fill-text-muted font-semibold uppercase tracking-[0.1em]", isPhone ? "text-[10px]" : "text-meta tracking-[0.14em]")}
      >
        {isPhone ? xm.option : xm.title}
      </text>
      <text
        x={isPhone ? 11 : 15}
        y={midY}
        textAnchor="middle"
        transform={`rotate(-90 ${isPhone ? 11 : 15} ${midY})`}
        className={cn("fill-text-muted font-semibold uppercase tracking-[0.1em]", isPhone ? "text-[10px]" : "text-meta tracking-[0.14em]")}
      >
        {isPhone ? ym.option : ym.title}
      </text>

      {home && (
        <g data-testid="home-crosshairs" data-home={home.slug} aria-hidden="true">
          <line x1={home.cx} y1={g.top} x2={home.cx} y2={g.bottom} className="stroke-brand-hover" strokeDasharray="2 4" strokeWidth={1.25} />
          <line x1={g.left} y1={home.cy} x2={g.right} y2={home.cy} className="stroke-brand-hover" strokeDasharray="2 4" strokeWidth={1.25} />
        </g>
      )}

      {model.points.map((p) => {
        const target = p.slug === targetSlug;
        const isHome = p.slug === homeSlug;
        const picked = highlight.includes(p.slug);
        const muted = highlight.length > 0 && !picked && !target && !isHome;
        const readout = `${p.city}: ${xm.tick(p.x)} · ${ym.tick(p.y)}${p.clip ? " (off the axis)" : ""}`;
        const tipW = readout.length * g.charW + 14;
        const tipRight = p.cx + 12 + tipW > g.width - 4;
        const tipX = tipRight ? p.cx - 12 - tipW : p.cx + 12;
        const tipY = p.cy < g.top + 34 ? p.cy + 12 : p.cy - 34;
        const dot = (
          <>
            <circle
              cx={p.cx}
              cy={p.cy}
              r={target ? 8 : isHome || picked ? 7 : 5.5}
              className={cn(
                target || isHome || picked
                  ? "fill-brand-hover stroke-text"
                  : "fill-text-faint stroke-canvas hover:fill-read",
                muted && "opacity-60",
                // A label suppressed for collision: the point sits in a crowded
                // region, so it is drawn a little back. A rule driven by the
                // collision, not a hand-edited radius; nothing is encoded, so no legend.
                "data-[q=true]:opacity-[.72]",
              )}
              strokeWidth={target || isHome || picked ? 2.5 : 1.5}
              data-q={p.label ? undefined : "true"}
            />
            {p.label && (
              <text
                x={p.label.x}
                y={p.label.y}
                textAnchor={p.label.anchor}
                className={cn(text, "font-sans", muted ? "fill-text-muted" : "fill-read")}
              >
                {p.label.text}
              </text>
            )}
            <g className="atlas-tip" aria-hidden="true">
              <rect x={tipX} y={tipY} width={tipW} height={22} rx={4} className="fill-panel-2 stroke-hairline" />
              <text x={tipX + 7} y={tipY + 15} className={cn("fill-text font-mono", isPhone ? "text-[10px]" : "text-meta")}>
                {readout}
              </text>
            </g>
          </>
        );
        return (
          <g
            key={p.slug}
            data-slug={p.slug}
            data-target={target || undefined}
            data-home={isHome || undefined}
            data-picked={picked || undefined}
            data-clipped={p.clip ? p.clip.map((c) => c.axis).join(" ") : undefined}
            className="atlas-dot"
          >
            {p.hasCityPage ? (
              <Link href={`/atlas/${p.slug}`} aria-label={`${readout}. Open the ${p.city} page.`}>
                {dot}
              </Link>
            ) : (
              <g tabIndex={0} role="img" aria-label={readout}>
                {dot}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
