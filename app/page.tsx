import Link from "next/link";
import { allProjects } from "content-collections";

import { ContactCTA } from "@/components/site/ContactCTA";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { TechBanner } from "@/components/site/TechBanner";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getSymbols } from "@/lib/ticker-client";

// Revalidated every 5 min rather than `no-store` — keeps Home statically
// generated (ISR) instead of forcing it fully dynamic just for the hero's
// live-stat pill, unlike the `no-store` reads Phase C's /market pages use.
const HERO_STAT_REVALIDATE_SECONDS = 300;

const isDev = process.env.NODE_ENV !== "production";

export default async function Home() {
  const symbols = await getSymbols({ revalidateSeconds: HERO_STAT_REVALIDATE_SECONDS });
  const featuredProjects = allProjects.filter((p) => p.featured && (isDev || !p.draft));

  return (
    <>
      <Hero symbols={symbols?.map((s) => s.symbol) ?? null} />
      <TechBanner />
      {featuredProjects.length > 0 && (
        <Reveal>
          <section className="mx-auto max-w-6xl px-4 py-16">
            <p className="mb-4 text-xs tracking-[0.2em] text-text-muted uppercase">Work</p>
            <h2 className="text-3xl font-light text-text">Featured projects</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
            <Link
              href="/projects"
              className="mt-6 inline-block text-sm text-text-muted hover:text-text"
            >
              View all projects →
            </Link>
          </section>
        </Reveal>
      )}
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
