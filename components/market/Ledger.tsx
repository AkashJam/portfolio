import Link from "next/link";

import { BandChart } from "@/components/market/BandChart";
import { CoverageBlock } from "@/components/market/CoverageBlock";
import { HashOpen } from "@/components/market/HashOpen";
import { SplitBlock } from "@/components/market/SplitBlock";
import type { LedgerEvent } from "@/lib/market-schemas";
import {
  bandCaption,
  breakoutDirection,
  contextLine,
  dividendLine,
  entryHeading,
  entryVia,
  recordHref,
  recordLinkText,
  sessionShort,
  sigmaLabel,
  signedChange,
  signedPercent,
} from "@/lib/ledger";
import { cn } from "@/lib/utils";

const DIRECTION = { up: "text-market-up", down: "text-market-down" } as const;
const FAINT = "font-mono text-[12px] leading-relaxed text-text-muted";

/**
 * *What moved, and why*: the ledger (portfolio.md §15 Phase 15 step 7). A record,
 * not a feed: the triggered events in time order, newest first and never ranked,
 * each earned by a move that left its band, with the news fetched afterwards to
 * explain it. The newest is open at the head; every other row is a `<details>`
 * that expands in place and is addressable by its fragment, so one event can be
 * linked before a detail route exists. Nothing here arrived unprompted, and on a
 * calm day no request is made at all.
 */
export function Ledger({ events, truncated }: { events: LedgerEvent[]; truncated: boolean }) {
  if (events.length === 0) {
    return (
      <div data-testid="ledger-empty" className="rounded-2xl border border-dashed border-brand/30 bg-panel px-7 py-8">
        <h3 className="text-[19px] font-semibold text-read">Nothing has tripped yet.</h3>
        <p className="mt-2.5 max-w-[72ch] text-[14.5px] leading-relaxed text-text-muted">
          The trigger is on and watching. It judges every sensor once, at the close, against the sixty daily moves before it,
          and the history it needs is recorded. When a move leaves its band, it appears here with the news that explains it.
        </p>
        <p className="mt-3.5 max-w-[76ch] text-[13px] leading-relaxed text-text-muted">
          An empty list is a statement, not a gap: a dead feed says it is dead, a closed market says it is closed, and a
          watching trigger with nothing to report says that.
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
      <div className="mt-6 max-w-[76ch] space-y-3 text-[13px] leading-relaxed text-text-muted">
        <p>
          <b className="font-medium text-read">This replaces the general news feed.</b> Nothing on this list arrived
          unprompted: each entry is a move that left its band, with the news fetched afterwards to explain it.
        </p>
        <p>
          <b className="font-medium text-read">Every outlet, never one headline.</b> The query returns many outlets for one
          story; choosing one would be ranking. The list is split at the close: what came before is a possible explanation,
          what came after is a reaction, and each item&rsquo;s own time decides which.
        </p>
        <p>
          <b className="font-medium text-read">Each trip is split by currency</b> where the currency has a daily rate. A move
          in a country&rsquo;s name is the home market&rsquo;s plus the currency&rsquo;s, and the ECB rate of the same day
          separates the two. Chile, Colombia and Peru cannot be split, and the five global names have no home currency.
        </p>
      </div>
    </div>
  );
}

function LeadEntry({ event }: { event: LedgerEvent }) {
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
        <h3 className="text-2xl font-semibold tracking-tight text-text">{entryHeading(event)}</h3>
        <span className={FAINT}>{entryVia(event)}</span>
      </div>
      <Body event={event} recordLink />
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
      <summary className="grid cursor-pointer list-none grid-cols-[3.2rem_1fr_auto_auto_1rem] items-center gap-x-3 px-5 py-[15px] hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-brand sm:grid-cols-[4.75rem_1fr_5.4rem_4.25rem_1.25rem] sm:gap-x-4 sm:px-[26px] [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[12px] tabular-nums text-text-muted">{sessionShort(event.sessionDate)}</span>
        <span className="min-w-0 text-[14.5px] font-medium text-text">
          {entryHeading(event)}
          <span className="ml-2 font-mono text-[12px] font-normal text-text-muted">{event.symbol}</span>
        </span>
        <span className={cn("text-right font-mono text-[13.5px] font-semibold tabular-nums", DIRECTION[dir])}>
          {pct === null ? "—" : signedPercent(pct)}
        </span>
        <span className="text-right font-mono text-[13px] font-semibold tabular-nums text-text-muted">
          {sigmaLabel(event.trigger.z)}
        </span>
        <span aria-hidden="true" className="text-center text-[12px] text-text-muted group-open:text-brand-hover">
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

function Body({ event, compact = false, recordLink }: { event: LedgerEvent; compact?: boolean; recordLink: boolean }) {
  const dir = breakoutDirection(event);
  const { price, band } = event;
  return (
    <>
      {price ? (
        <div className={cn("flex flex-wrap items-baseline gap-x-3.5 gap-y-1 font-mono tabular-nums", compact ? "mt-4" : "mt-3")}>
          <span className={cn("font-semibold text-text", compact ? "text-[28px]" : "text-[34px]")}>{price.close.toFixed(2)}</span>
          <span className={cn("text-[15px] font-semibold", DIRECTION[dir])}>{signedChange(price.change)}</span>
          <span className={cn("text-[15px] font-semibold", DIRECTION[dir])}>{signedPercent(price.changePercent)}</span>
        </div>
      ) : (
        <p className={cn(FAINT, "mt-3")}>The price move is unavailable: the daily bars for this session could not be read.</p>
      )}
      <p className="mt-2 text-[14.5px] text-read">{contextLine(event)}</p>
      {band && (
        <>
          <BandChart
            band={band}
            label={`Sixty sessions with the expectation band, the price leaving it ${dir === "down" ? "below" : "above"} on the final day`}
          />
          <p className={cn(FAINT, "mt-2")}>{bandCaption(event)}</p>
        </>
      )}
      <Caveats event={event} />
      <SplitBlock event={event} />
      <CoverageBlock event={event} />
      {recordLink && (
        <p className="mt-5 text-[13.5px]">
          <Link
            href={recordHref(event)}
            data-testid="record-link"
            className="text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand"
          >
            {recordLinkText(event)} →
          </Link>{" "}
          <span className={FAINT}>every time it has tripped, against its sector</span>
        </p>
      )}
      {event.country?.atlas && (
        <p className="mt-5 text-[13.5px]">
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
  if (event.theme === null) {
    lines.push({ key: "usd", text: "Priced in US dollars on the NYSE; the home market closed hours before this print." });
  } else {
    lines.push({ key: "usd", text: "A global name: its move is about the world rather than about America, and it has no home currency." });
  }
  if (event.caveats.includes("thin_listing") && event.thin) {
    lines.push({
      key: "thin",
      text: `Thin listing · about $${event.thin.usdM}M a day in New York (measured to ${event.thin.asOf}) · a move this size can come from its own orders; read the news below with that in mind.`,
    });
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
  return (
    <ul data-testid="caveats" className="mt-1.5 space-y-1">
      {lines.map((l) => (
        <li key={l.key} data-caveat={l.key} className={FAINT}>
          {l.text}
        </li>
      ))}
    </ul>
  );
}
