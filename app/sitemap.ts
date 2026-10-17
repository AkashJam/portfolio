import type { MetadataRoute } from "next";
import { allBlogs, allProjects } from "content-collections";

import { SITE_URL } from "@/lib/site";
import { getAtlasCities } from "@/lib/ticker-client";

const isDev = process.env.NODE_ENV !== "production";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/projects",
  "/blog",
  "/market",
  "/atlas",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));

  const blogEntries: MetadataRoute.Sitemap = allBlogs
    .filter((p) => isDev || !p.draft)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post._meta.path}`,
      lastModified: post.updated ?? post.date,
    }));

  const projectEntries: MetadataRoute.Sitemap = allProjects
    .filter((p) => isDev || !p.draft)
    .map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
    }));

  // A city page is listed once the ticker says it exists; if the ticker is down at
  // build time the sitemap simply omits them until it is next generated.
  const atlas = await getAtlasCities({ revalidateSeconds: 3600 });
  const cityEntries: MetadataRoute.Sitemap = (atlas?.rows ?? [])
    .filter((r) => r.hasCityPage)
    .map((r) => ({ url: `${SITE_URL}/atlas/${r.slug}` }));

  return [...staticEntries, ...blogEntries, ...projectEntries, ...cityEntries];
}
