import type { Metadata } from "next";
import Link from "next/link";
import { allProjects } from "content-collections";

import { ContactCTA } from "@/components/site/ContactCTA";
import { Hero } from "@/components/site/Hero";
import { HeroLiveBand } from "@/components/site/HeroLiveBand";
import { Container } from "@/components/shell/Container";
import { ProjectShowcase } from "@/components/site/ProjectShowcase";
import { getMarketState, getSensors, getSymbolSnapshot } from "@/lib/ticker-client";
import type { PriceEntry } from "@/components/market/PricesTable";
import { fetchBandSeries } from "@/lib/band-fetch";
import { seedFromResponse } from "@/lib/market-session";
import { JsonLd, homeLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/metadata";

// Home's own metadata (Phase 7 step 2's gate) rather than the layout's
// fallback: its own canonical, og:url and a title that says what the site is.
// The description stays the layout's, which is written for this page.
export const metadata: Metadata = pageMetadata({
  path: "/",
  title: "Akash James — Full-Stack Engineer",
  description:
    "Most portfolios describe the work, this one runs it. A Go and Redis streaming backend on AWS, pushing live prices to the page you're reading.",
});

// Revalidated every 5 min rather than `no-store` — keeps Home statically
// generated (ISR) instead of forcing it fully dynamic just for the hero's
// live band, unlike the `no-store` reads /market uses. The session is read the
// same way, so the band's first paint is at most five minutes old; the shell's
// poll takes over from there.
const HERO_REVALIDATE_SECONDS = 300;
// The band opens on one fixed sensor and nothing re-ranks it (bearing.md #75, #92):
// NVDA, the most-traded sensor, so its line visibly moves in US hours. It replaced
// RY on 2026-10-20: on the real feed RY made no trade in 90 seconds at 09:45 ET
// while NVDA trades several times a second (phase14.md finding 3, phase15.md). RY
// is no longer shown anywhere on Home. If the default is missing the first sensor stands in.
const HERO_DEFAULT_SYMBOL = "NVDA";

const isDev = process.env.NODE_ENV !== "production";

export default async function Home() {
  const [sensors, marketState] = await Promise.all([
    getSensors({ revalidateSeconds: HERO_REVALIDATE_SECONDS }),
    getMarketState({ revalidateSeconds: HERO_REVALIDATE_SECONDS }),
  ]);
  // One snapshot per sensor, so the default can fall back to the first with a price.
  const entries: PriceEntry[] = await Promise.all(
    (sensors ?? []).map(async (sensor): Promise<PriceEntry> => {
      const snap = await getSymbolSnapshot(sensor.symbol, { revalidateSeconds: HERO_REVALIDATE_SECONDS });
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
  );

  const initialState = seedFromResponse(marketState);
  // A session the ticker could not report reads as open, not closed: the page never
  // says closed on a guess. An unreachable ticker leaves no sensors, so no band.
  const mode = initialState.session === "closed" ? "closed" : "open";
  const preferred = entries.find((e) => e.sensor.symbol === HERO_DEFAULT_SYMBOL && e.row.asOf !== null);
  const defaultEntry = preferred ?? entries.find((e) => e.row.asOf !== null) ?? null;
  const initialSeries = defaultEntry
    ? await fetchBandSeries(defaultEntry.sensor.symbol, mode, defaultEntry.row.asOf, {
        revalidateSeconds: HERO_REVALIDATE_SECONDS,
      })
    : null;
  // Single source of truth for "is there a live band to show" — Hero's second
  // sentence and the band itself must always agree, or the page asserts a chart
  // directly above where nothing renders.
  const hasLiveBand = defaultEntry !== null && initialSeries !== null;

  // Home showcases other work, not the site visitors are already on —
  // exclude the "This site" entry rather than hardcoding which three
  // projects to show, so a future fifth project still resolves correctly.
  const homeProjects = allProjects
    .filter((p) => (isDev || !p.draft) && p.status !== "This site")
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  return (
    <>
      <JsonLd data={homeLd()} />
      <Hero hasLiveBand={hasLiveBand}>
        {hasLiveBand && defaultEntry && initialSeries && (
          <HeroLiveBand entry={defaultEntry} initialSeries={initialSeries} initialState={initialState} />
        )}
      </Hero>

      {homeProjects.length > 0 && (
        <section className="reveal flex min-h-[calc(100svh-56px)] items-center border-b border-hairline py-18">
          <Container className="w-full">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="text-meta tracking-[0.2em] text-text-muted uppercase">Work</p>
                <h2 className="mt-3.5 text-h2 font-medium text-text">Three systems, end to end</h2>
              </div>
              <Link href="/projects" className="text-small text-brand-hover underline-offset-3 hover:underline">
                All projects →
              </Link>
            </div>
            <div className="mt-8 flex flex-col gap-5">
              {homeProjects.map((project, i) => (
                <ProjectShowcase key={project.slug} project={project} flip={i % 2 === 1} />
              ))}
            </div>
          </Container>
        </section>
      )}
      <div className="reveal">
        <ContactCTA />
      </div>
    </>
  );
}
