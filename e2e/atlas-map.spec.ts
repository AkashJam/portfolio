import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { atlasHydrated as atlasReady, desktopScatter, gotoAtlas, openBuild, openMapMenu } from "./atlas-hydrated";

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
    await page.goto("/atlas?view=map");
    await expect(links(page)).toHaveCount(23);
    await expect(map(page).locator("svg:visible")).toHaveCount(1);
    await expect(map(page).locator("svg:visible path")).not.toHaveCount(0);
    await expect(map(page).locator("svg:visible rect[rx]")).toHaveCount(0);
  });

  test("every link names its figure, measure and window", async ({ page }) => {
    await page.goto("/atlas?view=map");
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
    await page.goto("/atlas?view=map");
    // Keyboard, not a click: the centre of Japan's bounding box is sea, and a
    // country link has to be reachable without a pointer anyway.
    const japan = page.getByRole("link", { name: /^Japan: / });
    await japan.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#japan$/);
    await expect(page.locator("tr#japan")).toBeInViewport();
    await expect(desktopScatter(page).locator('g[data-slug="japan"]')).toHaveAttribute(
      "data-target",
      "true",
    );
  });

  test("the colours follow the shared window", async ({ page }) => {
    await page.goto("/atlas?view=map");
    const italy = page.getByRole("link", { name: /^Italy: / });
    const fill = () => italy.locator("path").getAttribute("fill");
    const before = await fill();
    // The window control lives in Compare; the map follows it from its own tab.
    await page.getByRole("tab", { name: "Compare" }).click();
    await openBuild(page);
    await page
      .locator("#compare")
      .getByRole("radio", { name: "2016–24" })
      .click();
    await page.getByRole("tab", { name: "Map" }).click();
    await expect(italy).toHaveAttribute("aria-label", /−7%.*2016–24/);
    expect(await fill()).not.toBe(before);
    await expect(
      map(page).getByRole("heading", { level: 2, name: /^House prices, after inflation, 2016–24$/ }),
    ).toBeVisible();
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/atlas?view=map");
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
    await page.goto("/atlas?view=map");
    await expect(links(page)).toHaveCount(23);
    await expect(map(page).locator("svg:visible rect[rx]")).toHaveCount(23);
    await expect(map(page).locator("svg:visible path")).toHaveCount(0);
  });

  test("a tile carries its code and figure and links to its row", async ({
    page,
  }) => {
    await page.goto("/atlas?view=map");
    const link = page.getByRole("link", { name: /^Italy: / });
    await expect(link).toHaveAttribute("href", "#italy");
    // The code and figure are drawn over the link as siblings, in the same tile group.
    const tile = page
      .locator("#map svg:visible g")
      .filter({ has: page.locator('a[href="#italy"]') });
    await expect(tile).toContainText("IT");
    await expect(tile).toContainText("\u221226%");
  });

  test("each tile's accessible name contains its visible text (label in name, WCAG 2.5.3)", async ({
    page,
  }) => {
    await page.goto("/atlas?view=map");
    const results = await new AxeBuilder({ page })
      .include("#map")
      .withRules(["label-content-name-mismatch"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("has no WCAG 2.1 AA violations, including text on every fill", async ({
    page,
  }) => {
    await page.goto("/atlas?view=map");
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
    await page.goto("/atlas?view=map");
    await openMapMenu(page);
    await expect(measureBtn(page, "House prices")).toHaveAttribute(
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
    await page.goto("/atlas?view=map");
    await openMapMenu(page);
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
    await measureBtn(page, "Inflation").click();
    await expect(
      page.getByRole("link", { name: /^Japan: .*consumer prices/ }),
    ).toBeAttached();
    await expect(map(page).getByText(/^No figure:/)).toHaveCount(0);
  });

  test("One year reveals the slider and Whole window hides it again", async ({
    page,
  }) => {
    await page.goto("/atlas?view=map");
    await openMapMenu(page);
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
    await page.goto("/atlas?view=map");
    await openMapMenu(page);
    await periodBtn(page, /One year/).click();
    const before = await historyLength(page);
    await slider(page).fill("2022");
    await expect(
      page.getByRole("link", { name: /^Japan: .*change during 2022/ }),
    ).toBeAttached();
    await expect(page).toHaveURL(/\/atlas\?view=map&year=2022(#.*)?$/);
    await slider(page).fill("2018");
    await expect(page).toHaveURL(/\/atlas\?view=map&year=2018/);
    expect(await historyLength(page)).toBe(before);
  });

  test("defaults are left out of the address", async ({ page }) => {
    await page.goto("/atlas?view=map");
    await openMapMenu(page);
    await measureBtn(page, "Currency").click();
    await expect(page).toHaveURL(/\?view=map&measure=currency(#.*)?$/);
    await measureBtn(page, "House prices").click();
    await expect.poll(() => new URL(page.url()).search).toBe("?view=map");
    await periodBtn(page, /One year/).click();
    await expect(page).toHaveURL(/\?view=map&year=\d{4}/);
    await periodBtn(page, /Whole window/).click();
    await expect.poll(() => new URL(page.url()).search).toBe("?view=map");
  });

  test("a deep link opens its state", async ({ page }) => {
    await page.goto("/atlas?measure=prices&year=2022#map");
    await expect(measureBtn(page, "Inflation")).toHaveAttribute(
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
    await measureBtn(page, "Inflation").click();
    await expect(slider(page)).toHaveValue("2011");
    await expect(page).toHaveURL(/measure=prices/);
    await expect(page).toHaveURL(/year=2011/);
    await measureBtn(page, "House prices").click();
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

test.describe("the map panel (phase18.md I58)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("opens on one measure and period, the options closed, the heading naming both", async ({ page }) => {
    await gotoAtlas(page, "map");
    await expect(map(page).getByRole("heading", { level: 2, name: "House prices, after inflation, 2010–24" })).toBeVisible();
    await expect(page.locator("#map details")).toHaveJSProperty("open", false);
    await expect(measureBtn(page, "House prices")).toBeHidden();
    await openMapMenu(page);
    await expect(measureBtn(page, "House prices")).toBeVisible();
    await periodBtn(page, /One year/).click();
    await expect(map(page).getByRole("heading", { level: 2, name: /during \d{4}$/ })).toBeVisible();
  });

  test("a deep link with a measure or a year opens the menu", async ({ page }) => {
    await page.goto("/atlas?view=map&measure=currency");
    await atlasReady(page);
    await expect(page.locator("#map details")).toHaveJSProperty("open", true);
    await expect(measureBtn(page, "Currency")).toHaveAttribute("aria-checked", "true");
  });

  test("changing the measure keeps the tab and the home city in the address", async ({ page }) => {
    await page.goto("/atlas?view=map&home=japan");
    await atlasReady(page);
    await openMapMenu(page);
    await measureBtn(page, "Currency").click();
    await expect(page).toHaveURL(/\?view=map&home=japan&measure=currency$/);
    await page.reload();
    await expect(page.getByRole("tab", { name: "Map", selected: true })).toBeVisible();
    await expect(page.locator("#atlas-home")).toHaveValue("japan");
  });

  test("the countries outside the atlas are hatched, and the legend says so", async ({ page }) => {
    await gotoAtlas(page, "map");
    await expect(page.locator("svg[aria-label$='by country'] pattern#norow")).toHaveCount(1);
    await expect(page.locator("svg[aria-label$='by country'] > path").first()).toHaveAttribute("fill", "url(#norow)");
    await expect(map(page).getByText("not one of the 23")).toBeVisible();
  });

  test("the legend bar is large enough to read", async ({ page }) => {
    await gotoAtlas(page, "map");
    const bar = map(page).locator("span[aria-hidden=true].flex.h-3").first();
    const box = (await bar.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(200);
    expect(box.height).toBeGreaterThanOrEqual(12);
  });
});
