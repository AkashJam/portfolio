import { gotoAtlas, openBuild } from "./atlas-hydrated";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 11 step 4 / Phase 22 step 3b: the five questions (tabs, a dropdown on a phone) and their worked readings.
// Needs the ticker (real /atlas/cities).

const chip = (page: import("@playwright/test").Page, name: RegExp) =>
  page.getByRole("tab", { name });
const reading = (page: import("@playwright/test").Page) =>
  page.getByLabel("Reading this view");

test("opens on the first question with Milan against New York", async ({ page }) => {
  await gotoAtlas(page);
  await expect(chip(page, /Spending & housing/)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tablist", { name: "Questions" }).locator("[role=tab][aria-selected=true]")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Where people spend more, have house prices risen more?" })).toBeVisible();
  await expect(reading(page)).toContainText("Milan against New York");
  await expect(reading(page)).toContainText("New York spends more than Milan");
});

test("the third question sets both axes, draws y = x and names who is below", async ({
  page,
}) => {
  await gotoAtlas(page);
  await chip(page, /Stocks vs inflation/).click();
  await openBuild(page);
  await expect(page.getByLabel("Across")).toHaveValue("prices");
  await expect(page.getByLabel("Up")).toHaveValue("shares");
  await expect(page.locator("svg[data-drawing=desktop]").getByText("kept pace with prices")).toHaveCount(1);
  await expect(reading(page)).toContainText("Ankara against Tokyo");
  await expect(reading(page)).toContainText("Both sit above the line.");
  await expect(reading(page)).toContainText("Below the line:");
});

test("each question names its two countries and sets its axes", async ({
  page,
}) => {
  await gotoAtlas(page);
  await openBuild(page);
  const cases: [RegExp, string, string, string][] = [
    [
      /Spending & housing/,
      "everydaySpendingEur",
      "housing",
      "Milan against New York",
    ],
    [/Stocks & housing/, "shares", "housing", "Mumbai against Milan"],
    [/Stocks vs inflation/, "prices", "shares", "Ankara against Tokyo"],
    [
      /Spending & lifespan/,
      "everydaySpendingEur",
      "lifeExpectancy",
      "Tokyo against New York",
    ],
    [
      /Currency & stocks/,
      "shares",
      "currency",
      "Tokyo against Ankara",
    ],
  ];
  for (const [name, x, y, title] of cases) {
    await chip(page, name).click();
    await expect(page.getByLabel("Across")).toHaveValue(x);
    await expect(page.getByLabel("Up")).toHaveValue(y);
    await expect(reading(page)).toContainText(title);
  }
  await expect(page.getByText("countries plotted")).toContainText(
    "17 countries plotted",
  );
});

test("touching an axis dropdown clears the question, the highlight and shows the generated line", async ({
  page,
}) => {
  await gotoAtlas(page);
  await openBuild(page);
  await expect(page.locator("svg[data-drawing=desktop] g[data-picked]")).toHaveCount(2);
  await page.getByLabel("Across").selectOption("gniPpp");
  await expect(page.getByRole("tablist", { name: "Questions" }).locator("[role=tab][aria-selected=true]")).toHaveCount(0);
  await expect(page.locator("g[data-picked]")).toHaveCount(0);
  await expect(page).toHaveURL(/\?x=gniPpp&y=housing$/);
  await expect(reading(page)).toContainText("is highest on income");
});

test("a window change keeps the question and the reading follows", async ({
  page,
}) => {
  await gotoAtlas(page);
  await chip(page, /Stocks & housing/).click();
  await expect(reading(page)).toContainText(
    "housing rose in India and fell in Italy",
  );
  await openBuild(page);
  await page
    .locator("#compare")
    .getByRole("radio", { name: "2016–24" })
    .click();
  await expect(chip(page, /Stocks & housing/)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(reading(page)).toContainText("housing fell in both");
});

test("a question click returns the window to 2010–24", async ({ page }) => {
  await gotoAtlas(page);
  await openBuild(page);
  await page
    .locator("#compare")
    .getByRole("radio", { name: "2021–24" })
    .click();
  await chip(page, /Currency & stocks/).click();
  await expect(
    page.locator("#compare").getByRole("radio", { name: "2010–24" }),
  ).toHaveAttribute("aria-checked", "true");
});

test("the question state has no WCAG 2.1 AA violations", async ({ page }) => {
  await gotoAtlas(page);
  await chip(page, /Stocks vs inflation/).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});

test("the address round-trips a question, a built pair and a window", async ({ page }) => {
  await page.goto("/atlas?q=spend-life&window=2016");
  await expect(chip(page, /Spending & lifespan/)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { level: 2, name: "Do people live longer where they spend more?" })).toBeVisible();
  await page.reload();
  await expect(chip(page, /Spending & lifespan/)).toHaveAttribute("aria-selected", "true");
  await page.goto("/atlas?x=shares&y=prices");
  await expect(page.getByRole("heading", { level: 2, name: "Your comparison" })).toBeVisible();
  await expect(page.locator("#compare details")).toHaveJSProperty("open", true);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the questions are a dropdown and the phone drawing shows with no sideways scroll", async ({ page }) => {
    await gotoAtlas(page);
    await expect(page.getByRole("tablist", { name: "Questions" })).toBeHidden();
    const select = page.locator("#atlas-question-select");
    await expect(select).toHaveValue("spend-housing");
    await select.selectOption("prices-shares");
    await expect(page.getByRole("heading", { level: 2, name: "Did stock markets grow faster than inflation?" })).toBeVisible();
    await expect(page).toHaveURL(/\?q=prices-shares$/);
    await expect(page.locator("svg[data-drawing=phone]")).toBeVisible();
    await expect(page.locator("svg[data-drawing=desktop]")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
