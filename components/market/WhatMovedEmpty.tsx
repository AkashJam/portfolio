/**
 * *What moved, and why* before the trigger exists (portfolio.md §15 Phase 14
 * step 4). The ledger is Phase 15's; until then the section says plainly why it
 * is empty. It is not a result ("nothing happened"), it is a statement
 * ("nothing is watching yet"), so no endpoint answers an empty list for it and
 * there is no counter: the history it needs was backfilled (bearing.md #108).
 */
export function WhatMovedEmpty() {
  return (
    <div data-testid="what-moved-empty" className="rounded-2xl border border-dashed border-brand/30 bg-panel px-7 py-8">
      <h3 className="text-[19px] font-semibold text-read">Nothing has tripped, because nothing can yet.</h3>
      <p className="mt-2.5 max-w-[72ch] text-[14.5px] leading-relaxed text-text-muted">
        The threshold is 2.5&sigma;, measured over sixty daily moves. The history it needs is recorded, but the trigger
        is not switched on until the next release, so no move is judged unusual and no news is fetched. This list stays
        empty &mdash; not because the world is quiet, but because nothing is watching for it yet.
      </p>
      <p className="mt-3.5 max-w-[76ch] text-[13px] leading-relaxed text-text-muted">
        A dead feed says it is dead, a closed market says it is closed, and a trigger that is not switched on says so.
      </p>
    </div>
  );
}
