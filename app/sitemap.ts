import type { MetadataRoute } from "next";
import { allBlogs, allProjects } from "content-collections";

import { SITE_URL } from "@/lib/site";
import { cityParams, recordPaths } from "@/lib/static-params";
import { getAtlasCities, getSensors } from "@/lib/ticker-client";

// Regenerated hourly at runtime, so a build that could not reach the ticker (the
// Docker build, CI) does not keep its city-less list: the first request after a
// deploy gets the build-time copy, the next the regenerated one (phase18.md
// step 3, M25).
export const revalidate = 3600;

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

  // A city page and a sensor's record are listed once the ticker says they exist; if
  // it cannot answer, they are omitted until the sitemap is next regenerated. Price
  // pages stay out: they are live intraday views.
  const [atlas, sensors] = await Promise.all([
    getAtlasCities({ revalidateSeconds: 3600 }),
    getSensors({ revalidateSeconds: 3600 }),
  ]);
  const cityEntries: MetadataRoute.Sitemap = cityParams(atlas).map(({ city }) => ({ url: `${SITE_URL}/atlas/${city}` }));
  const recordEntries: MetadataRoute.Sitemap = recordPaths(sensors).map((path) => ({ url: `${SITE_URL}${path}` }));

  return [...staticEntries, ...blogEntries, ...projectEntries, ...cityEntries, ...recordEntries];
}
