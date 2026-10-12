import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Phase 11 step 2: the /atlas scatter. Needs the ticker (real /atlas/cities).

test("default view plots 23 countries with Türkiye on neither clip axis", async ({ page }) => {
  await page.goto("/atlas");
  await expect(page.locator("svg[role=img] g[data-slug]")).toHaveCount(23);
  await expect(page.locator("g[data-clipped]")).toHaveCount(0);
});

test("shares on an axis clips Türkiye to the edge and says so", async ({ page }) => {
  await page.goto("/atlas");
  await page.getByLabel("Vertical").selectOption("shares");
  const tr = page.locator('g[data-slug="turkiye"]');
  await expect(tr).toHaveAttribute("data-clipped", "y");
  await page.getByLabel("Horizontal").selectOption("prices");
  await expect(tr).toHaveAttribute("data-clipped", "x y");
  await expect(tr.locator("text")).toContainText("+1,223% \u00b7 +1,725%");
  await page.getByLabel("Horizontal").selectOption("everydaySpendingEur");
  await expect(tr.locator("text")).toContainText("1,725%");
  await expect(page.getByText("Off the axis:")).toBeVisible();
});

test("y = x is drawn for prices against shares and nowhere else", async ({ page }) => {
  await page.goto("/atlas");
  await expect(page.getByText("kept pace with prices")).toHaveCount(0);
  await page.getByLabel("Horizontal").selectOption("prices");
  await page.getByLabel("Vertical").selectOption("shares");
  await expect(page.getByText("kept pace with prices")).toHaveCount(1);
  await page.getByLabel("Horizontal").selectOption("housing");
  await expect(page.getByText("kept pace with prices")).toHaveCount(0);
});

test("a row address rings that row's dot, and a hash change moves the ring", async ({ page }) => {
  await page.goto("/atlas#japan");
  await expect(page.locator('g[data-slug="japan"]')).toHaveAttribute("data-target", "true");
  await page.evaluate(() => {
    window.location.hash = "#italy";
  });
  await expect(page.locator('g[data-slug="italy"]')).toHaveAttribute("data-target", "true");
  await expect(page.locator("g[data-target]")).toHaveCount(1);
});

test("a gap on the chosen pair is left off and counted", async ({ page }) => {
  await page.goto("/atlas");
  await page.getByLabel("Horizontal").selectOption("currency");
  await expect(page.getByText("countries plotted")).toContainText("17 countries plotted");
  await expect(page.getByText(/6 countries have no figure/)).toBeVisible();
});

test("the busiest state has no WCAG 2.1 AA violations: clipped point, y = x line, ringed dot", async ({ page }) => {
  await page.goto("/atlas#japan");
  await page.getByLabel("Horizontal").selectOption("prices");
  await page.getByLabel("Vertical").selectOption("shares");
  await expect(page.locator("g[data-target]")).toHaveCount(1);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
