import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { HashOpen } from "@/components/market/HashOpen";
import { RowEntry } from "@/components/market/Ledger";
import { RecordChart } from "@/components/market/RecordChart";
import { RecordHead } from "@/components/market/RecordHead";
import { RecordProvenance } from "@/components/market/RecordProvenance";
import { Container } from "@/components/shell/Container";
import { cadence } from "@/lib/record-cadence";
import { getSensorRecord, getSensors } from "@/lib/ticker-client";
import { recordParams } from "@/lib/static-params";
import { pageMetadata } from "@/lib/metadata";

// A record changes when a close trips something or a session ends, never by the
// second: the page reads it no more often than the ticker's own memo and is built
// once in between (portfolio.md §15 Phase 16 step 2).
const REVALIDATE_SECONDS = 300;

// The route's own window, a literal because Next reads it statically: without
// it the page rendered on every request (`no-store`) although its fetch carries
// REVALIDATE_SECONDS (phase18.md step 3, M21). Keep the two equal.
export const revalidate = 300;

// A record for each of the eighteen, prerendered at build. A build that cannot reach
// the ticker (CI's) gives none, and each page is then built on its first request and
// cached for `revalidate`.
export async function generateStaticParams() {
  return recordParams(await getSensors({ revalidateSeconds: 3600 }));
}

/** The page's address: a country's slug, or a global name's symbol. */
function addressOf(record: { country: { slug: string } | null; symbol: string }): string {
  return `/market/${record.country?.slug ?? record.symbol}`;
}

// `/market/japan` and `/market/MUFG` are one page: the endpoint resolves either, and
// the canonical is the slug form, the one the site links to.
export async function generateMetadata({ params }: PageProps<"/market/[sensor]">): Promise<Metadata> {
  const name = decodeURIComponent((await params).sensor);
  const record = await getSensorRecord(name, { revalidateSeconds: REVALIDATE_SECONDS });
  if (!record) return {};
  const title = record.country?.name ?? record.theme ?? record.symbol;
  return pageMetadata({
    path: addressOf(record),
    title: `${title} — Market — Akash James`,
    description: `${record.country?.name ?? record.symbol} through ${record.symbol}: every move that tripped, and the sensor against its benchmark since the series began, each figure dated.`,
  });
}

export default async function SensorRecordPage({ params }: PageProps<"/market/[sensor]">) {
  const name = decodeURIComponent((await params).sensor);
  const record = await getSensorRecord(name, { revalidateSeconds: REVALIDATE_SECONDS });
  // Not a sensor (a sector fund, a simulator symbol, a country with none) or the ticker
  // could not answer: either way there is no record to show.
  if (!record) notFound();

  const address = addressOf(record);
  const line = cadence(record);
  return (
    <Container className="space-y-12 py-16">
      <RecordHead record={record} priceHref={`${address}/price`} />

      <section aria-labelledby="since" className="reveal">
        <h2 id="since" className="text-small font-semibold uppercase tracking-[0.16em] text-text">
          Since the series began
        </h2>
        <div className="mt-4">
          <RecordChart record={record} />
        </div>
      </section>

      <section aria-labelledby="tripped" className="reveal">
        <h2 id="tripped" className="text-small font-semibold uppercase tracking-[0.16em] text-text">
          Every move that tripped
        </h2>
        <p data-testid="record-cadence" className="mt-3 max-w-measure text-body leading-relaxed text-read">
          {line.text}
        </p>
        {record.events.length > 0 && (
          <div className="mt-5">
            <HashOpen />
            <div
              data-testid="record-events"
              className="flex flex-col gap-px overflow-hidden rounded-[14px] border border-hairline bg-hairline"
            >
              {record.events.map((event) => (
                <RowEntry key={event.id} event={event} recordLink={false} />
              ))}
            </div>
          </div>
        )}
      </section>

      <RecordProvenance record={record} />
    </Container>
  );
}
