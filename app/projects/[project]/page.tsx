import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allProjects } from "content-collections";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shell/Container";
import { MDXRenderer } from "@/components/mdx/MDXRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { STATUS_COLOR } from "@/components/projects/ProjectCard";

const isDev = process.env.NODE_ENV !== "production";

function findProject(slug: string) {
  const project = allProjects.find((p) => p.slug === slug);
  if (!project || (project.draft && !isDev)) return null;
  return project;
}

export function generateStaticParams() {
  return allProjects.filter((p) => isDev || !p.draft).map((p) => ({ project: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[project]">): Promise<Metadata> {
  const { project: slug } = await params;
  const project = findProject(slug);
  return project
    ? { title: `${project.title} — Projects — Akash James`, description: project.summary }
    : {};
}

const FACTS = [
  { label: "Year", value: (p: (typeof allProjects)[number]) => String(p.year) },
  { label: "Role", value: (p: (typeof allProjects)[number]) => p.role },
  { label: "Focus", value: (p: (typeof allProjects)[number]) => p.focus },
] as const;

export default async function ProjectPage({ params }: PageProps<"/projects/[project]">) {
  const { project: slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();

  return (
    <Container className="py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        <article className="min-w-0">
          <p className="text-xs text-text-muted">
            <Link href="/projects" className="text-brand-hover underline underline-offset-2">
              Projects
            </Link>{" "}
            / {project.title} / Overview
          </p>

          {project.draft && (
            <Badge variant="outline" className="mt-3 border-simulated bg-simulated/10 text-simulated">
              Draft — pending review
            </Badge>
          )}
          <h1 className="mt-2.5 text-[clamp(30px,3.6vw,44px)] leading-[1.15] font-light text-text">
            {project.title}
          </h1>
          <p className="mt-3 max-w-[62ch] text-[17px] text-text-muted">{project.summary}</p>

          <div className="mt-5.5 flex flex-wrap gap-3.5">
            {project.links.live && (
              <Button render={<a href={project.links.live} />} nativeButton={false}>
                Live ↗
              </Button>
            )}
            {project.links.repo && (
              <Button
                render={<a href={project.links.repo} target="_blank" rel="noreferrer" />}
                nativeButton={false}
                variant="ghost"
              >
                GitHub ↗
              </Button>
            )}
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hairline bg-hairline sm:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="bg-panel px-4 py-3.5">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-text-muted uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1.5 font-mono text-sm font-medium text-text">{fact.value(project)}</dd>
              </div>
            ))}
            <div className="bg-panel px-4 py-3.5">
              <dt className="font-mono text-[11px] tracking-[0.14em] text-text-muted uppercase">Status</dt>
              <dd className={`mt-1.5 font-mono text-sm font-medium ${STATUS_COLOR[project.status]}`}>
                {project.status}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-9 max-w-[68ch]">
            <MDXRenderer code={project.mdx} />
          </div>
        </article>

        <TableOfContents headings={project.headings} />
      </div>
    </Container>
  );
}
