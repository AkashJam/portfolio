import type { MetadataRoute } from "next";
import { allBlogs, allProjects } from "content-collections";

const isDev = process.env.NODE_ENV !== "production";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = ["/", "/about", "/projects", "/blog", "/market"];

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticEntries, ...blogEntries, ...projectEntries];
}
