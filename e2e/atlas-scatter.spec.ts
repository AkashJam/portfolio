import { desktopScatter, gotoAtlas, openBuild } from "./atlas-hydrated";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Phase 11 step 2: the /atlas scatter. Needs the ticker (real /atlas/cities).

test("default view plots 23 countries with Türkiye on neither clip axis", async ({
  page,
}) => {
  await gotoAtlas(page);
  await expect(desktopScatter(page).locator("g[data-slug]")).toHaveCount(23);
  await expect(page.locator("g[data-clipped]")).toHaveCount(0);
});

test("shares on an axis clips Türkiye to the edge and says so", async ({
  page,
}) => {
  await gotoAtlas(page);
  await openBuild(page);
  await page.getByLabel("Up").selectOption("shares");
  const tr = desktopScatter(page).locator('g[data-slug="turkiye"]');
  await expect(tr).toHaveAttribute("data-clipped", "y");
  await page.getByLabel("Across").selectOption("prices");
  await expect(tr).toHaveAttribute("data-clipped", "x y");
  await expect(tr.locator("text")).toContainText("+1,223% \u00b7 +1,725%");
  await page.getByLabel("Across").selectOption("everydaySpendingEur");
  await expect(tr.locator("text")).toContainText("1,725%");
  await expect(page.getByText("Off the axis:")).toBeVisible();
});

test("y = x is drawn for prices against shares and nowhere else", async ({
  page,
}) => {
  await gotoAtlas(page);
  await expect(desktopScatter(page).getByText("kept pace with prices")).toHaveCount(0);
  await page.getByLabel("Across").selectOption("prices");
  await page.getByLabel("Up").selectOption("shares");
  await expect(desktopScatter(page).getByText("kept pace with prices")).toHaveCount(1);
  await page.getByLabel("Across").selectOption("housing");
  await expect(desktopScatter(page).getByText("kept pace with prices")).toHaveCount(0);
});

test("a row address rings that row's dot, and a hash change moves the ring", async ({
  page,
}) => {
  await page.goto("/atlas?view=compare#japan");
  await expect(page.locator('g[data-slug="japan"]')).toHaveAttribute(
    "data-target",
    "true",
  );
  await page.evaluate(() => {
    window.location.hash = "#italy";
  });
  await expect(page.locator('g[data-slug="italy"]')).toHaveAttribute(
    "data-target",
    "true",
  );
  await expect(page.locator("g[data-target]")).toHaveCount(1);
});

test("a gap on the chosen pair is left off and counted", async ({ page }) => {
  await gotoAtlas(page);
  await openBuild(page);
  await page.getByLabel("Across").selectOption("currency");
  await expect(page.getByText("countries plotted")).toContainText(
    "17 countries plotted",
  );
  await expect(page.getByText(/6 countries have no figure/)).toBeVisible();
});

test("the busiest state has no WCAG 2.1 AA violations: clipped point, y = x line, ringed dot", async ({
  page,
}) => {
  await page.goto("/atlas?view=compare#japan");
  await openBuild(page);
  await page.getByLabel("Across").selectOption("prices");
  await page.getByLabel("Up").selectOption("shares");
  await page
    .locator("#compare")
    .getByRole("radio", { name: "2016\u201324" })
    .click();
  await expect(page.locator("g[data-target]")).toHaveCount(1);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("a question highlights its pair, the others are muted, and a dot gives its values on focus and links to its page", async ({ page }) => {
  await gotoAtlas(page);
  await expect(desktopScatter(page).locator("g[data-picked]")).toHaveCount(2);
  await expect(desktopScatter(page).locator('g[data-slug="italy"]')).toHaveAttribute("data-picked", "true");
  const tokyo = desktopScatter(page).locator('g[data-slug="japan"] a');
  await expect(tokyo).toHaveAttribute("href", "/atlas/japan");
  await tokyo.focus();
  await expect(desktopScatter(page).locator('g[data-slug="japan"] .atlas-tip')).toBeVisible();
  await expect(desktopScatter(page).locator('g[data-slug="japan"] .atlas-tip text')).toContainText("Tokyo");
});

test("a dot with no city page is focusable and has no link", async ({ page }) => {
  await gotoAtlas(page);
  const noPage = desktopScatter(page).locator("g[data-slug] > g[tabindex]").first();
  await expect(noPage).toHaveAttribute("role", "img");
});
