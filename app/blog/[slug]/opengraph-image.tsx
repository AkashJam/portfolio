import { ImageResponse } from "next/og";
import { allBlogs } from "content-collections";

import { OG_SIZE, OgCard, formatOgDate, loadOgFonts } from "@/lib/og";

// A card per post (phase7.md Step 2), so a shared post unfurls
// as itself rather than as the site's generic card. Rendered on request (Next
// writes no build-time body for a metadata image in a dynamic segment).
// Deliberately no generateStaticParams/dynamicParams = false: the image route
// has a hidden [__metadata_id__] segment those don't list, so they 404 every
// card. findPost gates it instead: drafts and unknown slugs get a plain 404.
const isDev = process.env.NODE_ENV !== "production";
const MAX_CHIPS = 5;

function findPost(slug: string) {
  const post = allBlogs.find((p) => p._meta.path === slug);
  if (!post || (post.draft && !isDev)) return null;
  return post;
}

export const contentType = "image/png";

// Per-post alt text needs this rather than a static `alt` export.
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const post = findPost(params.slug);
  return [{ id: "card", size: OG_SIZE, contentType, alt: post?.title ?? "Writing — Akash James" }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = findPost((await params).slug);
  if (!post) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`Writing · ${post.category} · ${formatOgDate(post.date)} · ${post.readingMinutes} min read`}
        headline={post.title}
        summary={post.summary}
        chips={post.tags.slice(0, MAX_CHIPS)}
      />
    ),
    { ...OG_SIZE, fonts: await loadOgFonts() }
  );
}
