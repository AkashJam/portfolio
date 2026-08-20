import type { Metadata } from "next";
import { Download } from "lucide-react";

import { ExperienceCard } from "@/components/site/ExperienceCard";
import { ParallaxSphere } from "@/components/site/ParallaxSphere";
import { Reveal } from "@/components/site/Reveal";
import { experience } from "@/data/experience";
import { bio, statement } from "@/data/profile";
import { RESUME_HREF } from "@/lib/contact";

export const metadata: Metadata = {
  title: "About — Akash James",
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8">
        <p className="mb-4 text-xs tracking-[0.2em] text-text-muted uppercase">About</p>
        <h1 className="max-w-[20ch] text-[clamp(30px,4.4vw,52px)] leading-tight font-light text-text">
          {statement.headline}
        </h1>
        <p className="mt-4 max-w-[48ch] text-lg text-text-muted">{statement.subheadline}</p>
      </section>

      <Reveal>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[3fr_1fr]">
          <div className="flex flex-col gap-5">
            {bio.map((paragraph, i) => (
              <p key={i} className="max-w-[56ch] text-text-muted">
                {paragraph}
              </p>
            ))}
            <a
              href={RESUME_HREF}
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg border border-brand bg-[#141733] px-4 py-2 text-sm text-text transition-shadow hover:shadow-[0_0_24px_-8px_var(--brand)] focus-visible:shadow-[0_0_24px_-8px_var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <Download className="size-4" />
              Download Résumé (PDF)
            </a>
          </div>
          <div
            aria-hidden="true"
            className="aspect-square w-full max-w-50 justify-self-center rounded-full shadow-[inset_0_0_0_1px_var(--hairline),0_0_40px_-10px_var(--brand)]"
          />
        </section>
      </Reveal>

      <section className="relative overflow-hidden py-16">
        <ParallaxSphere />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <p className="mb-8 text-xs tracking-[0.2em] text-text-muted uppercase">Experience</p>
          <div className="flex flex-col gap-6">
            {experience.map((entry) => (
              <Reveal key={entry.company}>
                <ExperienceCard entry={entry} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
