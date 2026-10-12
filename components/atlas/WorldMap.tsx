"use client";

import { useAtlasWindow } from "@/components/atlas/AtlasWindow";
import { columnValue, formatChange, windowLabel } from "@/lib/atlas";
import {
  MEASURE_NAME,
  NO_FIGURE,
  NO_ROW,
  TILE,
  TILES,
  caveatKind,
  colourFor,
  exceptionsLine,
  figureOf,
  legendStops,
  limitFor,
  linkName,
  textColourFor,
  type MapMeasure,
} from "@/lib/atlas-map";
import type { AtlasRow } from "@/lib/market-schemas";
import geometry from "@/data/atlas-map.json";

/**
 * The Where and when map (Phase 11 step 5; mockups/atlas-v1/atlas.html #map).
 * Every country colour is the change over the shared window for one measure,
 * on a scale set by the data in view (lib/atlas-map.ts). The real world map at
 * 768px and up, equal tiles below; each country links to its table row. Step 6
 * adds the measure and period controls, so `measure` is housing until then.
 */

const MAP = geometry as unknown as {
  viewBox: [number, number];
  outline: string;
  countries: Record<string, string>;
};

/** The heading's hint, which has to follow the window. */
export function MapHint({ measure = "housing" }: { measure?: MapMeasure }) {
  const { window, end } = useAtlasWindow();
  return (
    <span className="text-sm text-text-muted">
      {MEASURE_NAME[measure]} {"·"} change {windowLabel(window, end)}
    </span>
  );
}

const linkRing =
  "group outline-none [&_.shape]:group-hover:stroke-text [&_.shape]:group-focus-visible:stroke-text [&_.shape]:group-focus-visible:[stroke-width:2]";

export function WorldMap({
  rows,
  measure = "housing",
}: {
  rows: AtlasRow[];
  measure?: MapMeasure;
}) {
  const { window, end } = useAtlasWindow();
  const values = rows
    .map((r) => columnValue(r, measure, window))
    .filter((v): v is number => v !== null);
  const limit = limitFor(values);
  const stops = legendStops(limit);
  const exceptions = exceptionsLine(rows, measure, window);

  const countries = rows
    .filter((r) => MAP.countries[r.code] && TILES[r.code])
    .map((r) => {
      const v = columnValue(r, measure, window);
      const fill = v === null ? NO_FIGURE : colourFor(v, limit);
      return {
        row: r,
        fill,
        name: linkName(r, measure, window, end),
        figure: figureOf(r, measure, window),
        star: caveatKind(r, measure, window) === "derived",
      };
    });

  const anyNoFigure = countries.some((c) => c.figure === null);
  const [w, h] = MAP.viewBox;
  const groupLabel = `${MEASURE_NAME[measure]}, change ${windowLabel(window, end)}, by country`;

  return (
    <div className="panel-elevated rounded-2xl p-5">
      <div className="mb-3 flex flex-wrap items-center gap-0.5 font-mono text-[11px] text-text-muted">
        <span className="mx-2">
          {"−"}
          {formatChange(limit).slice(1)} or less
        </span>
        {stops.map((s) => (
          <i
            key={s.value}
            aria-hidden="true"
            className="inline-block h-[9px] w-[18px]"
            style={{ background: s.fill }}
          />
        ))}
        <span className="mx-2">{formatChange(limit)} or more</span>
        <span className="ml-3 inline-flex items-center max-md:hidden">
          <i
            aria-hidden="true"
            className="mr-1.5 inline-block h-[9px] w-3 border border-hairline"
            style={{ background: NO_ROW }}
          />
          no atlas row
        </span>
        {anyNoFigure && (
          <span className="ml-3 inline-flex items-center">
            <i
              aria-hidden="true"
              className="mr-1.5 inline-block h-[9px] w-3"
              style={{ background: NO_FIGURE }}
            />
            no figure
          </span>
        )}
      </div>
      {exceptions && (
        <p className="mb-3 text-xs text-text-muted">{exceptions}</p>
      )}

      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="group"
        aria-label={groupLabel}
        className="hidden h-auto w-full md:block"
      >
        <path
          d={MAP.outline}
          fill={NO_ROW}
          className="stroke-canvas"
          strokeWidth={0.5}
        />
        {countries.map(({ row, fill, name }) => (
          <a
            key={row.slug}
            href={`#${row.slug}`}
            aria-label={name}
            className={linkRing}
          >
            <title>{name}</title>
            <path
              d={MAP.countries[row.code]}
              fill={fill}
              className="shape stroke-canvas"
              strokeWidth={0.6}
            />
          </a>
        ))}
      </svg>

      <svg
        viewBox={`0 0 ${TILE.cols * TILE.pitch} ${TILE.rows * TILE.pitch}`}
        role="group"
        aria-label={`${groupLabel}, as equal tiles`}
        className="mx-auto h-auto w-full max-w-[352px] md:hidden"
      >
        {countries.map(({ row, fill, name, figure, star }) => {
          const [col, rw] = TILES[row.code];
          const x = col * TILE.pitch + 1;
          const y = rw * TILE.pitch + 1;
          const ink = textColourFor(fill);
          return (
            <a
              key={row.slug}
              href={`#${row.slug}`}
              aria-label={name}
              className={linkRing}
            >
              <title>{name}</title>
              <rect
                x={x}
                y={y}
                width={TILE.size}
                height={TILE.size}
                rx={6}
                fill={fill}
                className="shape stroke-transparent"
                strokeWidth={1}
              />
              <text
                x={x + TILE.size / 2}
                y={y + 17}
                textAnchor="middle"
                fill={ink}
                className="font-mono text-[11px] font-semibold"
              >
                {row.code}
                {star ? "*" : ""}
              </text>
              <text
                x={x + TILE.size / 2}
                y={y + 32}
                textAnchor="middle"
                fill={ink}
                className="font-mono text-[11px]"
              >
                {figure ?? "—"}
              </text>
            </a>
          );
        })}
      </svg>

      <p className="mt-4 border-t border-hairline pt-4 text-[13px] leading-relaxed text-text-muted">
        Each colour is{" "}
        <b className="font-medium text-read">the change over the window</b>,
        from that country{"’"}s own published series, on a scale set by the
        figures in view.{" "}
        <span className="max-md:hidden">
          <b className="font-medium text-read">
            The darker grey is not {"\u201c"}no change{"\u201d"}
          </b>
          : it is a country with no atlas row, because it lacks a series some
          column needs.{" "}
        </span>
        Every country here is also a row in the table below, which carries the
        exact figure; the map is for seeing where, the table for reading values.
      </p>
    </div>
  );
}
