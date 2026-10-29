import { sectorName, sessionShort } from "@/lib/ledger";
import type { SensorRecord } from "@/lib/market-schemas";

/**
 * *How this is calculated* (Phase 16 step 2's provenance block, behind the toggle by
 * Phase 21 step 4, I43): every figure on the page named with its source and its date,
 * the gate of Phase 16. Built from the record, so the sector, the base date and the
 * window are the ones the figures above used. The keys and the test id stay, so the
 * gate's checks still find each source.
 */
export function RecordProvenance({ record }: { record: SensorRecord }) {
  const sector = record.benchmark ? sectorName(record.benchmark, true) : null;
  const rows: { key: string; label: string; text: string }[] = [
    {
      key: "price",
      label: "Price",
      text: "Finnhub's live trades in US hours, one tick per second; the daily bar from one quote at 16:15 New York, with open, high, low and close but no volume.",
    },
    {
      key: "chart",
      label: "Chart",
      text: record.baseSession
        ? `Daily closes as stored, each divided by the close on ${sessionShort(record.baseSession)} and multiplied by 100${record.benchmark ? `, for ${record.symbol} and ${record.benchmark} alike` : ""}: the first session ${record.benchmark ? "both have a close" : "it has a close"}. It grows by a session each day.`
        : "No session has a close yet.",
    },
    {
      key: "sigma",
      label: "Unusual",
      text: sector
        ? `The move left after subtracting ${sector}'s, measured against the last 60 trading days (σ) and recomputed nightly. A close beyond 2.5σ is an unusual move; beyond 5σ, an extremely unusual one.`
        : `Not measured against a sector fund: ${record.benchmarkReason ?? "none applies"}. The company's own move is measured against the last 60 trading days (σ) and recomputed nightly. A close beyond 2.5σ is an unusual move; beyond 5σ, an extremely unusual one.`,
    },
    {
      key: "judged",
      label: "Sessions",
      text: `Every session from ${sessionShort(record.judgedFrom)} has been checked. The bars begin earlier, backfilled from the same feed, but nothing before that date was tested, so the count does not reach back past it.`,
    },
  ];
  if (record.country) {
    rows.push({
      key: "country",
      label: "Country",
      text: `The business country the US regulator's filings give the company: ${record.country.name}.`,
    });
  }
  rows.push(
    {
      key: "split",
      label: "Currency",
      text: "Where the European Central Bank publishes the country's exchange rate, the same day's rate separates the currency's move from the stock's; where it does not, the move says why.",
    },
    {
      key: "news",
      label: "News",
      text: "Fetched because the move was unusual, never on a timer; every outlet that names the subject is kept, split at the close.",
    },
  );
  return (
    <details data-testid="record-provenance" className="group rounded-2xl border border-hairline bg-panel px-5 py-4">
      <summary className="cursor-pointer text-small font-medium text-brand-hover underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand">
        How this is calculated
      </summary>
      <dl className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} data-source={r.key} className="grid grid-cols-[5.5rem_1fr] gap-x-4 text-small leading-relaxed">
            <dt className="font-mono text-meta text-text-muted">{r.label}</dt>
            <dd className="max-w-measure text-read">{r.text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
