import { Segmented } from "@/components/atlas/Segmented";
import {
  MAP_MEASURES,
  MEASURE_LABEL,
  type MapMeasure,
  type MapState,
  type YearBounds,
} from "@/lib/atlas-map";
import { cn } from "@/lib/utils";

/**
 * The map's controls (Phase 11 step 6; mockups/atlas-v1/atlas-map.html .mctl):
 * the measure, the period (whole window or one year) and, for one year, a
 * slider with Play at 768px and up or a ‹ year › stepper below. The state and
 * the address live in WorldMap; this only draws and reports.
 */

const button =
  "inline-flex items-center gap-2 rounded-lg border border-hairline bg-panel-2 px-3.5 py-2.5 font-mono text-meta text-text-muted hover:border-brand/25 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40 disabled:hover:text-text-muted";

/** Years worth a label on the track: both ends and the multiples of five clear of them. */
function labelled(b: YearBounds): number[] {
  const mid: number[] = [];
  for (let y = b.first + 1; y < b.last - 1; y++) if (y % 5 === 0) mid.push(y);
  return [b.first, ...mid, b.last];
}

export function MapControls({
  state,
  bounds,
  windowText,
  playing,
  onMeasure,
  onPeriod,
  onYear,
  onPlay,
}: {
  state: MapState;
  bounds: YearBounds;
  windowText: string;
  playing: boolean;
  onMeasure: (m: MapMeasure) => void;
  onPeriod: (p: "window" | "year") => void;
  onYear: (y: number) => void;
  onPlay: () => void;
}) {
  const span = bounds.last - bounds.first || 1;
  const at = (y: number) => (y - bounds.first) / span;
  const calc = (f: number) => `calc(9px + (100% - 18px) * ${f.toFixed(4)})`;
  const years = Array.from(
    { length: bounds.last - bounds.first + 1 },
    (_, i) => bounds.first + i,
  );

  return (
    <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
      <Segmented
        id="atlas-map-measure"
        label="Measure"
        options={MAP_MEASURES.map((m) => ({
          value: m,
          label: MEASURE_LABEL[m],
        }))}
        value={state.measure}
        onChange={onMeasure}
      />
      <Segmented
        id="atlas-map-period"
        label="Period"
        options={[
          { value: "window", label: `Whole window · ${windowText}` },
          { value: "year", label: "One year" },
        ]}
        value={state.period}
        onChange={onPeriod}
      />

      {state.period === "year" && (
        <>
          <div className="flex basis-full items-center gap-4 pt-0.5 max-md:hidden">
            <button
              type="button"
              onClick={onPlay}
              className={button}
              aria-label={playing ? "Pause" : "Play through the years"}
            >
              <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true">
                {playing ? (
                  <path d="M1 1h2.5v8H1zM5.5 1H8v8H5.5z" fill="currentColor" />
                ) : (
                  <path d="M1 1l7 4-7 4z" fill="currentColor" />
                )}
              </svg>
              {playing ? "Pause" : "Play"}
            </button>
            <div
              className="relative h-10 min-w-0 flex-1"
              style={
                {
                  "--p": `${(at(state.year) * 100).toFixed(2)}%`,
                } as React.CSSProperties
              }
            >
              <input
                type="range"
                className="year-range absolute inset-x-0 top-0 z-[2]"
                min={bounds.first}
                max={bounds.last}
                step={1}
                value={state.year}
                aria-label="Year"
                aria-valuetext={String(state.year)}
                onChange={(e) => onYear(Number(e.target.value))}
              />
              {years.map((y) => (
                <i
                  key={y}
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[15px] h-[5px] w-px",
                    y <= state.year ? "bg-brand/60" : "bg-hairline",
                  )}
                  style={{ left: calc(at(y)) }}
                />
              ))}
              {labelled(bounds).map((y) => (
                <span
                  key={y}
                  aria-hidden="true"
                  className="absolute top-6 -translate-x-1/2 font-mono text-meta leading-none text-text-muted"
                  style={{ left: calc(at(y)) }}
                >
                  {y}
                </span>
              ))}
            </div>
            <span
              className="min-w-[3.5rem] text-center font-mono text-body font-semibold tabular-nums text-text"
              aria-hidden="true"
            >
              {state.year}
            </span>
          </div>

          <div className="flex basis-full items-center gap-4 md:hidden">
            <div className="flex h-[42px] items-stretch overflow-hidden rounded-lg border border-hairline">
              <button
                type="button"
                aria-label="Previous year"
                disabled={state.year <= bounds.first}
                onClick={() => onYear(state.year - 1)}
                className="w-[46px] bg-panel-2 text-xl text-read focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
              >
                {"‹"}
              </button>
              <span
                aria-live="polite"
                className="flex min-w-[76px] items-center justify-center border-x border-hairline bg-panel px-3.5 font-mono text-body font-semibold tabular-nums text-text"
              >
                {state.year}
              </span>
              <button
                type="button"
                aria-label="Next year"
                disabled={state.year >= bounds.last}
                onClick={() => onYear(state.year + 1)}
                className="w-[46px] bg-panel-2 text-xl text-read focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
              >
                {"›"}
              </button>
            </div>
            <span className="font-mono text-meta text-text-muted">
              of {bounds.first}
              {"–"}
              {bounds.last}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
