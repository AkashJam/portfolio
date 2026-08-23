import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allBlogs } from "content-collections";

import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto flex max-w-5xl gap-12 px-4 py-16">
      <article className="min-w-0 flex-1 max-w-[70ch]">
        <p className="mb-2 text-xs text-brand-hover">
          <Link href="/blog" className="hover:text-brand">
            Writing
          </Link>{" "}
          / {post.category}
        </p>
        {post.draft && (
          <Badge variant="outline" className="mb-3 border-simulated bg-simulated/10 text-simulated">
            Draft — pending review
          </Badge>
        )}
        <h1 className="text-3xl font-light text-text">{post.title}</h1>
        <p className="mt-2 font-mono text-sm text-text-muted">
          {new Date(post.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          · {post.readingMinutes} min read
          {post.updated && " · Updated"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-hairline bg-panel-2 text-text-muted">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-8">
          <MDXRenderer code={post.mdx} />
        </div>
      </article>

      <TableOfContents headings={post.headings} />
    </div>
  );
}
