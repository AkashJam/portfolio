import { Suspense } from "react";
import type { Metadata } from "next";
import { allBlogs } from "content-collections";

import { PostList } from "@/components/blog/PostList";

export const metadata: Metadata = {
  title: "Writing — Akash James",
  description: "Field notes on distributed systems, performance, and the occasional war story.",
};

// Draft posts render in `next dev` for review; hidden from production builds.
const isDev = process.env.NODE_ENV !== "production";

export default function BlogPage() {
  const posts = allBlogs
    .filter((p) => isDev || !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="mb-4 text-xs tracking-[0.2em] text-text-muted uppercase">Writing</p>
      <h1 className="text-4xl font-light text-text">Notes &amp; engineering</h1>
      <p className="mt-4 max-w-[60ch] text-lg text-text-muted">
        Field notes on distributed systems, performance, and the occasional war story — filter by
        domain.
      </p>

      <div className="mt-10">
        <Suspense>
          <PostList posts={posts} />
        </Suspense>
      </div>
    </div>
  );
}
