import type { Metadata } from "next";

import { FeedFreshnessProvider } from "@/components/market/FeedStatus";
import { MarketHeadState } from "@/components/market/MarketHeadState";
import { IndustriesStrip } from "@/components/market/IndustriesStrip";
import { PricesTable, type PriceEntry } from "@/components/market/PricesTable";
import { Ledger } from "@/components/market/Ledger";
import { Container } from "@/components/shell/Container";
import type { SectorTile } from "@/lib/industries";
import { newestVintage } from "@/lib/prices";
import { SECTORS } from "@/lib/sectors";
import { headLine } from "@/lib/ledger";
import { seedFromResponse } from "@/lib/market-session";
import { tapeBySymbol, trippedSymbols } from "@/lib/tape";
import { getEvents, getMarketState, getSensors, getSymbolSnapshot, getTape } from "@/lib/ticker-client";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  path: "/market",
  title: "Market — Akash James",
  description: "Most days, markets just drift. One major company is watched for each of 13 countries, plus five global companies, and a move far larger than usual fetches the news behind it.",
});

// Plain-language headings, each with a lede: the explanation arrives before the
// content, not in a footnote below it (portfolio.md §15 Phase 14).
const LEDE = "mt-3 max-w-measure text-body leading-relaxed text-read";

export default async function MarketPage() {
  const renderedAt = new Date().toISOString();
  // The ten sector baskets and the session are read alongside the sensor list:
  // none waits on another.
  const [sensors, marketState, events, tape, tiles] = await Promise.all([
    getSensors(),
    getMarketState(),
    // The ledger and the tape change at the close, not by the second; the ticker
    // holds them for a minute and the page reads them no more often than that.
    getEvents({ revalidateSeconds: 60 }),
    getTape({ revalidateSeconds: 60 }),
    Promise.all(
      SECTORS.map(async (sector): Promise<SectorTile> => {
        const snap = await getSymbolSnapshot(sector.symbol);
        return {
          symbol: sector.symbol,
          label: sector.label,
          row: {
            symbol: sector.symbol,
            price: snap?.price ?? 0,
            prevClose: snap?.prevClose ?? 0,
            change: snap?.change ?? 0,
            changePercent: snap?.changePercent ?? 0,
            asOf: snap?.asOf ?? null,
          },
        };
      }),
    ),
  ]);

  // One snapshot per sensor. A snapshot that cannot be read leaves its row in
  // place with a dash, rather than removing a sensor from the page.
  const entries: PriceEntry[] = sensors
    ? await Promise.all(
        sensors.map(async (sensor): Promise<PriceEntry> => {
          const snap = await getSymbolSnapshot(sensor.symbol);
          return {
            sensor,
            row: {
              symbol: sensor.symbol,
              price: snap?.price ?? 0,
              prevClose: snap?.prevClose ?? 0,
              change: snap?.change ?? 0,
              changePercent: snap?.changePercent ?? 0,
              asOf: snap?.asOf ?? null,
            },
          };
        }),
      )
    : [];

  // The server's own answer is the first paint's state, so a closed market does not
  // flash its open treatment; the shell's poll takes over from there.
  const initialState = seedFromResponse(marketState);
  const ledger = events?.events ?? [];
  const tapeBySym = tapeBySymbol(tape);
  const tripped = trippedSymbols(ledger);
  const newestAsOf = newestVintage(entries.map((e) => e.row.asOf));

  return (
    // The provider spans the header and the table: PricesTable owns the page's
    // one SSE subscription, but the pill that reports on it sits up here.
    <FeedFreshnessProvider seedQuoteAt={newestAsOf}>
      <Container className="space-y-16 py-16">
        <header>
          <h1 className="text-h1 font-light">Market</h1>
          <p className="mt-4 max-w-measure text-lead text-text">
            Most days, markets just drift. This page waits for the days they don&rsquo;t.
          </p>
          <p className="mt-2.5 max-w-measure text-body leading-relaxed text-read">
            One major company is watched for each of 13 countries, plus five global companies. Prices stream live while
            New York trades. At each close, a move far larger than usual fetches the news that explains it. Most days
            nothing appears here, because nothing unusual happened.
          </p>
          <MarketHeadState
            initial={initialState}
            renderedAt={renderedAt}
            newestAsOf={newestAsOf}
            head={events !== null ? headLine(ledger) : null}
          />
        </header>

        <section aria-label="Prices" className="reveal !mt-8">
          {entries.length > 0 ? (
            <PricesTable
              entries={entries}
              initialState={initialState}
              tape={tapeBySym}
              tripped={tripped}
            />
          ) : (
            <p className="text-small text-text-muted">Live market data is temporarily unavailable.</p>
          )}
        </section>

        <section aria-labelledby="what-moved" className="reveal">
          <h2 id="what-moved" className="text-h2 font-medium">
            What moved, and why
          </h2>
          <p className={cn(LEDE, "mb-6")}>
            When one of them moves further than it normally does, the news explaining it is fetched. Nothing else is,
            and on a quiet day nothing is fetched at all.
          </p>
          {events !== null ? (
            <Ledger events={ledger} truncated={events.truncated} />
          ) : (
            <p className="text-small text-text-muted">The ledger is temporarily unavailable.</p>
          )}
        </section>

        <section aria-labelledby="industries" className="reveal">
          <h2 id="industries" className="text-h2 font-medium">
            Industries
          </h2>
          <p className={cn(LEDE, "mb-6")}>Ten worldwide industry baskets, priced once a day at the close.</p>
          {tiles.some((t) => t.row.asOf !== null) ? (
            <IndustriesStrip tiles={tiles} renderedAt={renderedAt} />
          ) : (
            <p className="text-small text-text-muted">Industry data is temporarily unavailable.</p>
          )}
        </section>
      </Container>
    </FeedFreshnessProvider>
  );
}
