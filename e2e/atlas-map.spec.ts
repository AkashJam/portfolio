import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 11 step 5: the map. World map at 768px and up, equal tiles below,
// every country a link to its table row. Needs the ticker (real /atlas/cities).

const map = (page: import("@playwright/test").Page) => page.locator("#map");
const links = (page: import("@playwright/test").Page) =>
  map(page).getByRole("link");

test.describe("at 1024px", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("draws the world map with twenty-three country links, and not the tiles", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await expect(links(page)).toHaveCount(23);
    await expect(map(page).locator("svg:visible")).toHaveCount(1);
    await expect(map(page).locator("svg:visible path")).not.toHaveCount(0);
    await expect(map(page).locator("svg:visible rect")).toHaveCount(0);
  });

  test("every link names its figure, measure and window", async ({ page }) => {
    await page.goto("/atlas");
    await expect(links(page).filter({ hasText: /./ }).first()).toBeAttached();
    for (const l of await links(page).all()) {
      const name = await l.getAttribute("aria-label");
      expect(name, name ?? "").toMatch(
        /: [+−]?\d[\d,]*%, house prices after inflation, change 2010–24/,
      );
    }
    await expect(
      page.getByRole("link", { name: /^Italy: −26%/ }),
    ).toHaveAttribute("href", "#italy");
  });

  test("a country lands on its table row and rings its dot in the scatter", async ({
    page,
  }) => {
    await page.goto("/atlas");
    // Keyboard, not a click: the centre of Japan's bounding box is sea, and a
    // country link has to be reachable without a pointer anyway.
    const japan = page.getByRole("link", { name: /^Japan: / });
    await japan.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#japan$/);
    await expect(page.locator("tr#japan")).toBeInViewport();
    await expect(page.locator('g[data-slug="japan"]')).toHaveAttribute(
      "data-target",
      "true",
    );
  });

  test("the colours follow the shared window", async ({ page }) => {
    await page.goto("/atlas");
    const italy = page.getByRole("link", { name: /^Italy: / });
    const fill = () => italy.locator("path").getAttribute("fill");
    const before = await fill();
    await page.getByRole("radio", { name: "2016–24" }).click();
    await expect(italy).toHaveAttribute("aria-label", /−7%.*2016–24/);
    expect(await fill()).not.toBe(before);
    await expect(
      page
        .getByText(/housing after inflation|house prices after inflation/)
        .first(),
    ).toBeVisible();
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/atlas");
    const results = await new AxeBuilder({ page })
      .include("#map")
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

  test("draws equal tiles with the same twenty-three links, and not the world map", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await expect(links(page)).toHaveCount(23);
    await expect(map(page).locator("svg:visible rect")).toHaveCount(23);
    await expect(map(page).locator("svg:visible path")).toHaveCount(0);
  });

  test("a tile carries its code and figure and links to its row", async ({
    page,
  }) => {
    await page.goto("/atlas");
    const it = page.getByRole("link", { name: /^Italy: / });
    await expect(it).toContainText("IT");
    await expect(it).toContainText("−26%");
    await expect(it).toHaveAttribute("href", "#italy");
  });

  test("has no WCAG 2.1 AA violations, including text on every fill", async ({
    page,
  }) => {
    await page.goto("/atlas");
    const results = await new AxeBuilder({ page })
      .include("#map")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});
