import type { LedgerEvent } from "@/lib/market-schemas";
import { noSplitText, splitView } from "@/lib/ledger";

/**
 * The currency split (bearing.md #90): a sensor is priced in dollars, so its move
 * is the home market's plus the currency's. Shows both parts and why the news was
 * routed as it was, or, where no split could be made, says so and why. A split
 * that has not been made yet says that, rather than saying nothing.
 */
export function SplitBlock({ event }: { event: LedgerEvent }) {
  const view = splitView(event);
  if (view) {
    return (
      <div
        data-testid="split"
        data-label={view.label ?? undefined}
        className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 rounded-[10px] border border-hairline bg-panel-2 px-3 py-2.5 text-small text-read"
      >
        <span className="rounded-full border border-brand/45 px-2 py-1 text-meta font-semibold uppercase leading-none tracking-[0.14em] text-brand-hover">
          {view.label}
        </span>
        <span>
          <b className="font-mono font-semibold text-text">{view.currencyLine}</b>
          <span aria-hidden="true" className="mx-2 text-text-muted">
            ·
          </span>
          <b className="font-mono font-semibold text-text">{view.stockLine}</b>
        </span>
        <small className="basis-full font-mono text-meta leading-normal text-text-muted">
          {view.fix} {view.note}
        </small>
      </div>
    );
  }
  if (event.split === null) {
    return (
      <p data-testid="split-pending" className="mt-3.5 font-mono text-meta leading-normal text-text-muted">
        The currency split has not been made yet; it is retried at the next run.
      </p>
    );
  }
  return (
    <p data-testid="split-none" className="mt-3.5 font-mono text-meta leading-normal text-text-muted">
      {noSplitText(event.split.reason)}
    </p>
  );
}
