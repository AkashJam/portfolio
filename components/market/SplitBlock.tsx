import type { LedgerEvent } from "@/lib/market-schemas";
import { noSplitText, splitVerdict } from "@/lib/ledger";

/**
 * What moved (I47): the currency split in one sentence. The parts, the 2σ tests and
 * the exchange-rate note are in the method toggle. Where no split could be made it
 * says so and why, and a split that has not been made yet says that.
 */
export function SplitBlock({ event }: { event: LedgerEvent }) {
  const verdict = splitVerdict(event);
  return (
    <div data-testid="split" data-label={event.split?.label ?? undefined}>
      <h4 className="mb-1.5 text-meta font-semibold uppercase tracking-[0.18em] text-text-muted">What moved</h4>
      <p className="text-small leading-relaxed text-read">
        {verdict ??
          (event.split === null
            ? "The currency split has not been made yet; it is retried at the next run."
            : noSplitText(event.split.reason))}
      </p>
    </div>
  );
}
