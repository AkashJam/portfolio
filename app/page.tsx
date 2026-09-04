import { ContactCTA } from "@/components/site/ContactCTA";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { TechBanner } from "@/components/site/TechBanner";
import { getSymbols } from "@/lib/ticker-client";

// Revalidated every 5 min rather than `no-store` — keeps Home statically
// generated (ISR) instead of forcing it fully dynamic just for the hero's
// live-stat pill, unlike the `no-store` reads Phase C's /market pages use.
const HERO_STAT_REVALIDATE_SECONDS = 300;

export default async function Home() {
  const symbols = await getSymbols({ revalidateSeconds: HERO_STAT_REVALIDATE_SECONDS });

  return (
    <>
      <Hero symbols={symbols?.map((s) => s.symbol) ?? null} />
      <TechBanner />
      {/* Featured Projects (portfolio.md §18) intentionally not built yet —
          content/projects/ only has a placeholder MDX; fabricating project
          copy for a portfolio's own case studies would be exactly the kind
          of dishonest content this project avoids elsewhere. Lands with
          real case-study content, Days 10-12. */}
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
