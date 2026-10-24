import { sessionShort } from "@/lib/ledger";
import type { SensorRecord } from "@/lib/market-schemas";

/**
 * *Where these numbers come from* (Phase 16 step 2): every figure on the page named
 * with its source and its date, the gate of the phase. Built from the record, so the
 * benchmark, the base date and the window are the ones the figures above used.
 */
export function RecordProvenance({ record }: { record: SensorRecord }) {
  const rows: { key: string; label: string; text: string }[] = [
    {
      key: "price",
      label: "price",
      text: "Finnhub WebSocket in US hours, trades coalesced to one tick per second; the daily bar from one /quote call at 16:15 New York, open, high, low and close without volume.",
    },
    {
      key: "chart",
      label: "chart",
      text: record.baseSession
        ? `Daily closes as stored, each divided by the close on ${sessionShort(record.baseSession)} and multiplied by 100${record.benchmark ? `, for ${record.symbol} and ${record.benchmark} alike` : ""}. That is the first session ${record.benchmark ? "both have a close" : "has a close"}; it grows by a session each day.`
        : "No session has a close yet.",
    },
    {
      key: "sigma",
      label: "σ",
      text: record.benchmark
        ? `The move left over after subtracting ${record.benchmark}'s, measured over the 60 trailing sessions and recomputed nightly. Fired at 2.5σ.`
        : `No benchmark is subtracted: ${record.benchmarkReason ?? "none applies"}. The raw return is measured over the 60 trailing sessions and recomputed nightly. Fired at 2.5σ.`,
    },
    {
      key: "judged",
      label: "sessions",
      text: `The trigger has judged every session from ${sessionShort(record.judgedFrom)}. The bars begin earlier, seeded from the same feed, but nothing before that date was tested, so no count of events reaches back past it.`,
    },
  ];
  if (record.country) {
    rows.push({
      key: "country",
      label: "country",
      text: `The business country EDGAR gives the filer, ${record.country.name}.`,
    });
  }
  rows.push(
    {
      key: "split",
      label: "split",
      text: "Where the ECB publishes the country's currency, the same day's reference rate separates the currency's move from the stock's; where it does not, the event says why.",
    },
    {
      key: "news",
      label: "news",
      text: "Fetched because the move tripped, never on a timer; every outlet is shown, divided at the close.",
    },
  );
  return (
    <section aria-labelledby="provenance" data-testid="record-provenance">
      <h2 id="provenance" className="text-small font-semibold uppercase tracking-[0.16em] text-text">
        Where these numbers come from
      </h2>
      <dl className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} data-source={r.key} className="grid grid-cols-[5.5rem_1fr] gap-x-4 text-small leading-relaxed">
            <dt className="font-mono text-meta text-text-muted">{r.label}</dt>
            <dd className="max-w-measure text-read">{r.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
