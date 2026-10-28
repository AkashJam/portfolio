import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allBlogs, allProjects } from "content-collections";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/shell/Container";
import { MDXRenderer } from "@/components/mdx/MDXRenderer";
import { ContentsDisclosure } from "@/components/blog/ContentsDisclosure";
import { PostFooter } from "@/components/blog/PostFooter";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { dayMonth, dayMonthYear } from "@/lib/dates";
import { JsonLd, blogPostingLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/metadata";
import { neighbours, relatedPosts } from "@/lib/related-posts";

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
  return post
    ? pageMetadata({
        path: `/blog/${slug}`,
        title: `${post.title} — Akash James`,
        description: post.description ?? post.summary,
        article: { publishedTime: post.date, modifiedTime: post.updated, tags: post.tags },
      })
    : {};
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const visible = allBlogs
    .filter((p) => isDev || !p.draft)
    .map((p) => ({ slug: p._meta.path, title: p.title, date: p.date, tags: p.tags, project: p.project }));
  const here = visible.find((p) => p.slug === slug)!;
  const related = relatedPosts(here, visible);
  const { previous, next } = neighbours(here, visible);
  // A post's case study, or none: a standalone post, or a slug that names no project.
  const caseStudy = allProjects.find((p) => p.slug === post.project);

  return (
    <Container className="py-14">
      <JsonLd data={blogPostingLd(post)} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        <article className="min-w-0">
          {/* Only the link is link-coloured — colouring the whole crumb made
              the topic, which isn't a link, look clickable. */}
          <p className="text-meta text-text-muted">
            <Link href="/blog" className="text-brand-hover underline underline-offset-2">
              Blog
            </Link>{" "}
            / {post.topic}
          </p>
          {post.draft && (
            <Badge variant="outline" className="mt-3 border-hairline bg-panel-2 text-text-muted">
              Draft — pending review
            </Badge>
          )}
          <h1 className="mt-2 max-w-[24ch] text-h1 leading-[1.18] font-light text-text">
            {post.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-small text-text-muted">
            <span>
              {dayMonthYear(post.date)}
            </span>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
            {post.updated && (
              <>
                <span>·</span>
                <span>
                  Updated {dayMonth(post.updated)}
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

          <ContentsDisclosure headings={post.headings} />

          <div className="mt-7 max-w-measure">
            <MDXRenderer code={post.mdx} />
          </div>

          <PostFooter
            project={caseStudy && { slug: caseStudy.slug, title: caseStudy.title }}
            related={related}
            previous={previous}
            next={next}
          />
        </article>

        <TableOfContents headings={post.headings} />
      </div>
    </Container>
  );
}
