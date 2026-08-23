import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allProjects } from "content-collections";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MDXRenderer } from "@/components/mdx/MDXRenderer";

export function generateStaticParams() {
  return allProjects.map((p) => ({ project: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[project]">): Promise<Metadata> {
  const { project: slug } = await params;
  const project = allProjects.find((p) => p.slug === slug);
  return project
    ? { title: `${project.title} — Projects — Akash James`, description: project.summary }
    : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[project]">) {
  const { project: slug } = await params;
  const project = allProjects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="mb-6 text-xs text-text-muted">
        <Link href="/projects" className="hover:text-text">
          Projects
        </Link>{" "}
        / {project.title} / Overview
      </p>

      <div className="rounded-2xl border border-hairline bg-panel p-6 sm:p-8">
        <h1 className="text-3xl font-light text-text">{project.title}</h1>
        <p className="mt-2 max-w-[60ch] text-text-muted">{project.summary}</p>

        <div className="mt-6 flex flex-wrap gap-3">
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

        <dl className="mt-6 grid grid-cols-2 gap-4 font-mono text-sm sm:grid-cols-4">
          <div>
            <dt className="text-text-muted">Year</dt>
            <dd className="text-text">{project.year}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Role</dt>
            <dd className="text-text">{project.role}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Focus</dt>
            <dd className="text-text">{project.focus}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Status</dt>
            <dd className="text-text">{project.status}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <article className="mt-10">
        <MDXRenderer code={project.mdx} />
      </article>
    </div>
  );
}
