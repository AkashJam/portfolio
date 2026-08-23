import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "content-collections";

const STATUS_COLOR: Record<Project["status"], string> = {
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
        project.featured && "sm:col-span-2"
      )}
    >
      <div className="flex items-center justify-between font-mono text-xs text-text-muted">
        <span>{project.year}</span>
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
        <Link href={`/projects/${project.slug}`} className="text-text-muted hover:text-text">
          Case study →
        </Link>
      </div>
    </article>
  );
}
