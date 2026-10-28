import { proofFigures } from "@/data/experience";

/**
 * /about's row of three figures (phase18.md D7; `site-review/about.html`): one row at every
 * width, the figures set larger than their labels. They are Home's own figures, typed once in
 * data/experience.ts, with the fuller label that reads under them here. `#impact` stays on
 * the row as an anchor (the impact ledger it once led to is retired).
 */
export function AboutStats() {
  return (
    <div
      id="impact"
      aria-label="At a glance"
      className="mt-10 grid max-w-190 scroll-mt-24 grid-cols-3 gap-2.5 border-t border-hairline pt-5.5 md:gap-4"
    >
      {proofFigures.map((figure) => (
        <div key={figure.value}>
          <b className="block font-mono text-[24px] leading-none font-medium text-text tabular-nums md:text-[32px]">
            {figure.value}
          </b>
          <span className="mt-2 block text-small text-text-muted">{figure.about}</span>
        </div>
      ))}
    </div>
  );
}
