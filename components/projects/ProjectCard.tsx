import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "content-collections";

// Exported for reuse by the case-study fact grid (app/projects/[project]/page.tsx).
export const STATUS_COLOR: Record<Project["status"], string> = {
  Live: "text-market-up",
  Research: "text-simulated",
  "This site": "text-text-muted",
};

const STATUS_MARK: Record<Project["status"], string> = {
  Live: "●",
  Research: "◆",
  "This site": "",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-hairline bg-panel p-6",
        project.featured &&
          "border-brand/28 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--brand)_6%,transparent),transparent_130px),var(--panel)]"
      )}
    >
      <div className="flex items-center justify-between font-mono text-xs text-text-muted">
        <span className="flex items-center gap-2.5">
          <span>{project.year}</span>
          {project.featured && (
            <span className="tracking-widest text-brand-hover uppercase">Featured</span>
          )}
        </span>
        <span className={STATUS_COLOR[project.status]}>
          {STATUS_MARK[project.status]} {project.status}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-medium text-text">{project.title}</h2>
        <p className="mt-2 max-w-[60ch] text-sm text-text-muted">{project.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-4 pt-2 text-sm">
        {project.links.live && (
          <a
            href={project.links.live}
            className="inline-flex items-center gap-1 font-medium text-brand-hover hover:text-brand"
          >
            See it live <ArrowUpRight className="size-3.5" />
          </a>
        )}
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 text-text-muted hover:text-text"
        >
          Case study <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
