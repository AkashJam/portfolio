import type { Metadata } from "next";

import { FeedFreshnessProvider, FeedStatus } from "@/components/market/FeedStatus";
import { MarketStateLine } from "@/components/market/MarketStateLine";
import { SessionPill } from "@/components/market/SessionPill";
import { IndustriesStrip } from "@/components/market/IndustriesStrip";
import { PricesTable, type PriceEntry } from "@/components/market/PricesTable";
import { Ledger } from "@/components/market/Ledger";
import { LedgerHead } from "@/components/market/LedgerHead";
import { Container } from "@/components/shell/Container";
import type { SectorTile } from "@/lib/industries";
import { newestVintage } from "@/lib/prices";
import { SECTORS } from "@/lib/sectors";
import { seedFromResponse } from "@/lib/market-session";
import { tapeBySymbol, trippedSymbols } from "@/lib/tape";
import { getEvents, getMarketState, getSensors, getSymbolSnapshot, getTape } from "@/lib/ticker-client";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  path: "/market",
  title: "Market — Akash James",
  description: "Eighteen real instruments, one bank or telecom for each of thirteen countries and five global names, with each price dated.",
});

// Plain-language headings, each with a lede: the explanation arrives before the
// content, not in a footnote below it (portfolio.md §15 Phase 14).
const LEDE = "mt-3 max-w-[66ch] text-[16.5px] leading-relaxed text-read";

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
          <h1 className="text-4xl font-light">Market</h1>
          <p className={LEDE}>
            Eighteen real instruments: one bank or telecom for each of thirteen countries, and five global names, read
            once a day at the close. When one moves further than it usually does, the news that explains it is fetched,
            and nothing is fetched when nothing moves. The page is quiet by construction, not by filtering.
          </p>
          <MarketStateLine initial={initialState} renderedAt={renderedAt} newestAsOf={newestAsOf} />
          {events !== null && <LedgerHead events={ledger} />}
        </header>

        <section aria-labelledby="prices">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="prices" className="text-2xl font-light">
              Prices
            </h2>
            <FeedStatus fresh={<SessionPill initial={initialState} />} />
          </div>
          <p className={cn(LEDE, "mb-6")}>
            One bank or telecom per country, plus five global industries. A move in a country&rsquo;s name is about
            that country; a move in a global name is about the world.
          </p>
          {entries.length > 0 ? (
            <PricesTable
              entries={entries}
              renderedAt={renderedAt}
              initialState={initialState}
              tape={tapeBySym}
              tripped={tripped}
            />
          ) : (
            <p className="text-sm text-text-muted">Live market data is temporarily unavailable.</p>
          )}
        </section>

        <section aria-labelledby="what-moved">
          <h2 id="what-moved" className="text-2xl font-light">
            What moved, and why
          </h2>
          <p className={cn(LEDE, "mb-6")}>
            When one of them moves further than it normally does, the news explaining it is fetched. Nothing else is,
            and on a quiet day nothing is fetched at all.
          </p>
          {events !== null ? (
            <Ledger events={ledger} truncated={events.truncated} />
          ) : (
            <p className="text-sm text-text-muted">The ledger is temporarily unavailable.</p>
          )}
        </section>

        <section aria-labelledby="industries">
          <h2 id="industries" className="text-2xl font-light">
            Industries
          </h2>
          <p className={cn(LEDE, "mb-6")}>Ten worldwide industry baskets, priced once a day at the close.</p>
          {tiles.some((t) => t.row.asOf !== null) ? (
            <IndustriesStrip tiles={tiles} renderedAt={renderedAt} />
          ) : (
            <p className="text-sm text-text-muted">Industry data is temporarily unavailable.</p>
          )}
        </section>
      </Container>
    </FeedFreshnessProvider>
  );
}
