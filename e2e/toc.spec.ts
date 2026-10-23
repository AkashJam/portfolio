import { expect, test } from "@playwright/test";

// Phase 18 step 6, M9: "On this page" follows where the reader is, however they got there. The old
// IntersectionObserver band missed a jump that crossed no heading and never marked the last section.

test.use({ viewport: { width: 1440, height: 900 } });

for (const [path, last] of [
  ["/projects/market-ticker", "Go deeper"],
  ["/blog/cache-invalidation", "Where a different shape fits"],
] as const) {
  test.describe(path, () => {
    const active = (page: import("@playwright/test").Page) =>
      page.locator("nav[aria-label='On this page'] a[aria-current='location']");

    test("marks the first section on load and the section a jump lands in", async ({ page }) => {
      await page.goto(path);
      const first = await page.locator("nav[aria-label='On this page'] a").first().textContent();
      await expect(active(page)).toHaveText(first!);

      // A jump to the middle crosses headings without stopping on one.
      await page.evaluate(() => scrollTo(0, Math.floor((document.documentElement.scrollHeight - innerHeight) / 2)));
      await expect(active(page)).not.toHaveText(first!);
    });

    test("marks the last section at the foot of the page", async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect(active(page)).toHaveText(last);
    });

    test("returns to the first section at the top", async ({ page }) => {
      await page.goto(path);
      const first = await page.locator("nav[aria-label='On this page'] a").first().textContent();
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect(active(page)).toHaveText(last);
      await page.evaluate(() => scrollTo(0, 0));
      await expect(active(page)).toHaveText(first!);
    });
  });
}
