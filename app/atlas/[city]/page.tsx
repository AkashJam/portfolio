import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Affordability } from "@/components/atlas/city/Affordability";
import { BasketBar } from "@/components/atlas/city/BasketBar";
import { CostChain } from "@/components/atlas/city/CostChain";
import { Economy } from "@/components/atlas/city/Economy";
import { LongChart } from "@/components/atlas/city/LongChart";
import { Container } from "@/components/shell/Container";
import { getAtlasCities, getAtlasCity } from "@/lib/ticker-client";
import { cityParams } from "@/lib/static-params";
import { pageMetadata } from "@/lib/metadata";

// The data refreshes daily to yearly (§8), so an hour is a staleness ceiling, not
// a freshness mechanism, as on /atlas itself.
const REVALIDATE_SECONDS = 3600;

// The route's own window, a literal because Next reads it statically: without
// it the page rendered on every request (`no-store`) although its fetches carry
// REVALIDATE_SECONDS (phase18.md step 3, M21). Keep the two equal.
export const revalidate = 3600;

// The cities that have a page, prerendered at build. A build that cannot reach the
// ticker (CI's) gives none, and each page is then built on its first request and
// cached for `revalidate`; a slug that is not a city is still a 404.
export async function generateStaticParams() {
  return cityParams(await getAtlasCities({ revalidateSeconds: REVALIDATE_SECONDS }));
}

export async function generateMetadata({ params }: PageProps<"/atlas/[city]">): Promise<Metadata> {
  const slug = decodeURIComponent((await params).city).toLowerCase();
  const city = await getAtlasCity(slug, { revalidateSeconds: REVALIDATE_SECONDS });
  if (!city?.verified) return {};
  return pageMetadata({
    path: `/atlas/${city.slug}`,
    title: `${city.city} — Atlas — Akash James`,
    description: `${city.city}: what ${city.country}'s own survey says a month costs, how the figure is built, and ${city.country}'s share prices, currency and house prices over the whole record, each figure sourced and dated.`,
  });
}

export default async function CityPage({ params }: PageProps<"/atlas/[city]">) {
  const slug = decodeURIComponent((await params).city).toLowerCase();
  const city = await getAtlasCity(slug, { revalidateSeconds: REVALIDATE_SECONDS });
  // A page ships only for a verified record; an unverified city is served by the
  // ticker but has no page here, and neither has a slug that is not a city.
  if (!city || !city.verified) notFound();

  const cur = city.survey.headline.currency;
  const euroArea = city.charts.currency.reason === "euro";
  const housingBehind = city.charts.housing.behind;
  return (
    <Container className="space-y-14 py-16">
      <header>
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-text-muted">
          <Link href="/atlas" className="hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
            Atlas
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{city.city}</span>
        </nav>
        <h1 className="mt-4 text-4xl font-light sm:text-5xl">{city.city}</h1>
        <p className="mt-2 text-[15.5px] text-text-muted">
          {city.country} · {cur === "EUR" ? "euro" : cur}
          {city.charts.shares.series ? ` · share price index, latest ${city.charts.shares.asOf}` : ""}
        </p>
        <p className="mt-3 max-w-[70ch] text-[14.5px] text-text-muted">
          The city is a label: every national figure here is {city.country}&apos;s own, and the cost of living is one survey&apos;s answer for one adult,
          with its method and its year.
        </p>
        {city.sensor && (
          <p className="mt-3 text-[14px]">
            <Link
              href={`/market/${city.slug}`}
              data-testid="sensor-link"
              className="text-brand-hover underline underline-offset-2 hover:text-brand-hover/80 focus-visible:outline-2 focus-visible:outline-brand"
            >
              {city.country} in the market, through {city.sensor} →
            </Link>
          </p>
        )}
      </header>

      <CostChain city={city} />
      <Affordability city={city} />
      <BasketBar city={city} />

      <section aria-labelledby="charts" className="space-y-10">
        <h2 id="charts" className="font-mono text-[13px] font-semibold uppercase tracking-[0.16em] text-text">
          The whole record
        </h2>
        <LongChart
          id="shares"
          title="Share price index"
          chart={city.charts.shares}
          scale="log"
          unit="index, 2015 = 100"
          caption={`OECD · monthly · local currency · index, 2015 = 100 · nominal, ${euroArea ? "in euros" : `in ${cur}: read it beside the currency below`}`}
        />
        {/* The euro has no rate against itself, so a euro page has no currency card to show, and
            nothing below it for the share price caption to point at (phase18.md step 5, M23). */}
        {!euroArea && (
          <LongChart
            id="currency"
            title={`${cur} per euro`}
            chart={city.charts.currency}
            scale="log"
            unit={`${cur} per euro`}
            caption={`ECB reference rate · monthly average from 1999 · ${cur} per euro: a rising line is a weakening ${cur}`}
          />
        )}
        <LongChart
          id="housing"
          title="House prices"
          chart={city.charts.housing}
          scale="linear"
          unit="real, 2010 = 100"
          caption="BIS real residential property prices · quarterly · 2010 = 100, indexed to this country's own 2010, so only the trajectory compares across countries"
          note={
            housingBehind > 0
              ? `This series ends ${housingBehind / 3 === 1 ? "a quarter" : `${housingBehind / 3} quarters`} behind the other countries' (${city.charts.housing.asOf}). /atlas ends every change measure at the same year, so the lag never shows there.`
              : null
          }
        />
      </section>

      <Economy city={city} />
    </Container>
  );
}
