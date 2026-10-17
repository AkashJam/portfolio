import Link from "next/link";

import { sessionShort, signedPercent } from "@/lib/ledger";
import type { SensorRecord } from "@/lib/market-schemas";

const FAINT = "font-mono text-[12.5px] leading-relaxed text-text-muted";

/**
 * The top of a sensor's record (Phase 16 step 2; mockups/market-v2/market-detail.html):
 * the breadcrumb, the title, what the sensor is, its last close with both dates, and
 * the way through to the price page. A country sensor is titled by its country and a
 * global name by its symbol; the page is the same either way. The last close is the
 * series' own last two closes, so the change is derived from two dated figures, both
 * stated. Nothing here is live: the price page is where the stream is.
 */
export function RecordHead({ record, priceHref }: { record: SensorRecord; priceHref: string }) {
  const { country, theme, symbol } = record;
  const crumb = country?.name ?? theme ?? symbol;
  const title = country?.name ?? symbol;
  const what = country
    ? `through ${symbol} · ${record.name}`
    : `${record.name} · global name · no country${theme ? ` · ${theme.toLowerCase()}` : ""}`;
  const bench = record.benchmark
    ? `benchmark ${record.benchmark}`
    : `no benchmark: ${record.benchmarkReason ?? "none is subtracted"}`;

  const { dates, close } = record.series;
  const n = close.length;
  const last = n >= 2 ? { close: close[n - 1], prev: close[n - 2], date: dates[n - 1], prevDate: dates[n - 2] } : null;
  const pct = last && last.prev ? (last.close / last.prev - 1) * 100 : null;

  return (
    <header>
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-text-muted">
        <Link href="/market" className="hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
          Market
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{crumb}</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="text-4xl font-light sm:text-5xl">{title}</h1>
          <p className="mt-2 max-w-[64ch] text-[15.5px] text-text-muted">
            {what} · {bench}
          </p>
          {record.thin && (
            <p className={`${FAINT} mt-1`}>
              Thin listing · about ${record.thin.usdM}M a day in New York (measured to {record.thin.asOf})
            </p>
          )}
        </div>
        {last && pct !== null && (
          <p data-testid="record-last" className="text-right font-mono tabular-nums">
            <span className="block text-3xl text-text">{last.close.toFixed(2)}</span>
            <span className="block text-sm text-text-muted">
              {signedPercent(pct)} · last close, {sessionShort(last.date)}, against {sessionShort(last.prevDate)}
            </span>
          </p>
        )}
      </div>
      <p className="mt-4 text-[14px]">
        <Link
          href={priceHref}
          data-testid="price-link"
          className="text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand"
        >
          Price, intraday and daily →
        </Link>{" "}
        <span className={FAINT}>candles, intervals, EMA and RSI</span>
      </p>
    </header>
  );
}
