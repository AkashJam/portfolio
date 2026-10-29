import type { LedgerEvent } from "@/lib/market-schemas";
import { methodLines } from "@/lib/ledger";

/**
 * "How this is calculated" (M15, I49): everything an entry leaves out of its face.
 * The query, the counts it left out, the rules, the fetch timing and the Google
 * News note are provenance, so they sit behind a toggle rather than in the way of
 * the reading.
 */
export function Method({ event }: { event: LedgerEvent }) {
  return (
    <details data-testid="method" className="group mt-5">
      <summary className="cursor-pointer text-small font-medium text-brand-hover underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand">
        How this is calculated
      </summary>
      <ul className="mt-3 max-w-measure list-disc space-y-2 pl-5 text-meta leading-relaxed text-text-muted">
        {methodLines(event).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}
