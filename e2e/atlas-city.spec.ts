import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 16 step 4: /atlas/[city] against the real city endpoint (the embedded
// snapshots, so no vendor key and no market hours). Tokyo is the no-carry case with
// a hatched welfare ceiling; Dijon is carried on CPI from 2014 and says its rent is
// a medium-city rent; Milan publishes a total and no split, and is in the euro area.

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Tokyo: the headline, the chain without a carry, and the hatched ceiling", async ({ page }) => {
    await page.goto("/atlas/japan");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tokyo");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Atlas / Tokyo");
    await expect(page.getByTestId("headline")).toContainText("¥130,920");
    await expect(page.getByTestId("headline")).toContainText("2026");
    await expect(page.getByTestId("headline-eur")).toContainText("€77");
    await expect(page.getByTestId("second-line")).toContainText("Excluding housing ¥77,220 (€45");
    await expect(page.getByTestId("housing-tag")).toHaveAttribute("data-tag", "welfare_ceiling");

    const chain = page.getByTestId("chain");
    await expect(chain.locator("[data-step=survey]")).toContainText("Public assistance standard");
    await expect(chain.locator("[data-step=cpi]")).toContainText("No carry-forward");
    await expect(chain.locator("[data-step=cpi]")).toContainText("(2026) is not older than Japan's latest CPI year (2025)");
    await expect(chain.locator("[data-step=rate]")).toContainText("the ECB's 2025 average");

    await expect(page.getByTestId("segment")).toHaveCount(4);
    await expect(page.locator("[data-testid=segment][data-hatched]")).toHaveCount(1);
    await expect(page.getByTestId("basket-largest")).toContainText("Housing, up to (a ceiling) · ¥53,700 · 41.0%");
    await expect(page.getByTestId("part")).toHaveCount(4);
  });

  test("Dijon: carried on CPI from 2014, with the medium-city rent said", async ({ page }) => {
    await page.goto("/atlas/france");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dijon");
    await expect(page.getByTestId("headline")).toContainText("€1,571");
    await expect(page.getByTestId("headline")).toContainText("2014");
    await expect(page.getByTestId("housing-tag")).toContainText("priced in Dijon and Tours");
    const cpi = page.getByTestId("chain").locator("[data-step=cpi]");
    await expect(cpi).toContainText(/Carried to \d{4} prices/);
    await expect(cpi).toContainText("consumer price index was");
    await expect(page.getByTestId("chain").locator("[data-step=rate]")).toContainText("uses the euro: no conversion");
    await expect(page.getByTestId("part")).toHaveCount(9);
    // France has no market sensor, so no link to a record.
    await expect(page.getByTestId("sensor-link")).toHaveCount(0);
  });

  test("Milan publishes a total, not a split, and has no currency line", async ({ page }) => {
    await page.goto("/atlas/italy");
    await expect(page.getByTestId("headline")).toContainText("€1,224.64");
    await expect(page.getByTestId("no-split")).toContainText("No basket split");
    await expect(page.getByTestId("basket")).toHaveCount(0);
    await expect(page.getByTestId("chart-currency-absent")).toContainText("The euro has no rate against itself");
    await expect(page.getByTestId("chart-shares")).toBeVisible();
  });

  test("the three charts are in the server HTML, the first two logarithmic and house prices linear", async ({ request }) => {
    const html = await (await request.get("/atlas/japan")).text();
    expect(html).toContain('data-scale="log"');
    expect(html).toContain('data-scale="linear"');
    expect((html.match(/<polyline/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("logarithmic scale: equal distance is equal percentage change");
    expect(html).toContain("a quarter behind");
  });

  test("the economy: five dated figures and the composition with its derived residual", async ({ page }) => {
    await page.goto("/atlas/japan");
    for (const key of ["inflation", "spending", "gni", "unemployment", "life"]) {
      await expect(page.getByTestId(`macro-${key}`)).toContainText(/World Bank/);
    }
    await expect(page.getByTestId("composition-residual")).toContainText("Taxes less subsidies 0.8%");
    await expect(page.getByTestId("composition-industry")).toContainText("manufacturing 18.8%");
  });

  test("the country's sensor links to its record", async ({ page }) => {
    await page.goto("/atlas/japan");
    await expect(page.getByTestId("sensor-link")).toHaveAttribute("href", "/market/japan");
  });

  test("canonical and title name the city", async ({ page }) => {
    await page.goto("/atlas/japan");
    await expect(page).toHaveTitle(/^Tokyo — Atlas/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/atlas\/japan$/);
  });

  test("an unverified city, a country with no survey and an unknown name have no page", async ({ page }) => {
    for (const slug of ["ireland", "korea", "south-africa", "chile", "singapore", "nowhere"]) {
      const res = await page.goto(`/atlas/${slug}`);
      expect(res?.status(), slug).toBe(404);
    }
  });

  test("the atlas table links the name, and the palette finds the city", async ({ page }) => {
    await page.goto("/atlas");
    await page.locator("#countries tbody a[href='/atlas/japan']").click();
    await expect(page).toHaveURL(/\/atlas\/japan$/);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Search pages, sensors, actions…").fill("tokyo");
    const group = dialog.getByRole("group", { name: "Cities" });
    await expect(group.getByRole("option", { name: /Tokyo/ })).toContainText("/atlas/japan");
  });

  for (const slug of ["japan", "france", "italy", "united-states"]) {
    test(`/atlas/${slug} has no WCAG 2.1 AA violations, with the parts open`, async ({ page }) => {
      await page.goto(`/atlas/${slug}`);
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
      await axe(page);
    });
  }
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("nothing overflows and the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/atlas/japan");
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await axe(page);
  });
});
