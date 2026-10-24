import type { CoverageItem, CoverageOutlet, CoverageSource, LedgerEvent, Side } from "@/lib/market-schemas";
import { SOURCE_LABEL, chipsFor, etClock, leftOut, outletCount, sentence, sourcesOf } from "@/lib/ledger";
import { cn } from "@/lib/utils";

const LABEL = "mb-2 text-meta font-semibold uppercase tracking-[0.18em] text-text-muted";
const META = "mt-1 text-meta leading-normal text-text-muted";
const CHIPS = 6;

const LANGUAGE: Record<string, string> = { pt: "in Portuguese", es: "in Spanish", en: "" };

/**
 * *Why*: what was fetched because the move tripped (portfolio.md §15 Phase 15
 * step 7). Every outlet, never one headline: the query returns many outlets for
 * one story and choosing one would be ranking. Collapsed, a source shows how many
 * outlets covered the move and which, earliest first; open, every outlet with at
 * most two of its headlines. The list splits at the close by each item's own time:
 * before is a possible explanation, after is a reaction. Absences are stated, so a
 * quiet section is never mistaken for a missing one.
 */
export function CoverageBlock({ event }: { event: LedgerEvent }) {
  const cov = event.coverage;
  if (!cov) {
    return (
      <div data-testid="coverage-pending" className="mt-5 border-t border-hairline pt-4">
        <p className={LABEL}>Why</p>
        <p className="text-small leading-relaxed text-read">The news for this move has not been fetched yet.</p>
        <p className={META}>It is fetched at the next run and again after the next close.</p>
      </div>
    );
  }
  const sources = sourcesOf(event);
  return (
    <div data-testid="coverage" data-stage={cov.stage} data-complete={cov.complete} className="mt-5 border-t border-hairline pt-4">
      <p className={LABEL}>Why · fetched because the move tripped</p>
      <div className="space-y-5">
        {sources.map(({ key, source }) => (
          <SourceGroup key={key} id={key} source={source} />
        ))}
      </div>
      {!cov.complete && (
        <p data-testid="coverage-incomplete" className={cn(META, "mt-4")}>
          Fetched at the close. It is fetched once more after the next close, to add what was published after this move.
        </p>
      )}
    </div>
  );
}

function SourceGroup({ id, source }: { id: string; source: CoverageSource }) {
  return (
    <section data-testid={`source-${id}`} data-status={source.status}>
      <h4 className={LABEL}>{SOURCE_LABEL[id] ?? id}</h4>
      {source.status === "error" && (
        <>
          <p className="text-small leading-relaxed text-read">
            This source could not be read{source.attempts > 1 ? ` after ${source.attempts} attempts` : ""}.
          </p>
          <p className={META}>{source.error}</p>
        </>
      )}
      {source.status === "empty" && (
        <p className="text-small leading-relaxed text-read">{sentence(source.absent?.reason ?? "nothing was found")}</p>
      )}
      {source.status === "ok" && source.outlets && <NewsBody source={source} />}
      {source.status === "ok" && source.items && <ItemsBody id={id} source={source} />}
      {source.query && <p className={META}>{id === "centralBank" ? "Feed" : source.outlets ? "Query" : "Source"}: {source.query}</p>}
      {source.status === "empty" && id === "filings" && source.categorised === false && (
        <p className={META}>Foreign filers carry no item codes, so a 6-K cannot be categorised.</p>
      )}
    </section>
  );
}

function NewsBody({ source }: { source: CoverageSource }) {
  const n = outletCount(source);
  const note = leftOut(source);
  return (
    <div data-testid="news" className="mt-1">
      <p className="text-meta font-semibold uppercase leading-normal tracking-[0.16em] text-text-muted">
        Google News · {n} {n === 1 ? "outlet" : "outlets"} · earliest first · times ET
      </p>
      <SideChips label="before the close" chips={chipsFor(source, "before")} />
      <SideChips label="after the close" chips={chipsFor(source, "after")} />
      <details className="mt-2 group">
        <summary className="inline-block cursor-pointer text-small text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand">
          Show all {n} {n === 1 ? "outlet" : "outlets"} and their headlines
        </summary>
        <OutletTable title="Before the close — possible explanations" side="before" outlets={source.outlets ?? []} />
        <OutletTable title="After the close — reactions to the move" side="after" outlets={source.outlets ?? []} />
      </details>
      {note && <p className={META}>{note}</p>}
    </div>
  );
}

/** One line of outlets on a side of the close: how many, and the earliest few with their times. */
function SideChips({ label, chips }: { label: string; chips: { name: string; time: string }[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="min-w-[8rem] font-mono text-meta text-text-muted">
        {label} · {chips.length}
      </span>
      {chips.slice(0, CHIPS).map((c) => (
        <span
          key={c.name}
          className="rounded-[7px] border border-hairline bg-panel-2 px-[7px] py-[5px] font-mono text-meta leading-none text-read"
        >
          {c.name}
          <i className="ml-[5px] not-italic text-text-muted">{c.time}</i>
        </span>
      ))}
      {chips.length > CHIPS && (
        <span className="rounded-[7px] border border-hairline bg-panel-2 px-[7px] py-[5px] font-mono text-meta leading-none text-text-muted">
          +{chips.length - CHIPS}
        </span>
      )}
    </div>
  );
}

function OutletTable({ title, side, outlets }: { title: string; side: Side; outlets: CoverageOutlet[] }) {
  const rows = outlets
    .map((o) => ({ outlet: o, items: o.items.filter((i) => i.side === side) }))
    .filter((r) => r.items.length > 0)
    .sort((a, b) => (a.items[0].publishedAt < b.items[0].publishedAt ? -1 : 1));
  if (rows.length === 0) return null;
  return (
    <table className="mt-2 mb-2.5 w-full border-collapse text-left" data-testid={`outlets-${side}`}>
      <caption className="pb-1.5 pt-2 text-left text-meta font-semibold uppercase tracking-[0.14em] text-text-muted">
        {title}
      </caption>
      <thead className="sr-only">
        <tr>
          <th>Outlet</th>
          <th>Headline</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ outlet, items }) => (
          <tr key={outlet.name}>
            <td className="w-px whitespace-nowrap border-b border-hairline py-[7px] pr-2.5 align-top font-mono text-meta font-medium text-text">
              {outlet.name}
            </td>
            <td className="border-b border-hairline py-[7px] pr-2.5 align-top text-small text-read">
              {items.map((i) => (
                <div key={i.link}>
                  <a href={i.link} rel="noopener noreferrer" target="_blank" className="hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
                    {i.title}
                  </a>
                </div>
              ))}
            </td>
            <td className="w-px whitespace-nowrap border-b border-hairline py-[7px] text-right align-top font-mono text-meta text-text-muted">
              {etClock(items[0].publishedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ItemsBody({ id, source }: { id: string; source: CoverageSource }) {
  return (
    <ul className="space-y-2.5">
      {(source.items ?? []).map((item) => (
        <li key={item.link}>
          <ItemView id={id} item={item} />
        </li>
      ))}
    </ul>
  );
}

function ItemView({ id, item }: { id: string; item: CoverageItem }) {
  const lang = item.language ? LANGUAGE[item.language] : "";
  const when = `${etClock(item.publishedAt)} ET, ${item.side === "before" ? "before" : "after"} the close`;
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
        {id === "centralBank" ? "Press release" : item.form ? `Form ${item.form}` : "Filing"} · {when}
        {lang ? ` · ${lang}` : ""}
      </p>
    </>
  );
}
