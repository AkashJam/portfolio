import Link from "next/link";

import { fullStackYears, proofFigures } from "@/data/experience";

/**
 * The CV's headline figures on one line (accepted 2026-10-09; mock
 * `market-v2/home-band.html`). It answers "who is this?" before the band and hands
 * off to /about#impact for the evidence. `4+ yrs` is summed from the role dates,
 * never typed; the others are typed once, in data/experience.ts. No motion.
 */
export function ProofStrip() {
  return (
    <div
      aria-label="At a glance"
      data-testid="proof-strip"
      className="mt-7 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-4.5 font-mono text-[13px] leading-snug text-text-muted md:gap-x-5.5"
    >
      <span>
        <b className="font-semibold text-text tabular-nums">{fullStackYears()} yrs</b> full-stack
      </span>
      {proofFigures.map((f) => (
        <span key={f.label}>
          <b className="font-semibold text-text tabular-nums">{f.value}</b> {f.label}
        </span>
      ))}
      <Link href="/about#impact" className="basis-full text-brand-hover hover:underline md:ml-2.5 md:basis-auto">
        The evidence &rarr;
      </Link>
    </div>
  );
}
