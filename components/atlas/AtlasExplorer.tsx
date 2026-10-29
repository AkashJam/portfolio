"use client";

import { useEffect, useMemo, useState } from "react";

import { useAtlasHome } from "@/components/atlas/AtlasHome";
import { WindowSelect, defaultWindow, useAtlasWindow } from "@/components/atlas/AtlasWindow";
import { QuestionTabs } from "@/components/atlas/QuestionTabs";
import { ReadingCard } from "@/components/atlas/ReadingCard";
import { Scatter } from "@/components/atlas/Scatter";
import { useTargetSlug } from "@/components/atlas/useTargetSlug";
import { type ColumnKey, formatEur, windowLabel as labelOf } from "@/lib/atlas";
import { convertRows, homeMoney, homeReading } from "@/lib/atlas-home";
import { MEASURES, PLOT, PLOT_PHONE, buildPlot } from "@/lib/atlas-plot";
import { CHIPS, CHIP_WINDOW, type ChipId, buildReading, describePair } from "@/lib/atlas-readings";
import { compareSearch, parseCompare } from "@/lib/atlas-url";
import type { AtlasRow } from "@/lib/market-schemas";

/**
 * The Compare view (phase18.md I50, I51, I55): five question tabs (a dropdown on a
 * phone), the selected question as the heading, the scatter, the worked reading, and
 * the axes and window behind a closed "Build your own comparison". A question sets both
 * axes and the window; touching an axis leaves the questions and clears the highlight,
 * and the reading degrades to the generated line. The window does not clear the
 * question: it is an input to the reading, which recomputes. All of it is in the
 * address (`?q=`, `?x=&y=`, `?window=`) and written with replaceState.
 */

const SELECT =
  "rounded-lg border border-hairline bg-panel-2 px-3 py-2 text-small text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function AtlasExplorer({ rows }: { rows: AtlasRow[] }) {
  const { window: win, setWindow, windows, end } = useAtlasWindow();
  const [chip, setChip] = useState<ChipId | null>(CHIPS[0].id);
  const [x, setX] = useState<ColumnKey>(CHIPS[0].x);
  const [y, setY] = useState<ColumnKey>(CHIPS[0].y);
  const [ready, setReady] = useState(false);
  const [byoOpen, setByoOpen] = useState(false);
  const target = useTargetSlug();
  const { home, rate } = useAtlasHome();
  const fallback = defaultWindow(windows);

  // The address is read once, after hydration: the server render is the first question.
  useEffect(() => {
    const read = () => {
      const s = parseCompare(window.location.search, windows);
      setChip(s.chip);
      setX(s.x);
      setY(s.y);
      if (s.window) setWindow(s.window);
      if (s.chip === null) setByoOpen(true);
      setReady(true);
    };
    read();
  }, [windows, setWindow]);

  useEffect(() => {
    if (!ready) return;
    const next = compareSearch(window.location.search, { chip, x, y, window: win }, fallback);
    if (next !== window.location.search) {
      window.history.replaceState(null, "", `${window.location.pathname}${next}${window.location.hash}`);
    }
  }, [ready, chip, x, y, win, fallback]);

  // Spending is shown in the home currency at the one rate: the values are converted
  // before the axis is built, so its ticks stay round in that currency.
  const plotRows = useMemo(() => convertRows(rows, rate), [rows, rate]);
  const spendFormat = useMemo(() => (rate ? (v: number) => homeMoney(v / rate.perEur, rate) : formatEur), [rate]);
  const question = CHIPS.find((c) => c.id === chip) ?? null;
  const highlight = useMemo(() => (question ? [question.a, question.b] : []), [question]);
  const desktop = useMemo(() => buildPlot(plotRows, x, y, win, PLOT, highlight), [plotRows, x, y, win, highlight]);
  const phone = useMemo(() => buildPlot(plotRows, x, y, win, PLOT_PHONE, highlight), [plotRows, x, y, win, highlight]);
  const windowLabel = labelOf(win, end);
  const reading = useMemo(
    () => buildReading(chip, plotRows, x, y, win, spendFormat),
    [chip, plotRows, x, y, win, spendFormat],
  );
  const against = useMemo(() => {
    const t = plotRows.find((r) => r.slug === target);
    const h = plotRows.find((r) => r.slug === home?.slug);
    return t && h ? homeReading(t, h, win, spendFormat) : null;
  }, [plotRows, target, home, win, spendFormat]);

  function pick(id: ChipId) {
    const c = CHIPS.find((q) => q.id === id);
    if (!c) return;
    setX(c.x);
    setY(c.y);
    if (windows.includes(CHIP_WINDOW)) setWindow(CHIP_WINDOW);
    setChip(id);
  }

  return (
    <div>
      <QuestionTabs chip={chip} onPick={pick} />
      <div
        id="atlas-question"
        role="tabpanel"
        aria-labelledby={chip ? `atlas-q-${chip}` : undefined}
        aria-label={chip ? undefined : "Your comparison"}
        className="pt-6"
      >
        <h2 className="max-w-measure text-lead font-medium">{question ? question.question : "Your comparison"}</h2>
        <p className="mt-1.5 max-w-measure text-small text-text-muted">{describePair(x, y, windowLabel)}</p>

        <div className="mt-4">
          <Scatter
            desktop={desktop}
            phone={phone}
            xKey={x}
            yKey={y}
            targetSlug={target}
            windowLabel={windowLabel}
            homeSlug={home?.slug ?? null}
            highlight={highlight}
            spending={rate ? { code: rate.currency, tick: spendFormat } : undefined}
          />
        </div>
        {desktop.points.some((p) => p.clip) && (
          <p className="mt-2 text-meta text-text-muted">
            <span aria-hidden="true">{"▸"} </span>
            Off the axis: a value more than twice the next highest sits on the edge, labelled with its figure, so the
            other points keep their room.
          </p>
        )}
        {desktop.skipped > 0 && (
          <p className="mt-2 text-meta text-text-muted">
            {desktop.skipped} {desktop.skipped === 1 ? "country has" : "countries have"} no figure for this pair and{" "}
            {desktop.skipped === 1 ? "is" : "are"} left off.
          </p>
        )}

        <div className="mt-6 grid max-w-3xl gap-5">
          <ReadingCard reading={reading} />
          {against && <ReadingCard reading={against} className="border-brand-hover/70" />}
        </div>
      </div>

      <details
        open={byoOpen}
        onToggle={(e) => setByoOpen(e.currentTarget.open)}
        className="mt-8 border-t border-hairline pt-4"
      >
        <summary className="cursor-pointer text-small font-medium text-read focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          Build your own comparison
        </summary>
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
          {(
            [
              ["Across", "atlas-axis-x", x, setX],
              ["Up", "atlas-axis-y", y, setY],
            ] as const
          ).map(([label, id, value, set]) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-meta font-semibold uppercase tracking-[0.18em] text-text-muted">
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
          <p className="ml-auto text-right font-mono text-meta leading-relaxed text-text-muted">
            {desktop.points.length} countries plotted
            <br />
            no weighting, no composite
          </p>
        </div>
      </details>
    </div>
  );
}
