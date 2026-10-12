"use client";

import { useMemo, useState } from "react";

import { WindowSelect, useAtlasWindow } from "@/components/atlas/AtlasWindow";
import { useTargetSlug } from "@/components/atlas/useTargetSlug";
import { ReadingCard } from "@/components/atlas/ReadingCard";
import { ReadingGuide } from "@/components/atlas/ReadingGuide";
import { Scatter } from "@/components/atlas/Scatter";
import { type ColumnKey, windowLabel as labelOf } from "@/lib/atlas";
import { MEASURES, buildPlot } from "@/lib/atlas-plot";
import {
  CHIPS,
  CHIP_WINDOW,
  type ChipId,
  buildReading,
} from "@/lib/atlas-readings";
import type { AtlasRow } from "@/lib/market-schemas";
import { cn } from "@/lib/utils";

/**
 * The Compare section: the five Ask chips (step 4), two axis pickers and the
 * window (step 3) over the scatter, with a worked reading underneath.
 * A chip sets both axes and the window; touching an axis dropdown clears it
 * and the reading degrades to the generated line. The window selector does
 * not clear it: the window is an input to the reading, which recomputes.
 */

const SELECT =
  "rounded-lg border border-hairline bg-panel-2 px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function AtlasExplorer({ rows }: { rows: AtlasRow[] }) {
  const { window: win, setWindow, windows, end } = useAtlasWindow();
  const [chip, setChip] = useState<ChipId | null>(CHIPS[0].id);
  const [x, setX] = useState<ColumnKey>(CHIPS[0].x);
  const [y, setY] = useState<ColumnKey>(CHIPS[0].y);
  const target = useTargetSlug();
  const model = useMemo(() => buildPlot(rows, x, y, win), [rows, x, y, win]);
  const windowLabel = labelOf(win, end);
  const reading = useMemo(
    () => buildReading(chip, rows, x, y, win),
    [chip, rows, x, y, win],
  );

  function pick(id: ChipId) {
    const c = CHIPS.find((q) => q.id === id);
    if (!c) return;
    setX(c.x);
    setY(c.y);
    if (windows.includes(CHIP_WINDOW)) setWindow(CHIP_WINDOW);
    setChip(id);
  }

  return (
    <div className="panel-elevated rounded-2xl p-5">
      <div
        role="group"
        aria-labelledby="atlas-ask-label"
        className="flex flex-wrap items-center gap-2 pb-4"
      >
        <span
          id="atlas-ask-label"
          className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted"
        >
          Ask
        </span>
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={chip === c.id}
            onClick={() => pick(c.id)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-[12.5px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              chip === c.id
                ? "border-brand/55 bg-brand/20 text-text"
                : "border-hairline bg-panel-2 text-text-muted hover:border-brand/25 hover:text-read",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-hairline pb-5">
        {(
          [
            ["Horizontal", "atlas-axis-x", x, setX],
            ["Vertical", "atlas-axis-y", y, setY],
          ] as const
        ).map(([label, id, value, set]) => (
          <div key={id} className="flex flex-col gap-1.5">
            <label
              htmlFor={id}
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted"
            >
              {label}
            </label>
            <select
              id={id}
              value={value}
              onChange={(e) => {
                set(e.target.value as ColumnKey);
                setChip(null);
              }}
              className={SELECT}
            >
              {MEASURES.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.option}
                </option>
              ))}
            </select>
          </div>
        ))}
        <WindowSelect />
        <p className="ml-auto text-right font-mono text-xs leading-relaxed text-text-muted">
          {model.points.length} countries plotted
          <br />
          no weighting, no composite
        </p>
      </div>

      <div className="grid items-start gap-7 border-b border-hairline py-5 lg:grid-cols-[1.15fr_1fr]">
        <ReadingGuide />
        <ReadingCard reading={reading} />
      </div>

      <div className="overflow-x-auto pt-4">
        <div className="min-w-[720px]">
          <Scatter
            model={model}
            xKey={x}
            yKey={y}
            targetSlug={target}
            windowLabel={windowLabel}
          />
        </div>
      </div>
      {model.points.some((p) => p.clip) && (
        <p className="mt-2 text-xs text-text-muted">
          <span aria-hidden="true">{"▸"} </span>
          Off the axis: a value more than twice the next highest sits on the
          edge, labelled with its figure, so the other points keep their room.
        </p>
      )}
      {model.skipped > 0 && (
        <p className="mt-2 text-xs text-text-muted">
          {model.skipped}{" "}
          {model.skipped === 1 ? "country has" : "countries have"} no figure for
          this pair and {model.skipped === 1 ? "is" : "are"} left off.
        </p>
      )}
    </div>
  );
}
