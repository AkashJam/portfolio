import Link from "next/link";

import { dayMonthYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Blog } from "content-collections";

/**
 * One post on the blog index (phase18.md I30, I32, I28; `site-review/blog-index.html`): the
 * whole card is the link (the title's link is stretched over it, one tab stop), the title is
 * the post's heading, and the meta line names its project where it has one. Featured cards
 * are larger and a shade lighter than the rest, neutral rather than indigo (I10: indigo is
 * never "Featured"), and carry no date; Latest cards lead with it.
 *
 * `data-topic` and `data-text` are what BlogFilter reads to hide a card; the card itself is
 * server-rendered, so every link is in the page's HTML.
 */
export function PostCard({
  post,
  project,
  featured = false,
}: {
  post: Blog;
  /** The post's case study's title, or undefined for a standalone post. */
  project?: string;
  featured?: boolean;
}) {
  const meta = [featured ? null : dayMonthYear(post.date), project, post.topic, `${post.readingMinutes} min`]
    .filter(Boolean)
    .join(" · ");
  return (
    <article
      data-post=""
      data-topic={post.topic}
      data-text={[post.title, post.summary, ...post.tags].join(" ").toLowerCase()}
      className={cn(
        "group/card relative flex flex-col gap-2 border bg-panel transition-colors",
        "hover:border-[color-mix(in_oklab,var(--brand)_45%,var(--hairline))]",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-hover",
        featured
          ? "gap-2.5 rounded-2xl border-[color-mix(in_oklab,var(--text)_14%,var(--hairline))] bg-panel-2 p-5.5"
          : "rounded-[14px] border-hairline p-4.5",
      )}
    >
      <h3
        className={cn(
          "leading-snug font-medium text-text group-hover/card:text-brand-hover",
          featured ? "text-[20px]" : "text-body",
        )}
      >
        <Link
          href={`/blog/${post._meta.path}`}
          className={cn(
            "outline-none after:absolute after:inset-0 after:content-['']",
            featured ? "after:rounded-2xl" : "after:rounded-[14px]",
          )}
        >
          {post.title}
        </Link>
      </h3>
      <p className="text-small text-read">{post.description ?? post.summary}</p>
      <p className="mt-auto pt-1 font-mono text-meta leading-snug text-text-muted">{meta}</p>
    </article>
  );
}
