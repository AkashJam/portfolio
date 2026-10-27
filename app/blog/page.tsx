import type { Metadata } from "next";
import { allBlogs, allProjects } from "content-collections";

import { BlogFilter } from "@/components/blog/BlogFilter";
import { PostCard } from "@/components/blog/PostCard";
import { Container } from "@/components/shell/Container";
import { pageMetadata } from "@/lib/metadata";
import { topics } from "@/lib/topics";

export const metadata: Metadata = pageMetadata({
  path: "/blog",
  title: "Blog — Akash James",
  description: "Field notes on distributed systems, performance, and the occasional war story.",
});

// Draft posts render in `next dev` for review; hidden from production builds.
const isDev = process.env.NODE_ENV !== "production";

const heading = "text-meta font-medium tracking-[0.14em] text-text-muted uppercase";

/**
 * The index (phase18.md I30, M10; `site-review/blog-index.html`): the owner's three strongest
 * posts first as "Featured" (their `order`), then every other post as "Latest", newest first.
 * Rendered whole on the server so every link is in the HTML; BlogFilter only hides cards.
 */
export default function BlogPage() {
  const posts = allBlogs.filter((p) => isDev || !p.draft);
  const featured = posts
    .filter((p) => p.order !== undefined)
    .sort((a, b) => a.order! - b.order!);
  const latest = posts
    .filter((p) => p.order === undefined)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const projectTitles = new Map(allProjects.map((p) => [p.slug, p.title]));
  const titleOf = (slug?: string) => (slug ? projectTitles.get(slug) : undefined);
  const present = topics.filter((t) => posts.some((p) => p.topic === t));

  return (
    <div className="pt-16 pb-16">
      <Container className="relative z-10">
        <p className="mb-4 text-meta tracking-[0.2em] text-text-muted uppercase">Blog</p>
        <h1 className="text-h1 font-light text-text">Notes &amp; engineering</h1>
        <p className="mt-4 max-w-measure text-lead text-read">
          Field notes on distributed systems, performance, and the occasional war story.
        </p>

        <BlogFilter topics={present} total={posts.length}>
          {featured.length > 0 && (
            <section data-section="" aria-labelledby="featured-heading" className="reveal mt-10">
              <h2 id="featured-heading" className={heading}>
                Featured
              </h2>
              <div className="mt-3.5 grid gap-4 lg:grid-cols-3">
                {featured.map((post) => (
                  <PostCard key={post._meta.path} post={post} project={titleOf(post.project)} featured />
                ))}
              </div>
            </section>
          )}
          <section data-section="" aria-labelledby="latest-heading" className="reveal mt-14">
            <h2 id="latest-heading" className={heading}>
              Latest
            </h2>
            <div className="mt-4 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((post) => (
                <PostCard key={post._meta.path} post={post} project={titleOf(post.project)} />
              ))}
            </div>
          </section>
        </BlogFilter>
      </Container>
    </div>
  );
}
