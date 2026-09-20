"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { Blog } from "content-collections";

/**
 * Domain filter chips + post list (portfolio.md §18 `/blog`) — domains
 * ship as tags/categories here, not a separate `/blog/[domain]` route
 * (portfolio.md decision #4; mockups/v2 folds the dropped `blog-domain`
 * page into this index's chip filter). Filter state lives in the `tag`
 * search param (portfolio.md:156's `/blog?tag=<domain>` deep link) rather
 * than local state, so the filtered view is bookmarkable/shareable.
 */
export function PostList({ posts }: { posts: Blog[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const domain = searchParams.get("tag");

  const domains = React.useMemo(
    () => Array.from(new Set(posts.flatMap((p) => p.category.split(" · ")))).sort(),
    [posts]
  );

  const filtered = domain ? posts.filter((p) => p.category.split(" · ").includes(domain)) : posts;

  function setDomain(d: string | null) {
    router.replace(d ? `${pathname}?tag=${encodeURIComponent(d)}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDomain(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            domain === null ? "border-brand bg-brand/10 text-text" : "border-hairline text-text-muted"
          )}
        >
          All
        </button>
        {domains.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomain(d === domain ? null : d)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              domain === d ? "border-brand bg-brand/10 text-text" : "border-hairline text-text-muted"
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-hairline">
        {filtered.map((post) => (
          <Link
            key={post._meta.path}
            href={`/blog/${post._meta.path}`}
            className="group flex max-w-[68ch] flex-col gap-1.5 py-6 first:pt-0"
          >
            <span className="text-xs text-brand-hover">{post.category}</span>
            <span className="text-lg text-text group-hover:text-brand-hover">{post.title}</span>
            <span className="text-sm text-text-muted">{post.summary}</span>
            <span className="mt-1 font-mono text-xs text-text-muted">
              {new Date(post.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}{" "}
              · {post.readingMinutes} min read
              {post.updated && " · Updated"}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-text-muted">No posts in this domain yet.</p>}
      </div>
    </div>
  );
}
