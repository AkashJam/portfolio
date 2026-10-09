import type { Metadata } from "next";

import { heroHeadline, heroRole } from "@/data/profile";

export const SITE_NAME = "Akash James";

/**
 * The root card (app/opengraph-image.tsx), stated explicitly: it only reaches
 * a child route through the inherited `openGraph`, and a route that sets its
 * own `openGraph` replaces that whole object. Only for routes *without* a card
 * file of their own — measured, not assumed: a page's `openGraph.images` beats
 * an `opengraph-image` file in the same segment, so setting this on a blog
 * post silently replaced the post's own card with the root one.
 */
const ROOT_CARD = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `Akash James, ${heroRole} in Milan. ${heroHeadline}`,
};

/**
 * Per-route metadata with its own canonical and Open Graph block
 * (phase7.md Step 2). Every route goes through this, because Next merges
 * metadata *shallowly* across segments: a page that sets `openGraph` replaces
 * the layout's whole object, so `siteName`/`locale` have to be restated each
 * time, and a `canonical` set once in the layout would leak onto every page
 * that forgot to override it, canonicalising the whole site to `/`. So the
 * layout sets none, and each route states its own here.
 *
 * `path` is relative; the layout's `metadataBase` (lib/site.ts) resolves it,
 * so canonical and og:url follow NEXT_PUBLIC_SITE_URL.
 */
export function pageMetadata({
  path,
  title,
  description,
  article,
}: {
  path: string;
  title: string;
  description: string;
  /** Present for posts and case studies: sets og:type=article, and leaves
   * og:image to the segment's own `opengraph-image` file. */
  article?: { publishedTime?: string; modifiedTime?: string; tags?: string[] };
}): Metadata {
  const base = { url: path, siteName: SITE_NAME, locale: "en_US", title, description };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: article
      ? { ...base, type: "article", authors: [SITE_NAME], ...article }
      : { ...base, type: "website", images: [ROOT_CARD] },
  };
}
