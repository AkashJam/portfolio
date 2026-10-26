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

// Phase 20 step 3, I8 and I24: a case study's breadcrumb is "Projects / {title}", and below 1024px
// the rail is replaced by a closed "On this page" disclosure of real links.
test.describe("a case study's header", () => {
  test("the breadcrumb is Projects / {title}, with no Overview", async ({ page }) => {
    await page.goto("/projects/market-ticker");
    await expect(page.locator("main p").filter({ hasText: "Projects /" }).first()).toHaveText("Projects / Market (Ticker)");
  });

  test("at 1440 the rail shows and the disclosure does not", async ({ page }) => {
    await page.goto("/projects/market-ticker");
    await expect(page.locator("nav[aria-label='On this page']")).toBeVisible();
    await expect(page.locator("details", { hasText: "On this page" })).toBeHidden();
  });

  test.describe("at 390px", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("a closed disclosure whose links reach the headings, with the rail gone", async ({ page }) => {
      await page.goto("/projects/market-ticker");
      await expect(page.locator("nav[aria-label='On this page']")).toBeHidden();
      const disclosure = page.locator("details", { hasText: "On this page" });
      await expect(disclosure).toBeVisible();
      await expect(disclosure).not.toHaveAttribute("open", "");
      await disclosure.getByText("On this page").click();
      await expect(disclosure.getByRole("link")).toHaveText(["Problem", "Approach", "Latency", "Results", "Lessons", "Go deeper"]);
      await disclosure.getByRole("link", { name: "Lessons" }).click();
      await expect(page).toHaveURL(/#lessons$/);
      await expect(page.getByRole("heading", { name: "Lessons" })).toBeInViewport();
    });
  });
});
