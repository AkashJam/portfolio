import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 11 step 4: the five Ask chips and their worked readings.
// Needs the ticker (real /atlas/cities).

const chip = (page: import("@playwright/test").Page, name: RegExp) =>
  page.getByRole("button", { name });
const reading = (page: import("@playwright/test").Page) =>
  page.getByLabel("Reading this view");

test("opens on chip 1 with Milan against New York", async ({ page }) => {
  await page.goto("/atlas");
  await expect(chip(page, /What people spend/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("button[aria-pressed=true]")).toHaveCount(1);
  await expect(reading(page)).toContainText("Milan against New York");
  await expect(reading(page)).toContainText("New York spends more than Milan");
});

test("chip 3 sets both axes, draws y = x and names who is below", async ({
  page,
}) => {
  await page.goto("/atlas");
  await chip(page, /Did savings outrun prices/).click();
  await expect(page.getByLabel("Horizontal")).toHaveValue("prices");
  await expect(page.getByLabel("Vertical")).toHaveValue("shares");
  await expect(page.getByText("kept pace with prices")).toHaveCount(1);
  await expect(reading(page)).toContainText("Istanbul against Tokyo");
  await expect(reading(page)).toContainText("Both sit above the line.");
  await expect(reading(page)).toContainText("Below the line:");
});

test("each chip names its two countries and sets its axes", async ({
  page,
}) => {
  await page.goto("/atlas");
  const cases: [RegExp, string, string, string][] = [
    [
      /What people spend/,
      "everydaySpendingEur",
      "housing",
      "Milan against New York",
    ],
    [/savings and housing/, "shares", "housing", "Mumbai against Milan"],
    [/savings outrun prices/, "prices", "shares", "Istanbul against Tokyo"],
    [
      /live longer/,
      "everydaySpendingEur",
      "lifeExpectancy",
      "Tokyo against New York",
    ],
    [
      /currency done to savings/,
      "shares",
      "currency",
      "Tokyo against Istanbul",
    ],
  ];
  for (const [name, x, y, title] of cases) {
    await chip(page, name).click();
    await expect(page.getByLabel("Horizontal")).toHaveValue(x);
    await expect(page.getByLabel("Vertical")).toHaveValue(y);
    await expect(reading(page)).toContainText(title);
  }
  await expect(page.getByText("countries plotted")).toContainText(
    "17 countries plotted",
  );
});

test("touching an axis dropdown clears the chip and shows the generated line", async ({
  page,
}) => {
  await page.goto("/atlas");
  await page.getByLabel("Horizontal").selectOption("gniPpp");
  await expect(page.locator("button[aria-pressed=true]")).toHaveCount(0);
  await expect(reading(page)).toContainText("is highest on income");
});

test("a window change keeps the chip and the reading follows", async ({
  page,
}) => {
  await page.goto("/atlas");
  await chip(page, /savings and housing/).click();
  await expect(reading(page)).toContainText(
    "housing rose in India and fell in Italy",
  );
  await page.getByRole("radio", { name: "2016–24" }).click();
  await expect(chip(page, /savings and housing/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(reading(page)).toContainText("housing fell in both");
});

test("a chip click returns the window to 2010–24", async ({ page }) => {
  await page.goto("/atlas");
  await page.getByRole("radio", { name: "2021–24" }).click();
  await chip(page, /currency done to savings/).click();
  await expect(page.getByRole("radio", { name: "2010–24" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("the chip state has no WCAG 2.1 AA violations", async ({ page }) => {
  await page.goto("/atlas");
  await chip(page, /Did savings outrun prices/).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
});
