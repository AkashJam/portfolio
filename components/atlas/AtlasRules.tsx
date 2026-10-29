"use client";

import { useAtlasWindow } from "@/components/atlas/AtlasWindow";
import { rulesExample, rulesExampleSentence } from "@/lib/atlas-rules";
import type { AtlasRow } from "@/lib/market-schemas";

/**
 * "How to read this" (phase18.md I53): the three reading rules, once, under the
 * tab panel so they show with every view. Tier 1 (bearing.md): plain prose, never
 * collapsed, never behind an icon. The example is computed from the rows.
 */
export function AtlasRules({ rows }: { rows: AtlasRow[] }) {
  const { window } = useAtlasWindow();
  const ex = rulesExample(rows, window);
  return (
    <section aria-labelledby="atlas-rules" data-testid="atlas-rules" className="mt-10 border-t border-hairline pt-6">
      <h2 id="atlas-rules" className="text-meta font-semibold uppercase tracking-[0.16em] text-text-muted">
        How to read this
      </h2>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        <p className="text-small leading-relaxed text-text-muted">
          <b className="block font-medium text-read">Compare changes, not amounts.</b>
          {ex ? rulesExampleSentence(ex, window) : "Each change is measured from its own country’s baseline, so compare the rates and never the levels."}
        </p>
        <p className="text-small leading-relaxed text-text-muted">
          <b className="block font-medium text-read">Every figure is national.</b>
          {rows.length} countries, each shown by one of its cities.
        </p>
        <p className="text-small leading-relaxed text-text-muted">
          <b className="block font-medium text-read">There’s no league table.</b>
          Pick a question or two measures to see how countries compare.
        </p>
      </div>
    </section>
  );
}
