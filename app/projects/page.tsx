import type { Metadata } from "next";
import { allProjects } from "content-collections";

import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Container } from "@/components/shell/Container";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/projects",
  title: "Projects — Akash James",
  description: "Case studies from the systems I've actually built and shipped.",
});

// Draft case studies render in `next dev` for review; hidden from production builds.
const isDev = process.env.NODE_ENV !== "production";

export default function ProjectsPage() {
  const projects = allProjects
    .filter((p) => isDev || !p.draft)
    .sort((a, b) => b.year - a.year);

  return (
    <Container className="py-16">
      <p className="mb-4 text-meta tracking-[0.2em] text-text-muted uppercase">Work</p>
      <h1 className="text-h1 font-light text-text">Projects</h1>
      <p className="mt-4 max-w-measure text-lead text-read">
        Case studies from the systems behind this site — what the problem was, how it got built,
        and what I&apos;d do differently next time.
      </p>

      <div className="reveal mt-10">
        <ProjectGrid projects={projects} />
      </div>
    </Container>
  );
}
