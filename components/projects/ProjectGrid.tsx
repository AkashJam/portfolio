"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { cn } from "@/lib/utils";
import type { Project } from "content-collections";

/**
 * Search + tag filter (portfolio.md §18 `/projects`). The mock shows three
 * facet dimensions (Technology/Company/Concept), but only `tags` exists as
 * real structured data on either of the two projects that exist today —
 * neither is client work with a distinct "company" facet, so building
 * Company/Concept filters with nothing behind them would be UI that does
 * nothing. Just search + tag filtering for now; the grid itself is already
 * shaped to take a third card without changes.
 *
 * Grid is the only view built — "Showcase" (v2's scroll-snap alternate
 * layout) is undefined in the mock itself, out of scope this pass.
 */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [query, setQuery] = React.useState("");
  const [tag, setTag] = React.useState<string | null>(null);

  const tags = React.useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.tags))).sort(),
    [projects]
  );

  const filtered = projects.filter((p) => {
    const matchesTag = !tag || p.tags.includes(tag);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q));
    return matchesTag && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search — try &apos;Go&apos;, &apos;streaming&apos;, &apos;AWS&apos;…"
          className="max-w-xs border-hairline bg-panel-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              tag === null ? "border-brand bg-brand/10 text-text" : "border-hairline text-text-muted"
            )}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t === tag ? null : t)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                tag === t ? "border-brand bg-brand/10 text-text" : "border-hairline text-text-muted"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No projects match &quot;{query}&quot;.</p>
      )}
    </div>
  );
}
