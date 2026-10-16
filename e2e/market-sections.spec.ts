import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 14 steps 3-4: /market is Prices, What moved and why, Industries, each with
// a lede. Until Phase 15 switches the trigger on, What moved and why is empty and
// says why. It is a statement, not a result, so it carries no counter.

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the three sections in order, each with its lede", async ({ page }) => {
    await page.goto("/market");
    // Scoped to the page: the command palette carries its own (screen-reader) h2.
    const headings = page.locator("main").getByRole("heading", { level: 2 });
    await expect(headings).toHaveText(["Prices", "What moved, and why", "Industries"]);

    await expect(page.getByText("When one of them moves further than it normally does")).toBeVisible();
    await expect(page.getByText("Ten worldwide industry baskets, priced once a day at the close.")).toBeVisible();
  });

  test("What moved, and why is empty and says the trigger is not switched on yet", async ({ page }) => {
    await page.goto("/market");
    const empty = page.getByTestId("what-moved-empty");
    await expect(empty).toBeVisible();
    await expect(empty.getByRole("heading", { level: 3 })).toHaveText("Nothing has tripped, because nothing can yet.");
    await expect(empty).toContainText("not switched on until the next release");
    await expect(empty).toContainText("2.5σ");
  });

  test("carries no counter or progress bar: the history exists, so there is nothing to count", async ({ page }) => {
    await page.goto("/market");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\bof 60\b|\/ ?60\b|\d+ of \d+ daily moves|first trigger possible/i);
    await expect(page.locator('[role="progressbar"], progress')).toHaveCount(0);
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("what-moved-empty")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("has no WCAG 2.1 AA violations, and the empty state does not overflow the screen", async ({ page }) => {
    await page.goto("/market");
    const empty = page.getByTestId("what-moved-empty");
    await expect(empty).toBeVisible();
    const box = await empty.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
