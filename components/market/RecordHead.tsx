import Link from "next/link";

import { sectorName, sessionShort, signedPercent } from "@/lib/ledger";
import type { SensorRecord } from "@/lib/market-schemas";
import { thinListing } from "@/lib/prices";

const FAINT = "text-meta leading-relaxed text-text-muted";

/**
 * The top of a company's record (Phase 16 step 2; Phase 21 step 4,
 * mockups/site-review/market-record.html): the breadcrumb, the title, what the company
 * is to the page in plain words, its last close with both dates, and the way through
 * to the price page. A country is titled by its name and a global name by its symbol;
 * the page is the same either way. The last close is the
 * series' own last two closes, so the change is derived from two dated figures, both
 * stated. Nothing here is live: the price page is where the stream is.
 */
export function RecordHead({ record, priceHref }: { record: SensorRecord; priceHref: string }) {
  const { country, theme, symbol } = record;
  const crumb = country?.name ?? theme ?? symbol;
  const title = country?.name ?? symbol;
  const against = record.benchmark
    ? `measured against ${sectorName(record.benchmark, true)}`
    : `not measured against a sector fund: ${record.benchmarkReason ?? "none applies"}`;
  const what = country
    ? `through ${record.name} (${symbol})`
    : `${record.name} (${symbol}), a global name${theme ? ` · ${theme.toLowerCase()}` : ""}`;

  const { dates, close } = record.series;
  const n = close.length;
  const last = n >= 2 ? { close: close[n - 1], prev: close[n - 2], date: dates[n - 1], prevDate: dates[n - 2] } : null;
  const pct = last && last.prev ? (last.close / last.prev - 1) * 100 : null;

  return (
    <header>
      <nav aria-label="Breadcrumb" className="text-meta text-text-muted">
        <Link href="/market" className="hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
          Market
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{crumb}</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="text-h1 font-light">{title}</h1>
          <p className="mt-2 max-w-measure text-body text-read">
            {what} · {against}
          </p>
          {record.thin && (
            <p className={`${FAINT} mt-1`}>
              {thinListing(record.thin.usdM, record.thin.asOf)}
            </p>
          )}
        </div>
        {last && pct !== null && (
          <p data-testid="record-last" className="text-left font-mono tabular-nums md:text-right">
            <span className="block text-3xl text-text">{last.close.toFixed(2)}</span>
            <span className="block text-small text-text-muted">
              {signedPercent(pct)} · last close, <span className="whitespace-nowrap">{sessionShort(last.date)}</span>, against{" "}
              <span className="whitespace-nowrap">{sessionShort(last.prevDate)}</span>
            </span>
          </p>
        )}
      </div>
      <p className="mt-4 text-small">
        <Link
          href={priceHref}
          data-testid="price-link"
          className="text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand"
        >
          Price, intraday and daily →
        </Link>{" "}
        <span className={FAINT}>the candlestick chart, by the minute or the day</span>
      </p>
    </header>
  );
}
