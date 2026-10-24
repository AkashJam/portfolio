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

  test("Dublin: the 2026 MESL edition, housing as private rent and a medical-card part that says how it was derived", async ({ page }) => {
    await page.goto("/atlas/ireland");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dublin");
    await expect(page.getByTestId("headline")).toContainText("€2,726.01");
    await expect(page.getByTestId("headline")).toContainText("2026");
    await expect(page.getByTestId("housing-tag")).toHaveAttribute("data-tag", "private_rent");
    await expect(page.getByTestId("second-line")).toContainText("Excluding housing €1,156.18");
    await expect(page.getByTestId("part")).toHaveCount(13);
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await expect(page.getByTestId("part").last()).toContainText("Health and insurance, net of the medical card");
    await expect(page.getByTestId("part").last()).toContainText("full medical card deduction €26.48");
    await expect(page.getByTestId("sources")).toContainText("MESL 2026");
    // Ireland's income figure carries a caveat on that one cell elsewhere; the survey is the point here.
    await expect(page.getByTestId("afford-ratio")).toBeVisible();
  });

  test("Amsterdam: verified on the July 2025 edition, which the page says may be superseded", async ({ page }) => {
    await page.goto("/atlas/netherlands");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Amsterdam");
    await expect(page.getByTestId("headline")).toContainText("€1,747");
    await expect(page.getByTestId("headline")).toContainText("2025");
    await expect(page.getByText("the July 2025 edition").first()).toBeVisible();
    await expect(page.getByTestId("sources")).toContainText("a 2026 edition may already exist");
    await expect(page.getByTestId("part")).toHaveCount(12);
  });

  test("Milan publishes a total, not a split, and has no currency line", async ({ page }) => {
    await page.goto("/atlas/italy");
    await expect(page.getByTestId("headline")).toContainText("€1,224.64");
    await expect(page.getByTestId("no-split")).toContainText("No basket split");
    await expect(page.getByTestId("basket")).toHaveCount(0);
    // The euro has no rate against itself: no currency card, and nothing for the share caption to point at.
    await expect(page.getByTestId("chart-currency")).toHaveCount(0);
    await expect(page.getByTestId("chart-currency-absent")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /per euro/ })).toHaveCount(0);
    await expect(page.getByTestId("chart-shares")).toContainText("in euros");
    await expect(page.getByTestId("chart-shares")).not.toContainText("beside the currency below");
    await expect(page.getByTestId("chart-shares")).toBeVisible();
  });

  // Phase 18 step 5, M23: the page added a full stop to a note that already ended in one.
  test("no sentence ends in two full stops", async ({ page }) => {
    for (const slug of ["italy", "turkiye", "israel"]) {
      await page.goto(`/atlas/${slug}`);
      const text = await page.locator("main").innerText();
      expect(text, slug).not.toMatch(/\.\.(\s|$)/);
    }
  });

  // Phase 18 step 5, M32: a log axis with one label, or none, cannot be read against.
  test("every log axis shows at least four labels", async ({ page }) => {
    for (const slug of ["japan", "canada", "united-kingdom", "china"]) {
      await page.goto(`/atlas/${slug}`);
      for (const id of ["shares", "currency"]) {
        const labels = page.getByTestId(`chart-${id}`).locator("span[aria-hidden='true'].absolute.-left-11");
        expect(await labels.count(), `${slug} ${id}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  test("affordability: the ratio with both legs, their years and the gap", async ({ page }) => {
    await page.goto("/atlas/japan");
    const block = page.getByTestId("affordability");
    await expect(block).toContainText("Derived on this page");
    await expect(page.getByTestId("afford-ratio")).toHaveText("56.1%");
    await expect(block).toContainText("The cost of living is 56.1% of what a typical person in Japan spends.");
    await expect(page.getByTestId("afford-cost")).toContainText("€774.48 a month, the survey's own figure in 2026 prices, converted at the ECB's 2025 average");
    await expect(page.getByTestId("afford-spending")).toContainText("€1,381 a month per person · World Bank");
    await expect(page.getByTestId("afford-spending")).toContainText("2024");
    await expect(page.getByTestId("afford-gap")).toContainText("The legs are 2 years apart");
    // A 3.2% inflation does not make a two-year gap worth a caveat.
    await expect(page.getByTestId("afford-caveat")).toHaveCount(0);
    // It sits between the chain and the basket, and never on the comparison page.
    const order = await page.locator("#cost, #afford, [data-testid=basket]").evaluateAll((els) => els.map((e) => e.id || e.getAttribute("data-testid")));
    expect(order).toEqual(["cost", "afford", "basket"]);
  });

  test("affordability: a carried figure shares a year with the spending", async ({ page }) => {
    await page.goto("/atlas/france");
    await expect(page.getByTestId("afford-gap")).toHaveText(/^Both legs are in \d{4}\.$/);
    await expect(page.getByTestId("afford-cost")).toContainText("the survey's figure carried to");
  });

  test("affordability: a fast-moving price level is called out, and the ratio is said to be overstated", async ({ page }) => {
    await page.goto("/atlas/turkiye");
    const caveat = page.getByTestId("afford-caveat");
    await expect(caveat).toContainText("Türkiye's prices rose");
    await expect(caveat).toContainText("overstated");
  });

  test("affordability: an average-consumption survey is worded as average against average", async ({ page }) => {
    await page.goto("/atlas/china");
    await expect(page.getByTestId("affordability")).toHaveAttribute("data-measure", "average");
    await expect(page.getByTestId("affordability")).toContainText("The average spend here is");
    await expect(page.getByTestId("afford-cost")).toContainText("Average spend, Shanghai");
    await expect(page.getByTestId("afford-spending")).toContainText("National average spend, China");
  });

  test("the comparison page carries no ratio", async ({ page }) => {
    await page.goto("/atlas");
    await expect(page.getByTestId("affordability")).toHaveCount(0);
    await expect(page.getByText(/affordability/i)).toHaveCount(0);
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
    for (const slug of ["korea", "south-africa", "chile", "singapore", "nowhere"]) {
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
    await dialog.getByPlaceholder("Search projects, posts, companies, cities…").fill("tokyo");
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
