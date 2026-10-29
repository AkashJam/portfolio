import type { CoverageItem, CoverageSource, LedgerEvent } from "@/lib/market-schemas";
import { SOURCE_LABEL, etClock, etDateClock, moreLabel, newsAbsences, newsItems, topNews } from "@/lib/ledger";

const LABEL = "mb-2 text-meta font-semibold uppercase tracking-[0.18em] text-text-muted";
const META = "mt-1 text-meta leading-normal text-text-muted";

const LANGUAGE: Record<string, string> = { pt: "in Portuguese", es: "in Spanish", en: "" };

const FORM_WORD: Record<string, string> = { "6-K": "Company announcement filed with the US regulator" };

/**
 * *News from around the move* (portfolio.md §15 Phase 15 step 7, redrawn by
 * Phase 21 step 3): every news source as one list, the first three outlets'
 * earliest headlines with their own dated times, then "+N more" for the rest.
 * Every outlet, never one headline: choosing one would be ranking. A central bank
 * or filing source that found nothing is not drawn (its absence is one line in the
 * method toggle); a news source that found nothing says so, so a quiet list is
 * never mistaken for a missing one.
 */
export function CoverageBlock({ event }: { event: LedgerEvent }) {
  const cov = event.coverage;
  if (!cov) {
    return (
      <div data-testid="coverage-pending">
        <h4 className={LABEL}>News from around the move</h4>
        <p className="text-small leading-relaxed text-read">The news for this move has not been fetched yet.</p>
        <p className={META}>It is fetched at the next run and again after the next close.</p>
      </div>
    );
  }
  const items = newsItems(event);
  const { top, rest } = topNews(items);
  const absences = newsAbsences(event);
  const others = (["centralBank", "filings"] as const)
    .map((key) => ({ key, source: cov.sources[key] }))
    .filter((x): x is { key: "centralBank" | "filings"; source: CoverageSource } => !!x.source && x.source.status !== "empty");
  return (
    <div data-testid="coverage" data-stage={cov.stage} data-complete={cov.complete} className="space-y-5">
      <section data-testid="news">
        <h4 className={LABEL}>News from around the move</h4>
        {top.length > 0 && (
          <ul className="space-y-2.5">
            {top.map((i) => (
              <li key={i.link} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-0.5">
                <a href={i.link} rel="noopener noreferrer" target="_blank" className="text-small leading-snug text-read hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
                  {i.title}
                </a>
                <time dateTime={i.publishedAt} className="font-mono text-meta text-text-muted">{etDateClock(i.publishedAt)}</time>
                <span className="font-mono text-meta text-text-muted">{i.outlet}</span>
              </li>
            ))}
          </ul>
        )}
        {rest.length > 0 && (
          <details data-testid="news-more" className="mt-2.5">
            <summary className="inline-block cursor-pointer text-small text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand">
              {moreLabel(rest)}
            </summary>
            <ul className="mt-2 space-y-2">
              {rest.map((i) => (
                <li key={i.link} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-0.5">
                  <a href={i.link} rel="noopener noreferrer" target="_blank" className="text-small leading-snug text-read hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
                    {i.title}
                  </a>
                  <time dateTime={i.publishedAt} className="font-mono text-meta text-text-muted">{etDateClock(i.publishedAt)}</time>
                  <span className="font-mono text-meta text-text-muted">
                    {i.outlet} · {i.side === "before" ? "before the close" : "after the close"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {absences.map((line) => (
          <p key={line} className="text-small leading-relaxed text-read">
            {line}
          </p>
        ))}
        {items.length === 0 && absences.length === 0 && (
          <p className="text-small leading-relaxed text-read">No news source was asked for this move.</p>
        )}
      </section>
      {others.map(({ key, source }) => (
        <section key={key} data-testid={`source-${key}`} data-status={source.status}>
          <h4 className={LABEL}>{SOURCE_LABEL[key]}</h4>
          {source.status === "error" ? (
            <>
              <p className="text-small leading-relaxed text-read">
                This source could not be read{source.attempts > 1 ? ` after ${source.attempts} attempts` : ""}.
              </p>
              <p className={META}>{source.error}</p>
            </>
          ) : (
            <ul className="space-y-2.5">
              {(source.items ?? []).map((item) => (
                <li key={item.link}>
                  <ItemView id={key} item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function ItemView({ id, item }: { id: string; item: CoverageItem }) {
  const lang = item.language ? LANGUAGE[item.language] : "";
  const when = `${etClock(item.publishedAt)} ET, ${item.side === "before" ? "before" : "after"} the close`;
  const kind = id === "centralBank" ? "Press release" : item.form ? (FORM_WORD[item.form] ?? `Form ${item.form}`) : "Filing";
  return (
    <>
      <p className="text-body font-medium leading-snug text-read">
        <a href={item.link} rel="noopener noreferrer" target="_blank" lang={item.language} className="hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
          {item.title}
        </a>
      </p>
      {item.itemCodes && item.itemCodes.length > 0 && (
        <ul data-testid="item-codes" className="mt-1 space-y-0.5 text-small text-read">
          {item.itemCodes.map((c) => (
            <li key={c.code}>
              <span className="font-mono text-text">Item {c.code}</span>
              {c.title ? ` · ${c.title}` : ""}
            </li>
          ))}
        </ul>
      )}
      <p className={META}>
        {kind} · {when}
        {lang ? ` · ${lang}` : ""}
      </p>
    </>
  );
}
