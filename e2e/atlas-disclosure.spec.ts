import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { gotoAtlas, openBuild } from "./atlas-hydrated";

// Phase 11 step 7: the three disclosure tiers. Needs the ticker (real /atlas/cities).

const countries = (page: Page) => page.locator("#countries");
const colInfo = (page: Page, name: string) =>
  countries(page).getByRole("button", { name: `About the ${name} column` });
const cell = (page: Page, slug: string, nth: number) =>
  page.locator(`tr#${slug} td`).nth(nth).getByRole("button");
const dialog = (page: Page) => page.getByRole("dialog");

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the reading rules show on every view with no click, and the example is computed", async ({
    page,
  }) => {
    await gotoAtlas(page);
    const rules = page.getByTestId("atlas-rules");
    await expect(rules.getByText("How to read this")).toBeVisible();
    await expect(rules.getByText("Compare changes, not amounts.")).toBeVisible();
    await expect(rules.getByText("Every figure is national.")).toBeVisible();
    await expect(rules.getByText("There’s no league table.")).toBeVisible();
    await expect(rules.getByText(/Since 2010, house prices (fell|rose) \d+% in .* and (fell|rose) \d+% in /)).toBeVisible();
    for (const tab of ["Map", "Countries"]) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(rules).toBeVisible();
    }
    // Once, not three times: the old intro, the long guide and the table's panel are gone.
    await expect(page.getByText("Reading rules")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /reading rules|how to read/i })).toHaveCount(0);
  });

  test("the head leads with the hook and the exact sentence, with the count from the data", async ({
    page,
  }) => {
    await gotoAtlas(page);
    await expect(page.getByRole("heading", { level: 1, name: "Atlas" })).toBeVisible();
    await expect(page.getByText("Fifteen years, country by country.")).toBeVisible();
    await expect(
      page.getByText(/^\d+ countries, each shown by one of its cities; every figure is national, from a source that publishes its method\.$/),
    ).toBeVisible();
    await expect(page.getByText(/median person/)).toHaveCount(0);
  });

  test("a column icon opens that column's source and series, then Esc closes it and returns focus", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    const icon = colInfo(page, "stock market");
    await expect(icon).toHaveAttribute("aria-expanded", "false");
    await icon.click();
    await expect(icon).toHaveAttribute("aria-expanded", "true");
    const d = dialog(page);
    await expect(d).toBeVisible();
    await expect(d).toContainText("OECD, via FRED");
    await expect(d).toContainText("SPASTT01<CC>M661N");
    await expect(d).toContainText("before inflation");
    await page.keyboard.press("Escape");
    await expect(d).toHaveCount(0);
    await expect(icon).toBeFocused();
  });

  test("opens from the keyboard and holds its content in the DOM", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await colInfo(page, "income").focus();
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toContainText("NY.GNP.PCAP.PP.CD");
    await expect(dialog(page)).toContainText("international dollars");
  });

  test("only one popover is open at a time, and a click outside closes it", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await colInfo(page, "house prices").click();
    await colInfo(page, "inflation").click();
    await expect(dialog(page)).toHaveCount(1);
    await expect(dialog(page)).toContainText("FP.CPI.TOTL");
    await page.getByRole("heading", { name: "Countries" }).click();
    await expect(dialog(page)).toHaveCount(0);
  });

  test("the popover follows the shared window", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await page.getByRole("tab", { name: "Compare" }).click();
    await openBuild(page);
    await page
      .locator("#compare")
      .getByRole("radio", { name: "2016–24" })
      .click();
    await page.getByRole("tab", { name: "Countries" }).click();
    await colInfo(page, "stock market").click();
    await expect(dialog(page)).toContainText("January 2016 to December 2024");
  });

  test("Spending names the four older cells, and exactly those four carry the amber dot", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await colInfo(page, "average spending a month").click();
    await expect(dialog(page)).toContainText(
      "2025 for nineteen countries; 2024 for China, Japan, New Zealand and the United States",
    );
    await page.keyboard.press("Escape");
    const older = countries(page).getByText(
      /older than the column, which is 2025/,
    );
    await expect(older).toHaveCount(4);
    for (const slug of ["china", "japan", "new-zealand", "united-states"]) {
      await expect(
        page
          .locator(`tr#${slug}`)
          .getByText(/older than the column, which is 2025/),
      ).toHaveCount(1);
    }
    await expect(
      countries(page).getByText(/older than the column/),
    ).toHaveCount(4);
  });

  test("Ireland's income cell opens its note; its neighbours do not", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await expect(
      page.locator("tr#ireland td").nth(6).getByRole("button"),
    ).toHaveCount(1);
    await expect(
      page.locator("tr#ireland td").nth(5).getByRole("button"),
    ).toHaveCount(0);
    await page.locator("tr#ireland td").nth(6).getByRole("button").click();
    await expect(dialog(page)).toContainText("multinational profit-shifting");
    await expect(dialog(page)).toContainText("reproduced unchanged");
  });

  test("Türkiye's shares note computes its figures from the data and follows the window", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await cell(page, "turkiye", 1).click();
    await expect(dialog(page)).toContainText(
      "prices rose +1,223% over the same years",
    );
    await expect(dialog(page)).toContainText("leaves +38% after inflation");
    await expect(dialog(page)).toContainText(
      "the lira moved −94% against the euro",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Compare" }).click();
    await openBuild(page);
    await page
      .locator("#compare")
      .getByRole("radio", { name: "2021–24" })
      .click();
    await page.getByRole("tab", { name: "Countries" }).click();
    await cell(page, "turkiye", 1).click();
    await expect(dialog(page)).not.toContainText("+1,223%");
    await expect(dialog(page)).toContainText("after inflation");
  });

  test("Chile's currency is marked as derived via the dollar", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await cell(page, "chile", 4).click();
    await expect(dialog(page)).toContainText("goes via the dollar");
    await expect(dialog(page)).toContainText("CCUSMA02CLM618N");
  });

  test("exactly three cells in the table carry a Tier 3 marker", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await expect(
      page.locator("#countries tbody td button[aria-haspopup=dialog]"),
    ).toHaveCount(3);
  });

  test("every cell still carries its source and as-of for screen readers", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    const row = page.locator("tr#japan");
    await expect(row).toContainText(
      "OECD via FRED SPASTT01JPM661N · as of 2024-12",
    );
    await expect(row).toContainText("World Bank SL.UEM.TOTL.ZS · as of 2025");
    await expect(page.locator("#countries tbody td[title]")).toHaveCount(0);
  });

  test("has no WCAG 2.1 AA violations with a column popover open", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await colInfo(page, "average spending a month").click();
    await expect(dialog(page)).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("has no WCAG 2.1 AA violations with a cell note open", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await cell(page, "turkiye", 1).click();
    await expect(dialog(page)).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a popover stays inside the viewport, whichever column opens it", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    for (const name of ["stock market", "currency", "life expectancy"]) {
      const icon = colInfo(page, name);
      await icon.scrollIntoViewIfNeeded();
      await icon.click();
      const box = await dialog(page).boundingBox();
      expect(box, name).not.toBeNull();
      expect(box!.x, name).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, name).toBeLessThanOrEqual(390);
      await page.keyboard.press("Escape");
    }
  });

  test("a cell note stays inside the viewport", async ({ page }) => {
    await gotoAtlas(page, "countries");
    const c = cell(page, "turkiye", 1);
    await c.scrollIntoViewIfNeeded();
    await c.click();
    const box = await dialog(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});
