import Link from "next/link";

import { dayMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface FooterPost {
  slug: string;
  title: string;
  date: string;
  project?: string;
}

const card =
  "relative block rounded-xl border border-hairline p-3.5 px-4 transition-colors hover:border-[color-mix(in_oklab,var(--brand)_45%,var(--hairline))] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-hover";

/**
 * The end of a post (phase18.md I28; `site-review/blog-post.html`): the case study it comes
 * from, up to three related posts, then the posts before and after it by date. Plain server
 * markup and plain links. Each part is left out when it has nothing to say: a standalone post
 * has no case-study card, and a post with no relatives has no list.
 */
export function PostFooter({
  project,
  related,
  previous,
  next,
}: {
  /** The case study the post belongs to, or undefined for a standalone post. */
  project?: { slug: string; title: string };
  related: FooterPost[];
  previous: FooterPost | null;
  next: FooterPost | null;
}) {
  // "More from X" only when every one of them is: a list topped up by tags is just "Related posts".
  const heading = project && related.every((p) => p.project === project.slug) ? `More from ${project.title}` : "Related posts";
  return (
    <footer aria-label="After the post" className="mt-16 max-w-measure border-t border-hairline pt-8">
      {project && (
        <div className="relative flex items-center justify-between gap-4 rounded-[14px] border border-hairline bg-panel px-5 py-4.5 transition-colors hover:border-[color-mix(in_oklab,var(--brand)_45%,var(--hairline))] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-hover">
          <div>
            <small className="block text-meta tracking-[0.12em] text-text-muted uppercase">From the case study</small>
            <b className="mt-1 block text-lead font-medium text-text">
              <Link
                href={`/projects/${project.slug}`}
                className="outline-none after:absolute after:inset-0 after:rounded-[14px] after:content-['']"
              >
                {project.title}
              </Link>
            </b>
          </div>
          <span aria-hidden="true" className="text-lead text-brand-hover">
            →
          </span>
        </div>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className={project ? "mt-7" : undefined}>
          <h2 id="related-heading" className="text-small font-medium tracking-[0.12em] text-text-muted uppercase">
            {heading}
          </h2>
          <ul className="mt-2.5 list-none p-0">
            {related.map((post) => (
              <li key={post.slug} className="border-t border-hairline last:border-b">
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex justify-between gap-4 px-1 py-3 text-small text-text hover:text-brand-hover"
                >
                  {post.title}
                  <span className="flex-none font-mono text-meta text-text-muted">{dayMonth(post.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(previous || next) && (
        <nav aria-label="Previous and next post" className="mt-7 grid gap-3 md:grid-cols-2">
          {previous ? (
            <Link href={`/blog/${previous.slug}`} className={card}>
              <small className="block text-meta text-text-muted">← Previous</small>
              <b className="mt-1 block text-small font-medium text-text">{previous.title}</b>
            </Link>
          ) : (
            <span aria-hidden="true" className="hidden md:block" />
          )}
          {next && (
            <Link href={`/blog/${next.slug}`} className={cn(card, "md:text-right")}>
              <small className="block text-meta text-text-muted">Next →</small>
              <b className="mt-1 block text-small font-medium text-text">{next.title}</b>
            </Link>
          )}
        </nav>
      )}
    </footer>
  );
}
