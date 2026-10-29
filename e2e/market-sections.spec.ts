import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 14 steps 3-5 and Phase 15 step 7: /market is Prices, What moved and why, Industries, each
// with a lede. Against the simulator the database holds no events, so the ledger is its empty
// state: a statement that the trigger is watching, not a counter. The populated ledger is
// covered against a fixture ticker (e2e-fixture/).

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the three sections in order; Prices has no heading, the others a lede", async ({ page }) => {
    await page.goto("/market");
    // Scoped to the page: the command palette carries its own (screen-reader) h2.
    const headings = page.locator("main").getByRole("heading", { level: 2 });
    await expect(headings).toHaveText(["What moved, and why", "Industries"]);
    await expect(page.getByRole("region", { name: "Prices" })).toBeVisible();

    await expect(page.getByText("When one of them moves further than it normally does")).toBeVisible();
    await expect(page.getByText("Ten worldwide industry baskets, priced once a day at the close.")).toBeVisible();
  });

  test("What moved, and why is empty and says the trigger is on and watching", async ({ page }) => {
    await page.goto("/market");
    const empty = page.getByTestId("ledger-empty");
    await expect(empty).toBeVisible();
    await expect(empty.getByRole("heading", { level: 3 })).toHaveText("Nothing unusual yet");
    await expect(empty).toContainText("The trigger is on and watching");
    await expect(empty).toContainText("sixty daily moves");
    await expect(page.getByTestId("ledger-line")).toContainText("Nothing unusual yet");
    // The fixture suite's former empty state (phase17.md step 5, decision 4): this
    // ticker has never tripped, so it is the empty ledger.
    await expect(page.getByTestId("ledger-line")).toHaveAttribute("data-kind", "empty");
    await expect(page.getByTestId("ledger")).toHaveCount(0);
  });

  test("carries no counter or progress bar: the history exists, so there is nothing to count", async ({ page }) => {
    await page.goto("/market");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\bof 60\b|\/ ?60\b|\d+ of \d+ daily moves|first trigger possible/i);
    await expect(page.locator('[role="progressbar"], progress')).toHaveCount(0);
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("ledger-empty")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("has no WCAG 2.1 AA violations, and the empty state does not overflow the screen", async ({ page }) => {
    await page.goto("/market");
    const empty = page.getByTestId("ledger-empty");
    await expect(empty).toBeVisible();
    const box = await empty.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
