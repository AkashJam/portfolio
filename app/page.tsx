import { ContactCTA } from "@/components/site/ContactCTA";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { TechIconGrid } from "@/components/site/TechIconGrid";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <p className="mb-8 text-xs tracking-[0.2em] text-text-muted uppercase">
            Skills &amp; Technologies — current stack (click to explore)
          </p>
          <TechIconGrid />
        </Reveal>
      </section>
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
