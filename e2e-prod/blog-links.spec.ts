import { expect, test } from "@playwright/test";

// Phase 20 gate: "/blog and /projects serve every link in their server HTML" (M10, I21). Read with no
// script, because the failure it guards is a list that arrives after hydration, which a crawler
// never sees. Its own file, not the gate's: that one is serial and its first test fails outside US
// hours, and this has nothing to do with the market.

test("/blog serves every post as a heading link in its HTML, Featured first", async ({ request }) => {
  const html = await (await request.get("/blog")).text();
  const hrefs = [...html.matchAll(/<h3[^>]*>\s*<a[^>]*href="(\/blog\/[a-z0-9-]+)"/g)].map((m) => m[1]);
  expect(hrefs, "post links in the server HTML").toHaveLength(18);
  expect(new Set(hrefs).size).toBe(18);
  expect(hrefs.slice(0, 3)).toEqual([
    "/blog/cache-invalidation",
    "/blog/cms-parse-engine",
    "/blog/event-driven-retention",
  ]);
});

test("/projects serves every project as a heading link in its HTML, in order", async ({ request }) => {
  const html = await (await request.get("/projects")).text();
  const hrefs = [...html.matchAll(/<h2[^>]*>\s*<a[^>]*href="(\/projects\/[a-z-]+)"/g)].map((m) => m[1]);
  expect(hrefs, "project links in the server HTML").toEqual([
    "/projects/market-ticker",
    "/projects/internal-admin-tool",
    "/projects/microlearning",
    "/projects/portfolio-platform",
  ]);
});
