"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAtlasWindow } from "@/components/atlas/AtlasWindow";
import { MapControls } from "@/components/atlas/MapControls";
import { MINUS, windowLabel } from "@/lib/atlas";
import { LABEL } from "@/lib/atlas-labels";
import { mapSearch } from "@/lib/atlas-url";
import {
  MEASURE_NAME,
  NO_FIGURE,
  NO_ROW,
  NO_ROW_LINE,
  TILE,
  TILES,
  caveatKind,
  colourFor,
  digitsFor,
  exceptionsLine,
  figureOf,
  formatMapChange,
  legendStops,
  limitFor,
  linkName,
  mapValue,
  parseAddress,
  schemeOf,
  switchMeasure,
  textColourFor,
  viewLabel,
  yearBounds,
  type MapMeasure,
  type MapState,
} from "@/lib/atlas-map";
import type { AtlasRow } from "@/lib/market-schemas";
import { cn } from "@/lib/utils";
import geometry from "@/data/atlas-map.json";

/**
 * The Map tab (Phase 11 steps 5 and 6; Phase 22 I58, mockups/site-review/atlas.html
 * .p-map): one measure and period, the options behind a menu, a larger legend and
 * the countries outside the atlas hatched. Every country colour is the change for
 * one measure over the shared window or over one year, on a scale set by the
 * data in view (lib/atlas-map.ts). The real world map at 768px and up, equal
 * tiles below; each country links to its table row. The measure and year ride
 * in the address (`?measure=&year=`, defaults omitted, replaced in place, the rest
 * of the query left alone).
 */

const MAP = geometry as unknown as {
  viewBox: [number, number];
  outline: string;
  countries: Record<string, string>;
};

const linkRing =
  "group outline-none [&_.shape]:group-hover:stroke-text [&_.shape]:group-focus-visible:stroke-text [&_.shape]:group-focus-visible:[stroke-width:2]";

/** A tile is 42 units wide: thousands are shortened, and long figures set a size smaller. */
function tileFigure(value: number | null, figure: string | null): string {
  if (value === null || figure === null) return "—";
  if (Math.abs(value) < 1000) return figure;
  return `${value < 0 ? MINUS : "+"}${(Math.abs(value) / 1000).toFixed(1)}k%`;
}

const PLAY_MS = 1000;

export function WorldMap({
  rows,
  initial,
}: {
  rows: AtlasRow[];
  /** A starting state, for tests; the address overrides it on mount. */
  initial?: MapState;
}) {
  const { window: win, end } = useAtlasWindow();
  const [state, setState] = useState<MapState>(
    () =>
      initial ?? {
        measure: "housing",
        period: "window",
        year: yearBounds(rows, "housing").last,
      },
  );
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const bounds = useMemo(
    () => yearBounds(rows, state.measure),
    [rows, state.measure],
  );

  // The address is read once, on mount: a year the measure lacks becomes its
  // first year, and the sync below rewrites the address to say so.
  useEffect(() => {
    const read = () => {
      const q = new URLSearchParams(window.location.search);
      setState(parseAddress(window.location.search, rows));
      // A measure or a year in the address means the options were used: show them.
      setMenuOpen(q.has("measure") || q.has("year"));
      setReady(true);
    };
    read();
  }, [rows]);

  useEffect(() => {
    if (!ready) return;
    // Only the map's own parameters: the tab, the home city and the other views' settings are in the same query.
    const search = mapSearch(window.location.search, state);
    if (search !== window.location.search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search}${window.location.hash}`,
      );
    }
  }, [state, ready]);

  // Play: the measure's years in order, a second each, stopping on the last.
  const yearRef = useRef(state.year);
  useEffect(() => {
    yearRef.current = state.year;
  }, [state.year]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = yearRef.current + 1;
      yearRef.current = next;
      setState((s) => ({ ...s, year: next }));
      if (next >= bounds.last) setPlaying(false);
    }, PLAY_MS);
    return () => clearInterval(id);
  }, [playing, bounds.last]);

  const view = state;
  const values = rows
    .map((r) => mapValue(r, state.measure, view, win))
    .filter((v): v is number => v !== null);
  const limit = limitFor(values);
  const digits = digitsFor(limit);
  const scheme = schemeOf(state.measure);
  const stops = legendStops(limit, scheme);
  const exceptions = exceptionsLine(rows, state.measure, view, win);

  const countries = rows
    .filter((r) => MAP.countries[r.code] && TILES[r.code])
    .map((r) => {
      const v = mapValue(r, state.measure, view, win);
      return {
        row: r,
        value: v,
        fill: v === null ? NO_FIGURE : colourFor(v, limit, scheme),
        name: linkName(r, state.measure, view, win, end, digits),
        figure: figureOf(r, state.measure, view, win, digits),
        star: caveatKind(r, state.measure, view, win) === "derived",
      };
    });
  const anyNoFigure = countries.some((c) => c.figure === null);

  const [w, h] = MAP.viewBox;
  const label = `${MEASURE_NAME[state.measure]}, change ${viewLabel(view, win, end)}`;
  const lo =
    scheme === "sequential"
      ? formatMapChange(0, digits)
      : `${MINUS}${formatMapChange(limit, digits).slice(1)} or less`;

  function onMeasure(m: MapMeasure) {
    setPlaying(false);
    setState((s) => switchMeasure(s, m, rows));
  }

  function onPlay() {
    if (playing) return setPlaying(false);
    if (state.year >= bounds.last)
      setState((s) => ({ ...s, year: bounds.first }));
    setPlaying(true);
  }

  return (
    <section aria-label="Map" className="reveal">
      <div className="panel-elevated rounded-2xl p-5">
        <h2 className="text-lead font-medium">
          {LABEL[state.measure].name}
          {", "}
          <span className="whitespace-nowrap">{viewLabel(view, win, end)}</span>
        </h2>
        <details
          open={menuOpen}
          onToggle={(e) => setMenuOpen(e.currentTarget.open)}
          className="mt-3"
        >
          <summary className="cursor-pointer text-small text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            Change measure or period {"▾"}
          </summary>
          <MapControls
            state={state}
            bounds={bounds}
            windowText={windowLabel(win, end)}
            playing={playing}
            onMeasure={onMeasure}
            onPeriod={(p) => {
              setPlaying(false);
              setState((s) => ({ ...s, period: p }));
            }}
            onYear={(y) => {
              setPlaying(false);
              setState((s) => ({ ...s, period: "year", year: y }));
            }}
            onPlay={onPlay}
          />
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-meta text-text-muted max-md:grid max-md:grid-cols-[1fr_auto]">
          <span>{lo}</span>
          <span
            aria-hidden="true"
            className="flex h-3 w-60 overflow-hidden rounded-[3px] max-md:order-first max-md:col-span-2 max-md:w-full"
          >
            {stops.map((s) => (
              <i key={s.value} className="flex-1" style={{ background: s.fill }} />
            ))}
          </span>
          <span>{formatMapChange(limit, digits)} or more</span>
          <span className="ml-3 inline-flex items-center max-md:hidden">
            <i
              aria-hidden="true"
              className="mr-1.5 inline-block h-3 w-[18px] rounded-[3px]"
              style={{
                background: `repeating-linear-gradient(45deg, ${NO_ROW} 0 3px, ${NO_ROW_LINE} 3px 5px)`,
              }}
            />
            not one of the {rows.length}
          </span>
          {anyNoFigure && (
            <span className="inline-flex items-center max-md:col-span-2">
              <i
                aria-hidden="true"
                className="mr-1.5 inline-block h-3 w-[18px] rounded-[3px]"
                style={{ background: NO_FIGURE }}
              />
              no figure
            </span>
          )}
        </div>
        {exceptions && (
          <p className="mt-3 text-meta text-text-muted">{exceptions}</p>
        )}

        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="group"
          aria-label={`${label}, by country`}
          className="hidden h-auto w-full md:block"
        >
          <defs>
            <pattern id="norow" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={NO_ROW} />
              <line x1="0" y1="0" x2="0" y2="6" stroke={NO_ROW_LINE} strokeWidth="2" />
            </pattern>
          </defs>
          <path
            d={MAP.outline}
            fill="url(#norow)"
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
          aria-label={`${label}, as equal tiles`}
          className="mx-auto h-auto w-full max-w-[352px] md:hidden"
        >
          {countries.map(({ row, value, fill, name, figure, star }) => {
            const [col, rw] = TILES[row.code];
            const x = col * TILE.pitch + 1;
            const y = rw * TILE.pitch + 1;
            const ink = textColourFor(fill);
            const text = tileFigure(value, figure);
            return (
              <g key={row.slug}>
                {/* The link holds only its labelled shape: the code and figure are drawn
                    over it as hidden siblings, so the link has no visible text of its own
                    to disagree with its name (WCAG 2.5.3), and a click on the text still
                    lands on the tile. */}
                <a href={`#${row.slug}`} aria-label={name} className={linkRing}>
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
                </a>
                <text
                  aria-hidden="true"
                  x={x + TILE.size / 2}
                  y={y + 17}
                  textAnchor="middle"
                  fill={ink}
                  className="pointer-events-none font-mono text-meta font-semibold"
                >
                  {row.code}
                  {star ? "*" : ""}
                </text>
                <text
                  aria-hidden="true"
                  x={x + TILE.size / 2}
                  y={y + 32}
                  textAnchor="middle"
                  fill={ink}
                  className={cn(
                    "pointer-events-none font-mono",
                    text.length >= 6 ? "text-meta" : "text-meta",
                  )}
                >
                  {text}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="mt-4 border-t border-hairline pt-4 text-small leading-relaxed text-text-muted">
          Each colour is{" "}
          <b className="font-medium text-read">the change over the period</b>,
          from that country{"’"}s own published series, on a scale set by the
          figures in view.{" "}
          {state.measure === "prices" && (
            <>
              <b className="font-medium text-read">
                Prices use one hue, not two
              </b>
              , because every value is a rise and colour cannot mean better or
              worse.{" "}
            </>
          )}
          Every country here is also a row in the Countries tab, which carries
          the exact figure for the window; the map is for seeing where and when,
          the table for reading values.
        </p>
      </div>
    </section>
  );
}
