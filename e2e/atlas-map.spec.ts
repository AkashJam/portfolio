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
    await page
      .locator("#compare")
      .getByRole("radio", { name: "2016–24" })
      .click();
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

// ---- step 6: the controls --------------------------------------------------

const measureBtn = (page: import("@playwright/test").Page, name: string) =>
  map(page).getByRole("radio", { name, exact: true });
const periodBtn = (page: import("@playwright/test").Page, name: RegExp) =>
  map(page).getByRole("radio", { name });
const slider = (page: import("@playwright/test").Page) =>
  map(page).getByRole("slider", { name: "Year" });
const historyLength = (page: import("@playwright/test").Page) =>
  page.evaluate(() => window.history.length);

test.describe("controls at 1024px", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("opens on housing, whole window, with no slider", async ({ page }) => {
    await page.goto("/atlas");
    await expect(measureBtn(page, "Housing")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(periodBtn(page, /Whole window/)).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(periodBtn(page, /Whole window/)).toContainText("2010–24");
    await expect(slider(page)).toHaveCount(0);
  });

  test("a measure recolours the map, renames its links and, on currency, states the exceptions", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await expect(map(page).getByText(/^No figure:/)).toHaveCount(0);
    await measureBtn(page, "Currency").click();
    await expect(
      page.getByRole("link", {
        name: /^Italy: no figure, currency against the euro/,
      }),
    ).toBeAttached();
    await expect(
      page.getByRole("link", {
        name: /^Italy: .*euro area, no rate against itself/,
      }),
    ).toBeAttached();
    await expect(
      map(page).getByText(
        /No figure: the euro area has no rate against itself; Israel has no 2010 rate\./,
      ),
    ).toBeVisible();
    await expect(
      map(page).getByText(/Chile's figure is derived via the dollar/),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^Chile: .*derived via the dollar/ }),
    ).toBeAttached();
    await measureBtn(page, "Prices").click();
    await expect(
      page.getByRole("link", { name: /^Japan: .*consumer prices/ }),
    ).toBeAttached();
    await expect(map(page).getByText(/^No figure:/)).toHaveCount(0);
  });

  test("One year reveals the slider and Whole window hides it again", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await periodBtn(page, /One year/).click();
    await expect(slider(page)).toBeVisible();
    await expect(slider(page)).toHaveAttribute("min", "2010");
    await expect(slider(page)).toHaveAttribute("max", "2024");
    await periodBtn(page, /Whole window/).click();
    await expect(slider(page)).toHaveCount(0);
  });

  test("the slider changes the year in the links and the address, without adding history", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await periodBtn(page, /One year/).click();
    const before = await historyLength(page);
    await slider(page).fill("2022");
    await expect(
      page.getByRole("link", { name: /^Japan: .*change during 2022/ }),
    ).toBeAttached();
    await expect(page).toHaveURL(/\/atlas\?year=2022(#.*)?$/);
    await slider(page).fill("2018");
    await expect(page).toHaveURL(/\/atlas\?year=2018/);
    expect(await historyLength(page)).toBe(before);
  });

  test("defaults are left out of the address", async ({ page }) => {
    await page.goto("/atlas");
    await measureBtn(page, "Currency").click();
    await expect(page).toHaveURL(/\?measure=currency(#.*)?$/);
    await measureBtn(page, "Housing").click();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await periodBtn(page, /One year/).click();
    await expect(page).toHaveURL(/\?year=\d{4}/);
    await periodBtn(page, /Whole window/).click();
    await expect.poll(() => new URL(page.url()).search).toBe("");
  });

  test("a deep link opens its state", async ({ page }) => {
    await page.goto("/atlas?measure=prices&year=2022#map");
    await expect(measureBtn(page, "Prices")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(periodBtn(page, /One year/)).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(slider(page)).toHaveValue("2022");
    await expect(
      page.getByRole("link", {
        name: /^Japan: .*consumer prices, change during 2022/,
      }),
    ).toBeAttached();
  });

  test("a year the measure lacks opens on its first year and the address says so", async ({
    page,
  }) => {
    await page.goto("/atlas?measure=prices&year=2010#map");
    await expect(slider(page)).toHaveValue("2011");
    await expect(slider(page)).toHaveAttribute("min", "2011");
    await expect(page).toHaveURL(/\?measure=prices&year=2011/);
  });

  test("switching to prices from 2010 moves to 2011", async ({ page }) => {
    await page.goto("/atlas?year=2010#map");
    await expect(slider(page)).toHaveValue("2010");
    await measureBtn(page, "Prices").click();
    await expect(slider(page)).toHaveValue("2011");
    await expect(page).toHaveURL(/\?measure=prices&year=2011/);
    await measureBtn(page, "Housing").click();
    await expect(slider(page)).toHaveValue("2011");
  });

  test("Israel's currency has no figure in 2010 only", async ({ page }) => {
    await page.goto("/atlas?measure=currency&year=2010#map");
    await expect(
      page.getByRole("link", {
        name: /^Israel: no figure, .*change during 2010, no 2010 rate/,
      }),
    ).toBeAttached();
    await slider(page).fill("2011");
    await expect(
      page.getByRole("link", { name: /^Israel: [+−]?\d/ }),
    ).toBeAttached();
  });

  test("Play steps the years about a second apart and stops on the last", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/atlas?year=2022#map");
    await expect(slider(page)).toHaveValue("2022");
    await map(page)
      .getByRole("button", { name: "Play through the years" })
      .click();
    await page.clock.runFor(1000);
    await expect(slider(page)).toHaveValue("2023");
    await page.clock.runFor(1000);
    await expect(slider(page)).toHaveValue("2024");
    await expect(
      map(page).getByRole("button", { name: "Play through the years" }),
    ).toBeVisible();
    await page.clock.runFor(3000);
    await expect(slider(page)).toHaveValue("2024");
  });

  test("Play from the last year starts again from the first, and Pause stops it", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/atlas?year=2024#map");
    await map(page)
      .getByRole("button", { name: "Play through the years" })
      .click();
    await expect(slider(page)).toHaveValue("2010");
    await page.clock.runFor(2000);
    await expect(slider(page)).toHaveValue("2012");
    await map(page).getByRole("button", { name: "Pause" }).click();
    await page.clock.runFor(3000);
    await expect(slider(page)).toHaveValue("2012");
  });

  test("the one-year state has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/atlas?measure=currency&year=2022#map");
    await expect(slider(page)).toBeVisible();
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

test.describe("controls at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("One year shows the stepper, not the slider, and ‹ › move the year", async ({
    page,
  }) => {
    await page.goto("/atlas?year=2022#map");
    const next = map(page).getByRole("button", { name: "Next year" });
    const prev = map(page).getByRole("button", { name: "Previous year" });
    await expect(next).toBeVisible();
    await expect(map(page).getByText("of 2010–2024")).toBeVisible();
    await expect(map(page).getByRole("slider")).toHaveCount(0);
    await next.click();
    await expect(
      page.getByRole("link", { name: /change during 2023/ }).first(),
    ).toBeAttached();
    await prev.click();
    await prev.click();
    await expect(page).toHaveURL(/\?year=2021/);
  });

  test("the stepper stops at the measure's own ends", async ({ page }) => {
    await page.goto("/atlas?measure=prices&year=2011#map");
    await expect(
      map(page).getByRole("button", { name: "Previous year" }),
    ).toBeDisabled();
    await expect(map(page).getByText("of 2011–2024")).toBeVisible();
    await page.goto("/atlas?year=2024#map");
    await expect(
      map(page).getByRole("button", { name: "Next year" }),
    ).toBeDisabled();
  });

  test("the one-year tiles have no WCAG 2.1 AA violations", async ({
    page,
  }) => {
    await page.goto("/atlas?measure=prices&year=2022#map");
    await expect(
      map(page).getByRole("button", { name: "Next year" }),
    ).toBeVisible();
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
