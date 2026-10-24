/** The phone cue above a table that scrolls sideways (owner, 2026-10-24):
 * overlay scrollbars on phones made a cut-off column read as the end of the
 * table (bearing.md #107). Phones only, like the edge fade it sits beside. */
export function SwipeHint() {
  return (
    <p className="mb-3 hidden text-meta text-text-muted max-md:block">
      Swipe the table sideways for more <b className="font-medium text-brand-hover">→</b>
    </p>
  );
}
