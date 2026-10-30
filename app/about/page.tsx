import type { Metadata } from "next";
import { Download } from "lucide-react";

import { AboutStats } from "@/components/site/AboutStats";
import { EducationCard } from "@/components/site/EducationCard";
import { ExperienceCard } from "@/components/site/ExperienceCard";
import { SkillsCapabilities } from "@/components/site/SkillsCapabilities";
import { Timeline } from "@/components/site/Timeline";
import { Container } from "@/components/shell/Container";
import { buttonVariants } from "@/components/ui/button";
import { education, type EducationEntry } from "@/data/education";
import { experience, type ExperienceEntry } from "@/data/experience";
import { bio, statement, workAuthorization } from "@/data/profile";
import { RESUME_HREF } from "@/lib/contact";
import { JsonLd, profilePageLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About — Akash James",
  // Previously inherited the root description, which is written for Home's
  // "this site runs the thing it describes" pitch — the wrong framing on a
  // page about the person. Evidence rather than claim: the figures are the
  // ones already in data/experience.ts.
  description:
    "I build and run the Go, Vue and AWS systems behind an eLearning platform for 50,000+ learners — and the live market dashboard on this site.",
});

function TimelineWhen({
  start,
  end,
  location,
  stacked,
}: Pick<ExperienceEntry | EducationEntry, "start" | "end" | "location"> & {
  /** Break between the years from `lg`, where the long month names do not fit the 190px column on one line; phones always read on one line. */
  stacked?: boolean;
}) {
  return (
    <>
      {start}
      {stacked ? <br className="max-lg:hidden" /> : null}
      {" "}— {end ?? "Present"}
      {location && (
        <div className="inline text-meta text-text-muted lg:mt-2 lg:block">
          <span className="lg:hidden"> · </span>
          {location}
        </div>
      )}
    </>
  );
}

export default function AboutPage() {
  return (
    <section className="pt-16 pb-16">
      <JsonLd data={profilePageLd()} />
      <Container className="relative z-10">
        <p className="mb-4 text-meta tracking-[0.2em] text-text-muted uppercase">About</p>
        <h1 className="max-w-[20ch] text-h1 leading-tight font-light text-balance text-text">
          {statement.headline}
        </h1>
        <p className="mt-4.5 max-w-measure text-lead text-read">{statement.subheadline}</p>

        <AboutStats />

        <div className="mt-11 grid items-end gap-6 lg:grid-cols-[1.62fr_1fr] lg:gap-12">
          <div className="max-w-[72ch] text-pretty text-read">
            <p className="text-lead">{bio[0]}</p>
            <p className="mt-4 text-body">{bio[1]}</p>
          </div>
          <div className="flex flex-col gap-3 border-t border-hairline pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <a
              href={RESUME_HREF}
              className={cn(buttonVariants({ variant: "brand" }), "h-auto w-fit gap-2 px-4 py-2 text-small")}
            >
              <Download aria-hidden="true" className="size-4" />
              Download résumé
            </a>
            <span className="text-small leading-normal text-text-muted">{workAuthorization}</span>
          </div>
        </div>

        <h2 className="mt-[72px] text-meta tracking-[0.2em] text-text-muted uppercase">Experience</h2>
        <Timeline
          mobileRail={false}
          items={experience.map((entry) => ({
            when: <TimelineWhen {...entry} stacked />,
            current: !entry.end,
            content: (
              <div key={entry.company} className="reveal">
                <ExperienceCard entry={entry} />
              </div>
            ),
          }))}
        />

        <h2 className="mt-[72px] text-meta tracking-[0.2em] text-text-muted uppercase">Education</h2>
        <Timeline
          mobileRail={false}
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

        <h2 className="mt-[72px] text-meta tracking-[0.2em] text-text-muted uppercase">
          Skills &amp; Capabilities
        </h2>
        <div className="reveal">
          <SkillsCapabilities />
        </div>
      </Container>
    </section>
  );
}
