"use client";

import { useRef, type KeyboardEvent } from "react";

import { CHIPS, type ChipId } from "@/lib/atlas-readings";
import { cn } from "@/lib/utils";

/**
 * The five questions (phase18.md I50): short tabs on a desktop, a native select
 * below 768px. Picking one sets both axes and the window (the Explorer does that);
 * a built comparison selects none. The selected question's full text is the heading
 * the Explorer draws under this row.
 */
export function QuestionTabs({
  chip,
  onPick,
}: {
  chip: ChipId | null;
  onPick: (id: ChipId) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const to =
      e.key === "ArrowRight" ? (i + 1) % CHIPS.length
      : e.key === "ArrowLeft" ? (i + CHIPS.length - 1) % CHIPS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? CHIPS.length - 1
      : null;
    if (to === null) return;
    e.preventDefault();
    onPick(CHIPS[to].id);
    refs.current[CHIPS[to].id]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label="Questions" className="hidden flex-wrap gap-x-1 border-b border-hairline md:flex">
        {CHIPS.map((c, i) => {
          const on = chip === c.id;
          return (
            <button
              key={c.id}
              ref={(el) => {
                refs.current[c.id] = el;
              }}
              type="button"
              role="tab"
              id={`atlas-q-${c.id}`}
              aria-selected={on}
              aria-controls="atlas-question"
              tabIndex={on || (chip === null && i === 0) ? 0 : -1}
              onClick={() => onPick(c.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "-mb-px border-b-2 px-3.5 py-2.5 text-small font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                on ? "border-brand-hover text-text" : "border-transparent text-text-muted hover:text-read",
              )}
            >
              {c.tab}
            </button>
          );
        })}
      </div>
      <div className="md:hidden">
        <label htmlFor="atlas-question-select" className="sr-only">
          Question
        </label>
        <select
          id="atlas-question-select"
          value={chip ?? ""}
          onChange={(e) => onPick(e.target.value as ChipId)}
          className="w-full rounded-lg border border-hairline bg-panel-2 px-3 py-2.5 text-small text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {chip === null && (
            <option value="" disabled>
              Your comparison
            </option>
          )}
          {CHIPS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tab}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
