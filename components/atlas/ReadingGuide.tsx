"use client";

import { useAtlasWindow } from "@/components/atlas/AtlasWindow";
import { windowLabel } from "@/lib/atlas";

/**
 * "How to read this", beside the worked reading in the Compare card (mockups/
 * atlas-v1/atlas.html .guide). The reading rules again, in full: Tier 1, so it
 * is prose and never behind an icon. The end year and window are the data's own.
 */
export function ReadingGuide() {
  const { window, end } = useAtlasWindow();
  const next = String(Number(end) + 1);
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-hover">
        How to read this
      </p>
      <p className="text-[13.5px] leading-[1.65] text-text-muted">
        Every figure is published by someone else and carries their name and
        date, and{" "}
        <b className="font-medium text-read">every figure here is national</b>:
        cities name the country they stand for, and city-specific data will live
        on each city{"’"}s page, which arrive one at a time. There is{" "}
        <b className="font-medium text-read">no composite and no ranking</b>.
        Spending, income, unemployment and life expectancy are{" "}
        <b className="font-medium text-read">the latest published level</b>.
        Shares, housing, prices and currency are{" "}
        <b className="font-medium text-read">
          change over the window above ({windowLabel(window, end)})
        </b>
        , each from its own country{"’"}s baseline, so{" "}
        <b className="font-medium text-read">
          compare the rates and never the levels
        </b>
        . All four end in {end}, the latest year every country has published for
        all of them; the window moves on by itself when the last one publishes{" "}
        {next}.
      </p>
    </div>
  );
}
