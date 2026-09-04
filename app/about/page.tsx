import type { Metadata } from "next";
import { Download } from "lucide-react";

import { EducationCard } from "@/components/site/EducationCard";
import { ExperienceCard } from "@/components/site/ExperienceCard";
import { LiveSignal } from "@/components/site/LiveSignal";
import { Reveal } from "@/components/site/Reveal";
import { SkillsCapabilities } from "@/components/site/SkillsCapabilities";
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { bio, statement, workAuthorization } from "@/data/profile";
import { RESUME_HREF } from "@/lib/contact";

export const metadata: Metadata = {
  title: "About — Akash James",
};

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-16 pb-8">
        <LiveSignal />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <p className="mb-4 text-xs tracking-[0.2em] text-text-muted uppercase">About</p>
          <h1 className="max-w-[20ch] text-[clamp(30px,4.4vw,52px)] leading-tight font-light text-text">
            {statement.headline}
          </h1>
          <p className="mt-4 max-w-[48ch] text-lg text-text-muted">{statement.subheadline}</p>
          <div className="mt-6 flex max-w-[56ch] flex-col gap-5">
            {bio.map((paragraph, i) => (
              <p key={i} className="text-text-muted">
                {paragraph}
              </p>
            ))}
          </div>
          <a
            href={RESUME_HREF}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg border border-brand bg-[#141733] px-4 py-2 text-sm text-text transition-shadow hover:shadow-[0_0_24px_-8px_var(--brand)] focus-visible:shadow-[0_0_24px_-8px_var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            <Download className="size-4" />
            Download Résumé (PDF)
          </a>
          <p className="mt-4 text-sm text-text-muted">{workAuthorization}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-xs tracking-[0.2em] text-text-muted uppercase">Experience</h2>
          <div className="flex flex-col gap-6">
            {experience.map((entry) => (
              <Reveal key={entry.company}>
                <ExperienceCard entry={entry} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-xs tracking-[0.2em] text-text-muted uppercase">Education</h2>
          <div className="flex flex-col gap-6">
            {education.map((entry) => (
              <Reveal key={entry.institution}>
                <EducationCard entry={entry} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-xs tracking-[0.2em] text-text-muted uppercase">
            Skills &amp; Capabilities
          </h2>
          <Reveal>
            <SkillsCapabilities />
          </Reveal>
        </div>
      </section>
    </>
  );
}
