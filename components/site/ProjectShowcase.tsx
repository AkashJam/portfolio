import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { ProjectPicture } from "@/components/projects/ProjectPicture";
import { STATUS_COLOR } from "@/components/projects/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "content-collections";

/**
 * One of Home's showcase rows (phase18.md D6, I17, I18, I20; `site-review/home.html`):
 * the project's picture beside its year and status, title, tagline and three tags,
 * sides alternating, and the picture above the text on phones. The row is one card
 * and one target: the title's link is stretched over it, and "See it live" sits above
 * that as its own link.
 *
 * A project without a capture yet draws the frame with its address and an empty panel,
 * so the rows line up.
 */
export function ProjectShowcase({ project, flip }: { project: Project; flip: boolean }) {
  const picture = project.picture ?? {
    label: project.links.live ? `akjames.dev${project.links.live}` : undefined,
  };
  return (
    <article
      className={cn(
        "group/row relative grid items-center gap-4.5 rounded-[20px] border border-hairline bg-panel p-3.5 transition-colors md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10 md:p-5",
        "hover:border-[color-mix(in_oklab,var(--brand)_45%,var(--hairline))] hover:bg-[color-mix(in_oklab,var(--brand)_4%,var(--panel))]",
        "focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-brand-hover",
      )}
    >
      <ProjectPicture picture={picture} className={cn(flip && "md:order-2")} />
      <div>
        <p className="flex items-center gap-2.5 font-mono text-meta tracking-[0.14em] text-text-muted">
          <span>{project.year}</span>
          <span className={cn("tracking-normal", STATUS_COLOR[project.status])}>
            {project.status === "Live" ? "● Live" : project.status}
          </span>
        </p>
        <h3 className="mt-3 text-[clamp(26px,3vw,36px)] leading-tight font-light tracking-tight text-text">
          <Link
            href={`/projects/${project.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[20px] after:content-['']"
          >
            {project.title}
          </Link>
        </h3>
        <p className="mt-2.5 max-w-[42ch] text-body text-read">{project.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.cardTags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-4.5 text-small">
          <span className="inline-flex items-center gap-1 text-text">
            Case study
            <ArrowRight aria-hidden="true" className="size-3.5 text-brand-hover transition-transform group-hover/row:translate-x-0.5" />
          </span>
          {project.links.live && (
            <a
              href={project.links.live}
              className="relative z-10 inline-flex items-center gap-1 text-text-muted underline decoration-hairline underline-offset-3 hover:text-text"
            >
              See it live <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
