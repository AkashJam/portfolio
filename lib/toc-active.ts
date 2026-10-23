/**
 * Which heading the "On this page" list marks (phase18.md step 6, M9). Decided from where the
 * headings are, not from the headings an IntersectionObserver happens to report: its band was a
 * few hundred pixels tall, so a fast jump (a flick, Page Down, the scrollbar) crossed a heading
 * without a callback and left the list on the section it came from, and the last headings, which
 * can never scroll up into the band at the foot of a page, were never marked.
 */

/** The pixels from the top of the viewport at which a heading counts as reached: the sticky bar (56)
 * plus room to read it. */
export const TOC_OFFSET = 100;

/**
 * The index of the active heading, given each heading's top in viewport coordinates, in document
 * order. The active one is the last whose top has reached `offset`; the first when none has; and the
 * last when the page is scrolled to its end, so a short final section can be marked at all.
 */
export function activeHeading(tops: number[], atBottom: boolean, offset = TOC_OFFSET): number {
  if (tops.length === 0) return -1;
  if (atBottom) return tops.length - 1;
  let active = 0;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= offset) active = i;
  }
  return active;
}
