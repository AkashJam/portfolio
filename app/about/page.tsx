import type { Metadata } from "next";
import { Download } from "lucide-react";

import { AboutStats } from "@/components/site/AboutStats";
import { Asterism } from "@/components/site/Asterism";
import { EducationCard } from "@/components/site/EducationCard";
import { ExperienceCard } from "@/components/site/ExperienceCard";
import { SkillsCapabilities } from "@/components/site/SkillsCapabilities";
import { Timeline } from "@/components/site/Timeline";
import { Container } from "@/components/shell/Container";
import { Button } from "@/components/ui/button";
import { education, type EducationEntry } from "@/data/education";
import { experience, type ExperienceEntry } from "@/data/experience";
import { bio, statement, workAuthorization } from "@/data/profile";
import { RESUME_HREF } from "@/lib/contact";

export const metadata: Metadata = {
  title: "About — Akash James",
  // Previously inherited the root description, which is written for Home's
  // "this site runs the thing it describes" pitch — the wrong framing on a
  // page about the person. Evidence rather than claim: the figures are the
  // ones already in data/experience.ts.
  description:
    "I build and run the Go, Vue and AWS systems behind an eLearning platform for 50,000+ learners — and the live market dashboard on this site.",
};

function TimelineWhen({
  start,
  end,
  location,
}: Pick<ExperienceEntry | EducationEntry, "start" | "end" | "location">) {
  return (
    <>
      {start}
      <br />— {end ?? "Present"}
      {location && <div className="mt-2 text-xs text-text-muted">{location}</div>}
    </>
  );
}

export default function AboutPage() {
  return (
    // portfolio.md §15 Phase 6 step 4: the asterism is a sibling of the
    // copy below, not a wrapper around it — LiveSignal's old inset-0
    // treatment sat over the reading column and degenerated on mobile.
    <section className="relative overflow-hidden pt-16 pb-16">
      <Asterism />
      <Container className="relative z-10">
        <p className="mb-4 text-xs tracking-[0.2em] text-text-muted uppercase">About</p>
        <h1 className="max-w-[20ch] text-[clamp(34px,5.2vw,60px)] leading-tight font-light text-balance text-text">
          {statement.headline}
        </h1>
        <p className="mt-4.5 max-w-[58ch] text-lg text-text-muted">{statement.subheadline}</p>

        <AboutStats />

        <p className="mt-11 max-w-[72ch] text-lg leading-relaxed text-pretty text-read">{bio[0]}</p>

        <div className="mt-8 grid items-stretch gap-7 lg:grid-cols-[1.62fr_1fr] lg:gap-14">
          <p className="text-base text-pretty text-text-muted">{bio[1]}</p>
          <div className="flex flex-col justify-end gap-3.5 border-t border-hairline pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <Button
              variant="brand"
              render={<a href={RESUME_HREF} />}
              nativeButton={false}
              className="h-auto w-fit gap-2 px-4 py-2 text-sm"
            >
              <Download className="size-4" />
              Download Résumé (PDF)
            </Button>
            <span className="text-[13.5px] leading-normal text-text-muted">{workAuthorization}</span>
          </div>
        </div>

        <h2 className="mt-[72px] text-xs tracking-[0.2em] text-text-muted uppercase">Experience</h2>
        <Timeline
          items={experience.map((entry) => ({
            when: <TimelineWhen {...entry} />,
            current: !entry.end,
            content: (
              <div key={entry.company} className="reveal">
                <ExperienceCard entry={entry} />
              </div>
            ),
          }))}
        />

        <h2 className="mt-[72px] text-xs tracking-[0.2em] text-text-muted uppercase">Education</h2>
        <Timeline
          items={education.map((entry) => ({
            when: <TimelineWhen {...entry} />,
            current: !entry.end,
            content: (
              <div key={entry.institution} className="reveal">
                <EducationCard entry={entry} />
              </div>
            ),
          }))}
        />

        <h2 className="mt-[72px] text-xs tracking-[0.2em] text-text-muted uppercase">
          Skills &amp; Capabilities
        </h2>
        <div className="reveal">
          <SkillsCapabilities />
        </div>
      </Container>
    </section>
  );
}
