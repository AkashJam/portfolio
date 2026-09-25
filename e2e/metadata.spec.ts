import { expect, test, type Page } from "@playwright/test";

// portfolio.md §15 Phase 7 step 2's gate — "every route returns a complete OG
// card; the home page has metadata of its own" — as a test. Needs no ticker:
// none of these routes depends on it for its metadata.
//
// Origin-agnostic on purpose: canonical/og:url are built from
// NEXT_PUBLIC_SITE_URL at build time, which is localhost in dev and the real
// domain in the Docker image. So this compares paths, and fetches each card
// through the server under test rather than whatever origin it names.
const ROUTES = [
  { path: "/", type: "website", ownCard: false },
  { path: "/about", type: "website", ownCard: false },
  { path: "/projects", type: "website", ownCard: false },
  { path: "/blog", type: "website", ownCard: false },
  { path: "/blog/cache-invalidation", type: "article", ownCard: true },
  { path: "/projects/market-ticker", type: "article", ownCard: true },
];

const meta = (page: Page, property: string) =>
  page.locator(`meta[property="${property}"]`).getAttribute("content");

/** Pathname with no trailing slash, so `/` and the bare origin compare equal. */
const pathOf = (url: string) => new URL(url).pathname.replace(/\/$/, "") || "/";

for (const { path, type, ownCard } of ROUTES) {
  test(`${path} has a complete card and its own canonical`, async ({ page, request }) => {
    await page.goto(path);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, "canonical").not.toBeNull();
    expect(pathOf(canonical!)).toBe(path);
    expect(await meta(page, "og:url")).toBe(canonical);

    for (const property of ["og:title", "og:description", "og:site_name"]) {
      expect(await meta(page, property), property).toBeTruthy();
    }
    expect(await meta(page, "og:type")).toBe(type);

    const image = await meta(page, "og:image");
    expect(image, "og:image").toBeTruthy();
    const imagePath = pathOf(image!);
    // Posts and case studies unfurl as themselves, not as the site card.
    expect(imagePath).toBe(ownCard ? `${path}/opengraph-image/card` : "/opengraph-image");

    const { pathname, search } = new URL(image!);
    const res = await request.get(pathname + search);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const png = await res.body();
    // PNG IHDR: width and height are the big-endian u32s at bytes 16 and 20.
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });
}

test("a missing route carries no canonical", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
