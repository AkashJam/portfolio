import { gotoAtlas } from "./atlas-hydrated";
import { expect, test } from "@playwright/test";

// Phase 11 step 3: one window drives the scatter and the table together.
// Needs the ticker (real /atlas/cities). Figures are bearing.md's: India's
// housing is +64% from 2010 and -1% from 2016.

const row = (page: import("@playwright/test").Page, slug: string) =>
  page.locator(`tr#${slug}`);

test("the selector offers the three windows, ending at the common year, one checked", async ({
  page,
}) => {
  await gotoAtlas(page);
  const radios = page
    .locator("#compare")
    .getByRole("radiogroup", { name: /window/i })
    .getByRole("radio");
  await expect(radios).toHaveText(["2021–24", "2016–24", "2010–24"]);
  await expect(
    page.locator(
      "#compare [role=radiogroup][aria-labelledby=atlas-window-label] [role=radio][aria-checked=true]",
    ),
  ).toHaveCount(1);
  await expect(
    page.locator("#compare").getByRole("radio", { name: "2010–24" }),
  ).toHaveAttribute("aria-checked", "true");
});

test("choosing 2016–24 moves the table and the scatter together", async ({
  page,
}) => {
  await gotoAtlas(page);
  await page.getByLabel("Vertical").selectOption("housing");
  const india = row(page, "india");
  await expect(india).toContainText("+64%");
  const dot = page.locator('g[data-slug="india"] circle');
  const before = await dot.getAttribute("cy");

  await page
    .locator("#compare")
    .getByRole("radio", { name: "2016–24" })
    .click();
  await expect(india).toContainText("−1%");
  await expect(
    page.getByText("change 2016–24", { exact: false }).first(),
  ).toBeVisible();
  expect(await dot.getAttribute("cy")).not.toBe(before);
});

test("Israel's currency gap is a 2010 fact, not a permanent one", async ({
  page,
}) => {
  await gotoAtlas(page);
  await expect(row(page, "israel")).toContainText("no 2010 rate");
  await page
    .locator("#compare")
    .getByRole("radio", { name: "2016–24" })
    .click();
  await expect(row(page, "israel")).not.toContainText("no 2010 rate");
  await expect(row(page, "israel")).toContainText("+13%");
});

test("a window with fewer gaps plots more currency points", async ({
  page,
}) => {
  await gotoAtlas(page);
  await page.getByLabel("Horizontal").selectOption("currency");
  await expect(page.getByText("countries plotted")).toContainText(
    "17 countries plotted",
  );
  await page
    .locator("#compare")
    .getByRole("radio", { name: "2016–24" })
    .click();
  await expect(page.getByText("countries plotted")).toContainText(
    "18 countries plotted",
  );
});

test("the selector is keyboard operable", async ({ page }) => {
  await gotoAtlas(page);
  await page
    .locator("#compare")
    .getByRole("radio", { name: "2021–24" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator("#compare").getByRole("radio", { name: "2021–24" }),
  ).toHaveAttribute("aria-checked", "true");
});
