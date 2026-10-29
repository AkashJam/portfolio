import Link from "next/link";

import { BandChart } from "@/components/market/BandChart";
import { CoverageBlock } from "@/components/market/CoverageBlock";
import { HashOpen } from "@/components/market/HashOpen";
import { Method } from "@/components/market/Method";
import { SplitBlock } from "@/components/market/SplitBlock";
import type { LedgerEvent } from "@/lib/market-schemas";
import { thinListing } from "@/lib/prices";
import {
  badgeWord,
  bandCaption,
  breakoutDirection,
  dividendLine,
  entryHeading,
  entryThrough,
  ledgerSentence,
  recordHref,
  recordLinkText,
  sessionShort,
  sigmaLabel,
  signedChange,
  signedPercent,
} from "@/lib/ledger";
import { cn } from "@/lib/utils";

const DIRECTION = { up: "text-market-up", down: "text-market-down" } as const;
const FAINT = "text-meta leading-relaxed text-text-muted";

/**
 * *What moved, and why*: the ledger (portfolio.md §15 Phase 15 step 7, redrawn by
 * Phase 21 step 3). A record, not a feed: the unusual moves in time order, newest
 * first and never ranked, each with the news fetched afterwards to explain it. The
 * newest is a lead card; every other entry is a row that expands in place into the
 * same card and is addressable by its fragment. Each card shows its sentence and
 * chart; the rest is behind "Show details". On a calm day no request is made.
 */
export function Ledger({ events, truncated }: { events: LedgerEvent[]; truncated: boolean }) {
  if (events.length === 0) {
    return (
      <div data-testid="ledger-empty" className="rounded-2xl border border-dashed border-brand/30 bg-panel px-7 py-8">
        <h3 className="text-lead font-semibold text-read">Nothing unusual yet</h3>
        <p className="mt-2.5 max-w-measure text-small leading-relaxed text-text-muted">
          Every company is checked once, at the close, against its last sixty trading days. When a move is far larger than
          usual, it appears here with the news that explains it.
        </p>
        <p className="mt-3.5 max-w-measure text-small leading-relaxed text-text-muted">
          An empty list is a statement, not a gap: a dead feed says it is dead, a closed market says it is closed, and a
          watching page with nothing to report says that.
        </p>
      </div>
    );
  }
  const [lead, ...rest] = events;
  return (
    <div>
      <HashOpen />
      <div data-testid="ledger" className="flex flex-col gap-px overflow-hidden rounded-[14px] border border-hairline bg-hairline">
        <LeadEntry event={lead} />
        {rest.map((event) => (
          <RowEntry key={event.id} event={event} />
        ))}
      </div>
      {truncated && (
        <p data-testid="ledger-truncated" className={cn(FAINT, "mt-3")}>
          The ledger holds more entries than this page lists; the oldest are not shown.
        </p>
      )}
    </div>
  );
}

/**
 * The newest entry as a card. On a company's own record (`onRecord`) the heading is the
 * date, since the page already says whose it is, and the links back out to the record
 * and to Atlas are left off.
 */
export function LeadEntry({ event, onRecord = false }: { event: LedgerEvent; onRecord?: boolean }) {
  const dir = breakoutDirection(event);
  const fresh = event.sessionsAgo === 0;
  return (
    <article
      id={event.id}
      data-testid="ledger-lead"
      data-fresh={fresh}
      className={cn("scroll-mt-24 px-5 py-6 sm:px-[26px]", fresh ? "ledger-lead" : "bg-panel")}
      style={
        fresh
          ? {
              background: `linear-gradient(90deg, color-mix(in oklab, var(--market-${dir}) 11%, var(--panel)), var(--panel) 58%)`,
            }
          : undefined
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-h3 font-medium tracking-tight text-text">{onRecord ? sessionShort(event.sessionDate) : entryHeading(event)}</h3>
        <span className={FAINT}>{onRecord ? "at the close" : entryThrough(event)}</span>
        <Badge event={event} />
      </div>
      <Body event={event} recordLink={!onRecord} />
    </article>
  );
}

/**
 * One event as a row that expands in place, addressable by its fragment. The ledger
 * uses it for every entry after the newest; a sensor's record page uses it for all of
 * its events (Phase 16 step 2), without the link back to itself.
 */
export function RowEntry({ event, recordLink = true }: { event: LedgerEvent; recordLink?: boolean }) {
  const dir = breakoutDirection(event);
  const pct = event.price ? event.price.changePercent : null;
  return (
    <details id={event.id} data-testid="ledger-row" className="group scroll-mt-24 bg-panel">
      <summary className="grid cursor-pointer list-none grid-cols-[3.2rem_1fr_auto_1rem] items-center gap-x-3 px-5 py-[15px] hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-brand md:grid-cols-[4.75rem_1fr_5.4rem_4.25rem_1.25rem] md:gap-x-4 md:px-[26px] [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-meta tabular-nums text-text-muted">{sessionShort(event.sessionDate)}</span>
        <span className="min-w-0 text-small font-medium text-text">
          {entryHeading(event)}
          <span className="ml-2 font-mono text-meta font-normal text-text-muted">{event.symbol}</span>
        </span>
        <span className={cn("text-right font-mono text-small font-semibold tabular-nums", DIRECTION[dir])}>
          {pct === null ? "—" : signedPercent(pct)}
        </span>
        {/* Phones drop the figure: the sentence says it, and the row had no room for it. */}
        <span className="text-right font-mono text-small font-semibold tabular-nums text-text-muted max-md:hidden">
          {sigmaLabel(event.trigger.z)}
        </span>
        <span aria-hidden="true" className="text-center text-meta text-text-muted group-open:text-brand-hover">
          <span className="group-open:hidden">▾</span>
          <span className="hidden group-open:inline">▴</span>
        </span>
      </summary>
      <div className="border-t border-hairline px-5 pb-[22px] pt-1 sm:px-[26px]">
        <Body event={event} compact recordLink={recordLink} />
      </div>
    </details>
  );
}

/** The badge in words, with a dot in the direction's colour: no sigma on the surface. */
function Badge({ event }: { event: LedgerEvent }) {
  const dir = breakoutDirection(event);
  return (
    <span
      data-testid="badge"
      data-extreme={Math.abs(event.trigger.z) >= 5}
      className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-meta font-semibold text-read"
    >
      <i aria-hidden="true" className={cn("size-1.5 rounded-full", dir === "down" ? "bg-market-down" : "bg-market-up")} />
      {badgeWord(event.trigger.z)}
    </span>
  );
}

function Body({ event, compact = false, recordLink }: { event: LedgerEvent; compact?: boolean; recordLink: boolean }) {
  const dir = breakoutDirection(event);
  const { price, band } = event;
  const sentence = ledgerSentence(event);
  return (
    <>
      {price ? (
        <div className={cn("flex flex-wrap items-baseline gap-x-3.5 gap-y-1 font-mono tabular-nums", compact ? "mt-4" : "mt-3")}>
          <span className={cn("font-semibold text-text", compact ? "text-[28px]" : "text-[34px]")}>{price.close.toFixed(2)}</span>
          <span className={cn("text-body font-semibold", DIRECTION[dir])}>{signedChange(price.change)}</span>
          <span className={cn("text-body font-semibold", DIRECTION[dir])}>{signedPercent(price.changePercent)}</span>
        </div>
      ) : (
        <p className={cn(FAINT, "mt-3")}>The price move is unavailable: the daily bars for this session could not be read.</p>
      )}
      {sentence && (
        <p data-testid="says" className="mt-3 max-w-measure text-lead leading-snug text-text">
          {sentence}
        </p>
      )}
      {band && (
        <>
          <BandChart
            band={band}
            label={`${event.symbol}: ${band.close.length} closes against the normal range for each day; the last close left it on the ${dir} side`}
          />
          <p className={cn(FAINT, "mt-2")}>{bandCaption(event)}</p>
        </>
      )}
      <details data-testid="details" data-open-on-hash className="group mt-4">
        <summary className="inline-block cursor-pointer text-small font-medium text-brand-hover underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand">
          Show details
        </summary>
        <div className="mt-4 space-y-5">
          <SplitBlock event={event} />
          <Caveats event={event} />
          <CoverageBlock event={event} />
          <Method event={event} />
        </div>
      </details>
      {recordLink && (
        <p className="mt-5 text-small">
          <Link
            href={recordHref(event)}
            data-testid="record-link"
            className="text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand"
          >
            {recordLinkText(event)} →
          </Link>{" "}
          <span className={FAINT}>every time it has moved unusually, against its sector</span>
        </p>
      )}
      {recordLink && event.country?.atlas && (
        <p className="mt-5 text-small">
          <Link
            href={event.country.cityPage ? `/atlas/${event.country.slug}` : `/atlas#${event.country.slug}`}
            className="text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand"
          >
            → {event.country.name} in atlas
          </Link>{" "}
          <span className={FAINT}>{event.country.cityPage ? "its survey, series and sources" : "its row in the comparison"}</span>
        </p>
      )}
    </>
  );
}

function Caveats({ event }: { event: LedgerEvent }) {
  const lines: { key: string; text: string }[] = [];
  if (event.caveats.includes("thin_listing") && event.thin) {
    lines.push({ key: "thin", text: `${thinListing(event.thin.usdM, event.thin.asOf)}. A move this size can come from its own orders; read the news with that in mind.` });
  }
  if (event.caveats.includes("self_weight")) {
    lines.push({
      key: "self",
      text: `A large holding of its own benchmark (${event.trigger.benchmark ?? "its sector fund"}), so the sector it is measured against partly contains it.`,
    });
  }
  const dividend = dividendLine(event);
  if (dividend) lines.push({ key: "dividend", text: dividend });
  if (event.trigger.benchmark === null && event.trigger.benchmarkReason) {
    lines.push({ key: "nobench", text: `No sector benchmark: ${event.trigger.benchmarkReason}.` });
  }
  if (lines.length === 0) return null;
  return (
    <ul data-testid="caveats" className="space-y-1">
      {lines.map((l) => (
        <li key={l.key} data-caveat={l.key} className={FAINT}>
          {l.text}
        </li>
      ))}
    </ul>
  );
}
