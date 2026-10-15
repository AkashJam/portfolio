import type { Metadata } from "next";

import { FeedFreshnessProvider, FeedStatus } from "@/components/market/FeedStatus";
import { PricesTable, type PriceEntry } from "@/components/market/PricesTable";
import { WhatMovedEmpty } from "@/components/market/WhatMovedEmpty";
import { Container } from "@/components/shell/Container";
import { newestVintage } from "@/lib/prices";
import { getSensors, getSymbolSnapshot } from "@/lib/ticker-client";
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
  const sensors = await getSensors();

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

  return (
    // The provider spans the header and the table: PricesTable owns the page's
    // one SSE subscription, but the pill that reports on it sits up here.
    <FeedFreshnessProvider seedQuoteAt={newestVintage(entries.map((e) => e.row.asOf))}>
      <Container className="space-y-16 py-16">
        <header>
          <h1 className="text-4xl font-light">Market</h1>
          <p className={LEDE}>
            Eighteen real instruments: one bank or telecom for each of thirteen countries, and five global names.
            Prices are below; the threshold that picks out an unusual move switches on in the next release.
          </p>
        </header>

        <section aria-labelledby="prices">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="prices" className="text-2xl font-light">
              Prices
            </h2>
            <FeedStatus
              fresh={
                <span className="rounded-full border border-market-up/30 bg-panel-2 px-2.5 py-1 font-mono text-[11px] font-medium text-market-up">
                  ● SSE live
                </span>
              }
            />
          </div>
          <p className={cn(LEDE, "mb-6")}>
            One bank or telecom per country, plus five global industries. A move in a country&rsquo;s name is about
            that country; a move in a global name is about the world.
          </p>
          {entries.length > 0 ? (
            <PricesTable entries={entries} renderedAt={new Date().toISOString()} />
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
          <WhatMovedEmpty />
        </section>

        <section aria-labelledby="industries">
          <h2 id="industries" className="text-2xl font-light">
            Industries
          </h2>
          <p className={LEDE}>Ten worldwide industry baskets, priced once a day at the close.</p>
        </section>
      </Container>
    </FeedFreshnessProvider>
  );
}
