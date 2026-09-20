import Link from "next/link";
import { allProjects } from "content-collections";

import { ContactCTA } from "@/components/site/ContactCTA";
import { Hero } from "@/components/site/Hero";
import { HeroLiveBand } from "@/components/site/HeroLiveBand";
import { Reveal } from "@/components/site/Reveal";
import { Container } from "@/components/shell/Container";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getCandles, getSymbolSnapshot, getSymbols } from "@/lib/ticker-client";
import type { SymbolSnapshot } from "@/lib/market-schemas";

// Revalidated every 5 min rather than `no-store` — keeps Home statically
// generated (ISR) instead of forcing it fully dynamic just for the hero's
// live band, unlike the `no-store` reads Phase C's /market pages use.
const HERO_STAT_REVALIDATE_SECONDS = 300;
const HERO_TAPE_SIZE = 4;
const HERO_SPARKLINE_POINTS = 20;
const HERO_SPARKLINE_INTERVAL = "1m";

// Tools built with this site itself (Next.js/React/Go/etc.) aren't sourced
// dynamically the way ProjectGrid's tag filters are — there's exactly one
// "Built with" line and it describes the two repos behind akjames.dev, not
// a taxonomy that grows with content. Deliberately excludes Node.js: this
// site's own stack is Next.js + Go, no separate Node backend service (see
// SkillsCapabilities.tsx's comment on the same distinction for a personal
// skills claim, which is a different, broader claim than this one).
const BUILT_WITH = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind",
  "Go",
  "GraphQL",
  "Redis",
  "PostgreSQL",
  "TimescaleDB",
  "Docker",
  "Terraform",
  "AWS",
  "CI/CD",
];

const isDev = process.env.NODE_ENV !== "production";

export default async function Home() {
  const symbols = await getSymbols({ revalidateSeconds: HERO_STAT_REVALIDATE_SECONDS });
  // Alphabetical rather than a hardcoded symbol list — reproduces the sim
  // roster's own HELIX/NOVA/ORBIT/PULSE order without assuming exact names
  // this environment can't verify against a running backend.
  const tapeSymbols = (symbols ?? [])
    .slice()
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .slice(0, HERO_TAPE_SIZE);
  // The hero chart wants one symbol whose shape reads as "the live system
  // working" at a glance — a steady regime, not a gappy or mean-reverting
  // one — so it's picked by regime rather than hardcoded.
  const chartSymbolEntry =
    tapeSymbols.find((s) => s.regime.toLowerCase().includes("steady")) ?? tapeSymbols[0];

  const [snapshots, chartCandles] = await Promise.all([
    Promise.all(tapeSymbols.map((s) => getSymbolSnapshot(s.symbol))),
    chartSymbolEntry ? getCandles(chartSymbolEntry.symbol, HERO_SPARKLINE_INTERVAL) : null,
  ]);
  const heroSnapshots = snapshots.filter((s): s is SymbolSnapshot => s !== null);
  const heroSparkline = (chartCandles?.candles ?? [])
    .slice(-HERO_SPARKLINE_POINTS)
    .map((c) => c.close);

  // Home showcases other work, not the site visitors are already on —
  // exclude the "This site" entry rather than hardcoding which three
  // projects to show, so a future fifth project still resolves correctly.
  const homeProjects = allProjects
    .filter((p) => (isDev || !p.draft) && p.status !== "This site")
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year)
    .slice(0, 3);

  return (
    <>
      <Hero />
      {heroSnapshots.length > 0 && chartSymbolEntry && heroSparkline.length > 0 && (
        <HeroLiveBand
          initialSnapshots={heroSnapshots}
          chartSymbol={chartSymbolEntry.symbol}
          initialSparkline={heroSparkline}
        />
      )}

      {homeProjects.length > 0 && (
        <Reveal>
          <section className="py-16">
            <Container>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="mb-4 text-xs tracking-[0.2em] text-text-muted uppercase">Work</p>
                  <h2 className="text-3xl font-light text-text">Three systems, end to end</h2>
                </div>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
                >
                  All projects →
                </Link>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {homeProjects.map((project) => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </div>
              <div className="mt-12 flex flex-col items-baseline gap-2 border-t border-hairline pt-6 sm:flex-row sm:gap-6">
                <span className="flex-none font-mono text-[11px] tracking-[0.18em] text-text-muted uppercase">
                  Built with
                </span>
                <p className="font-mono text-xs text-text-muted">{BUILT_WITH.join(" · ")}</p>
              </div>
            </Container>
          </section>
        </Reveal>
      )}
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
