import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allBlogs } from "content-collections";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/shell/Container";
import { MDXRenderer } from "@/components/mdx/MDXRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";

const isDev = process.env.NODE_ENV !== "production";

function findPost(slug: string) {
  const post = allBlogs.find((p) => p._meta.path === slug);
  if (!post || (post.draft && !isDev)) return null;
  return post;
}

export function generateStaticParams() {
  return allBlogs.filter((p) => isDev || !p.draft).map((p) => ({ slug: p._meta.path }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  return post ? { title: `${post.title} — Writing — Akash James`, description: post.summary } : {};
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  return (
    <Container className="py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        <article className="min-w-0">
          {/* Only the link is link-coloured — colouring the whole crumb made
              the category, which isn't a link, look clickable. */}
          <p className="text-xs text-text-muted">
            <Link href="/blog" className="text-brand-hover underline underline-offset-2">
              Writing
            </Link>{" "}
            / {post.category}
          </p>
          {post.draft && (
            <Badge variant="outline" className="mt-3 border-simulated bg-simulated/10 text-simulated">
              Draft — pending review
            </Badge>
          )}
          <h1 className="mt-2 max-w-[24ch] text-[clamp(28px,3.4vw,40px)] leading-[1.18] font-light text-text">
            {post.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[13px] text-text-muted">
            <span>
              {new Date(post.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
            {post.updated && (
              <>
                <span>·</span>
                <span>
                  Updated{" "}
                  {new Date(post.updated).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </>
            )}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-7 max-w-[68ch]">
            <MDXRenderer code={post.mdx} />
          </div>
        </article>

        <TableOfContents headings={post.headings} />
      </div>
    </Container>
  );
}
