import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { gotoAtlas } from "./atlas-hydrated";

// Phase 16 step 6: the home city. One control, four effects: the crosshairs, the pinned
// row, the comparison line under every other cited figure, and the display currency.
// It is held in the query (`?home=`), so a reload keeps it and the page stays static; the old `#home=` form is moved there.

const pick = (page: Page, slug: string) => page.locator("#atlas-home").selectOption(slug);

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("with no home nothing is added: no comparison line, no crosshairs, no rate line", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await expect(page.locator("#atlas-home")).toHaveValue("");
    await expect(page.getByTestId("home-delta")).toHaveCount(0);
    await expect(page.getByTestId("home-crosshairs")).toHaveCount(0);
    await expect(page.getByTestId("home-rate")).toHaveCount(0);
    await expect(page.getByTestId("home-tag")).toHaveCount(0);
  });

  test("a non-euro home pins its row, adds the comparison line and states one dated rate", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "japan");
    await expect(page).toHaveURL(/\?view=countries&home=japan$/);

    const first = page.locator("#countries tbody tr").first();
    await expect(first).toHaveAttribute("id", "japan");
    await expect(first).toHaveAttribute("data-home", "true");
    await expect(first.getByTestId("home-tag")).toHaveText("home");
    await expect(first.getByTestId("home-delta")).toHaveCount(0);

    // The rate is stated once, with its source year, and every spending figure uses it.
    const rate = page.getByTestId("home-rate");
    await expect(rate).toContainText("Shown in Japanese Yen at ¥");
    await expect(rate).toContainText("per € — ECB reference rate, 2025 average");
    await expect(page.getByTestId("home-rate")).toHaveCount(1);
    const italy = page.locator("#countries tbody tr#italy");
    await expect(italy).toContainText("¥");
    await expect(italy).not.toContainText("€");

    // The accent line under a cited figure: a ratio for spending, points for a change.
    // Spending and income are both ratios.
    await expect(italy.getByTestId("home-delta").filter({ hasText: "×" })).toHaveCount(2);
    await expect(italy.getByTestId("home-delta").filter({ hasText: /^[+−]\d+/ }).first()).toBeVisible();
    await expect(page.getByTestId("delta-unit").first()).toBeVisible();
  });

  test("the currency column stays against the euro and gets no comparison line", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "japan");
    // Brazil's currency cell is the fifth cell in its row: city, shares, housing, prices, currency.
    const cell = page.locator("#countries tbody tr#brazil td:nth-child(5)");
    await expect(cell).not.toBeEmpty();
    await expect(cell.getByTestId("home-delta")).toHaveCount(0);
    await expect(page.locator("#countries thead").getByText("no Δ")).toHaveCount(1);
  });

  test("the picker is at the end of the view row on every view, with the rate line under it", async ({ page }) => {
    await gotoAtlas(page);
    const picker = page.locator("#atlas-home");
    const tabs = page.getByRole("tablist", { name: "Atlas views" });
    const [t, p] = await Promise.all([tabs.boundingBox(), picker.boundingBox()]);
    expect(p!.x).toBeGreaterThan(t!.x + t!.width - 1); // beside the tabs, to their right
    await pick(page, "japan");
    for (const tab of ["Map", "Countries", "Compare"]) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(picker).toBeVisible();
      await expect(page.getByTestId("home-rate")).toBeVisible();
    }
    const rate = (await page.getByTestId("home-rate").boundingBox())!;
    expect(rate.y).toBeGreaterThan(p!.y);
  });

  test("the scatter gains crosshairs through the home dot and nothing else moves", async ({ page }) => {
    await gotoAtlas(page);
    const before = await page.locator("svg[data-drawing=desktop] [data-slug=brazil] circle").getAttribute("cx");
    // A euro-area home changes no unit, so no dot moves.
    await pick(page, "italy");
    await expect(page.getByTestId("home-crosshairs").first()).toHaveAttribute("data-home", "italy");
    await expect(page.locator("svg[data-drawing=desktop] [data-slug=brazil] circle")).toHaveAttribute("cx", before!);
    // A yen home re-expresses the spending axis in round yen, so dots shift with the new
    // tick range, but their order does not, and the crosshairs still cross the home dot.
    await pick(page, "japan");
    const hair = page.locator("svg[data-drawing=desktop]").getByTestId("home-crosshairs");
    await expect(hair).toHaveAttribute("data-home", "japan");
    await expect(hair.locator("line")).toHaveCount(2);
    await expect(page.locator("svg[data-drawing=desktop] [data-slug=japan]")).toHaveAttribute("data-home", "true");
    const jx = Number(await page.locator("svg[data-drawing=desktop] [data-slug=japan] circle").getAttribute("cx"));
    const bx = Number(await page.locator("svg[data-drawing=desktop] [data-slug=brazil] circle").getAttribute("cx"));
    expect(bx).toBeLessThan(jx); // São Paulo spends less than Tokyo, as before
    await expect(hair.locator("line").first()).toHaveAttribute("x1", String(jx));
  });

  test("a euro-area home needs no rate and shows euros", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "italy");
    await expect(page.getByTestId("home-rate")).toHaveCount(0);
    await expect(page.locator("#countries tbody tr#japan")).toContainText("€");
    await expect(page.locator("#countries tbody tr").first()).toHaveAttribute("id", "italy");
  });

  test("a home with no ECB average stays in euros and says why", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "chile");
    await expect(page.getByTestId("home-rate")).toContainText("Shown in euros");
    await expect(page.locator("#countries tbody tr#japan")).toContainText("€");
  });

  test("the column popover gains a computed line naming both legs", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "japan");
    await page.getByRole("button", { name: "About the house prices column" }).click();
    await expect(page.getByTestId("computed-line")).toContainText("this row − Tokyo's, in percentage points over the same window");
  });

  test("a reload keeps the home, and None clears it", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "japan");
    await page.reload();
    await expect(page.locator("#atlas-home")).toHaveValue("japan");
    await expect(page.locator("#countries tbody tr").first()).toHaveAttribute("id", "japan");
    await pick(page, "");
    await expect(page.getByTestId("home-tag")).toHaveCount(0);
    expect(new URL(page.url()).search).toBe("?view=countries");
  });

  test("a row address and a home are read together, and the reading compares the row with home", async ({ page }) => {
    await page.goto("/atlas?view=compare&home=japan#brazil");
    await expect(page.locator("#atlas-home")).toHaveValue("japan");
    await expect(page.locator("#countries tbody tr#brazil")).toHaveAttribute("data-target", "true");
    const cards = page.getByRole("complementary", { name: "Reading this view" });
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(1)).toContainText("São Paulo against Tokyo");
    await expect(cards.nth(1)).toContainText("Tokyo stands at ¥");
  });

  test("an old #home= link is read once and moved to ?home=", async ({ page }) => {
    await page.goto("/atlas#brazil&home=japan");
    await expect(page.locator("#atlas-home")).toHaveValue("japan");
    await expect(page).toHaveURL(/\/atlas\?home=japan#brazil$/);
    await expect(page.getByRole("tab", { name: "Countries" })).toHaveAttribute("aria-selected", "true");
  });

  test("with a home set the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await pick(page, "japan");
    await expect(page.getByTestId("home-crosshairs").first()).toBeVisible();
    await axe(page);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the picker is on its own full-width line under the tabs", async ({ page }) => {
    await gotoAtlas(page);
    const tabs = (await page.getByRole("tablist", { name: "Atlas views" }).boundingBox())!;
    const picker = (await page.getByTestId("home-picker").boundingBox())!;
    expect(picker.y).toBeGreaterThanOrEqual(tabs.y + tabs.height - 1);
    expect(picker.width).toBeGreaterThan(390 - 40);
  });

  test("nothing overflows the page and there are no violations with a home set", async ({ page }) => {
    await gotoAtlas(page);
    await pick(page, "japan");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await axe(page);
  });
});
