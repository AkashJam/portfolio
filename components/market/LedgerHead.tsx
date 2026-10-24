import { DotFor } from "@/components/shell/MarketDot";
import type { LedgerEvent } from "@/lib/market-schemas";
import { headLine } from "@/lib/ledger";
import { deriveMarketState } from "@/lib/market-state";

/**
 * The ledger's one-line verdict under the page's intro (market.html,
 * market-quiet.html): what the last close did. It reads the events, not the feed,
 * so it is the same whether the market is open or closed: a record does not
 * refresh. Tripped is a trip at the last close; anything older reads quiet and
 * says how long ago.
 */
export function LedgerHead({ events }: { events: LedgerEvent[] }) {
  const head = headLine(events);
  const state = deriveMarketState({ feed: "closed", tripped: head.kind === "tripped" });
  return (
    <p
      data-testid="ledger-line"
      data-kind={head.kind}
      className="mt-2.5 flex items-start gap-3 font-mono text-small leading-normal text-text-muted"
    >
      <DotFor state={state} decorative className="mt-1.5 size-2" />
      <span>
        <b className="font-medium text-read">{head.word}</b> {head.facts}
      </span>
    </p>
  );
}
