import { Suspense } from "react";
import type { Metadata } from "next";
import { allBlogs } from "content-collections";

import { PostList } from "@/components/blog/PostList";
import { Container } from "@/components/shell/Container";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/blog",
  title: "Blog — Akash James",
  description: "Field notes on distributed systems, performance, and the occasional war story.",
});

// Draft posts render in `next dev` for review; hidden from production builds.
const isDev = process.env.NODE_ENV !== "production";

export default function BlogPage() {
  const posts = allBlogs
    .filter((p) => isDev || !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="pt-16 pb-16">
      <Container className="relative z-10">
        <p className="mb-4 text-meta tracking-[0.2em] text-text-muted uppercase">Blog</p>
        <h1 className="text-h1 font-light text-text">Notes &amp; engineering</h1>
        <p className="mt-4 max-w-measure text-lead text-read">
          Field notes on distributed systems, performance, and the occasional war story — filter by
          domain.
        </p>

        <div className="reveal mt-10">
          <Suspense>
            <PostList posts={posts} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
