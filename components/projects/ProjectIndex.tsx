import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProjectPicture } from "@/components/projects/ProjectPicture";
import { STATUS_COLOR, STATUS_MARK } from "@/components/projects/status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "content-collections";

// The picture's frame for a project: its own, or, until Phase 23's capture exists, the
// frame with its address and an empty panel (as Home's rows draw it).
const pictureOf = (project: Project) =>
  project.picture ?? { label: project.links.live ? `akjames.dev${project.links.live}` : undefined };

// One grid for the header and every row: project, role and focus, year, status.
const COLUMNS =
  "grid items-baseline gap-4 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_56px] lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_64px_84px]";

/**
 * /projects (phase18.md I20, I21; `site-review/projects.html`): an index of every project in
 * the shared `order`, with a preview. Each row is the link (its title's link stretched over
 * it, one tab stop); "See it live" is its own link above that. Hovering or focusing a row
 * shows its picture and three tags beside the table, the first project's until then. That
 * is CSS alone (`.proj-*` in globals.css), so the page is server-rendered with every link in
 * its HTML. The preview is decoration for sighted mouse users, so it is hidden from
 * screen readers and every fact is in the row; on phones it goes and each row carries its
 * picture inline.
 */
export function ProjectIndex({ projects }: { projects: Project[] }) {
  return (
    <div className="proj-idx mt-10 grid items-start gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div role="list" className="proj-list border-t border-hairline">
        <div
          aria-hidden="true"
          className={cn(
            COLUMNS,
            "hidden border-b border-hairline px-3 py-2.5 font-mono text-meta tracking-[0.12em] text-text-muted uppercase md:grid"
          )}
        >
          <span>Project</span>
          <span>Role · focus</span>
          <span>Year</span>
          <span className="hidden lg:inline">Status</span>
        </div>
        {projects.map((project) => (
          <article
            key={project.slug}
            role="listitem"
            className={cn(
              COLUMNS,
              "proj-row group/row relative rounded-[10px] border-b border-hairline px-1 py-4 transition-colors md:px-3 md:py-4.5",
              "hover:bg-[color-mix(in_oklab,var(--brand)_6%,transparent)] focus-within:bg-[color-mix(in_oklab,var(--brand)_6%,transparent)]",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-hover"
            )}
          >
            <div>
              {/* On phones the picture sits above the title; decorative, like the preview. */}
              <div aria-hidden="true" className="mb-3 md:hidden">
                <ProjectPicture picture={pictureOf(project)} />
              </div>
              <h2 className="text-[20px] leading-snug font-medium text-text group-hover/row:text-brand-hover group-focus-within/row:text-brand-hover">
                <Link
                  href={`/projects/${project.slug}`}
                  className="outline-none after:absolute after:inset-0 after:rounded-[10px] after:content-['']"
                >
                  {project.title}
                </Link>
              </h2>
              <p className="mt-1 text-small text-read">{project.tagline}</p>
              {project.links.live && (
                <a
                  href={project.links.live}
                  className="relative z-10 mt-2 inline-flex items-center gap-0.5 text-meta text-text-muted underline decoration-hairline underline-offset-3 hover:text-text"
                >
                  See it live <ArrowUpRight aria-hidden="true" className="size-3" />
                </a>
              )}
            </div>
            <p className="text-small text-read">
              {project.role}
              <span className="mt-0.5 block text-meta text-text-muted">{project.focus}</span>
            </p>
            <p className="font-mono text-small text-text-muted">{project.year}</p>
            <p className={cn("hidden font-mono text-meta lg:block", STATUS_COLOR[project.status])}>
              {STATUS_MARK[project.status]} {project.status}
            </p>
          </article>
        ))}
      </div>

      <aside aria-hidden="true" className="proj-preview sticky top-22 hidden md:block">
        {projects.map((project) => (
          <figure key={project.slug} className="proj-pv m-0">
            <ProjectPicture picture={pictureOf(project)} />
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {project.cardTags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
                  {tag}
                </Badge>
              ))}
            </div>
          </figure>
        ))}
      </aside>
    </div>
  );
}
