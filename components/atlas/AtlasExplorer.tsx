"use client";

import { useEffect, useMemo, useState } from "react";

import { Scatter } from "@/components/atlas/Scatter";
import type { ColumnKey } from "@/lib/atlas";
import { MEASURES, buildPlot } from "@/lib/atlas-plot";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

/**
 * The Compare section (Phase 11 step 2): two axis pickers over the scatter.
 * The window is a prop until step 3's selector drives it; the five Ask chips
 * of step 4 will set `x` and `y` from here.
 */

const SELECT =
  "rounded-lg border border-hairline bg-panel-2 px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function useTargetSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setSlug(window.location.hash.slice(1) || null);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return slug;
}

export function AtlasExplorer({
  rows,
  window: win = "2010",
  end,
}: {
  rows: AtlasRow[];
  window?: WindowStart;
  end: string;
}) {
  const [x, setX] = useState<ColumnKey>("everydaySpendingEur");
  const [y, setY] = useState<ColumnKey>("housing");
  const target = useTargetSlug();
  const model = useMemo(() => buildPlot(rows, x, y, win), [rows, x, y, win]);
  const windowLabel = `${win}–${end.slice(2)}`;

  return (
    <div className="panel-elevated rounded-2xl p-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-b border-hairline pb-5">
        {(
          [
            ["Horizontal", "atlas-axis-x", x, setX],
            ["Vertical", "atlas-axis-y", y, setY],
          ] as const
        ).map(([label, id, value, set]) => (
          <div key={id} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              {label}
            </label>
            <select id={id} value={value} onChange={(e) => set(e.target.value as ColumnKey)} className={SELECT}>
              {MEASURES.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.option}
                </option>
              ))}
            </select>
          </div>
        ))}
        <p className="ml-auto text-right font-mono text-xs leading-relaxed text-text-muted">
          {model.points.length} countries plotted
          <br />
          no weighting, no composite
        </p>
      </div>

      <div className="overflow-x-auto pt-4">
        <div className="min-w-[720px]">
          <Scatter model={model} xKey={x} yKey={y} targetSlug={target} windowLabel={windowLabel} />
        </div>
      </div>
      {model.points.some((p) => p.clip) && (
        <p className="mt-2 text-xs text-text-muted">
          <span aria-hidden="true">{"▸"} </span>
          Off the axis: a value more than twice the next highest sits on the edge, labelled with its figure, so the other points keep their room.
        </p>
      )}
      {model.skipped > 0 && (
        <p className="mt-2 text-xs text-text-muted">
          {model.skipped} {model.skipped === 1 ? "country has" : "countries have"} no figure for this pair and {model.skipped === 1 ? "is" : "are"} left off.
        </p>
      )}
    </div>
  );
}
