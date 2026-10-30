import { gotoAtlas } from "./atlas-hydrated";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 16 step 4: /atlas/[city] against the real city endpoint (the embedded
// snapshots, so no vendor key and no market hours). Phase 22 step 4: the kind as the
// heading, the change block where a survey has two editions, one reading per chart and
// the method behind a toggle. Tokyo is the no-carry case with a hatched welfare ceiling
// and a change block from 2023; Dijon is carried on CPI from 2014, says its rent is a
// medium-city rent and has no change block; Milan publishes a total and no split, is in the euro area and has
// the change block (ISTAT from 2014); Toronto has one from 2020.

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

    // The kind names the figure, with its gloss; the chain of steps is behind the toggle.
    await expect(page.getByTestId("kind")).toHaveText("Benefit standard or reference budget");
    await expect(page.getByTestId("kind-gloss")).toHaveText("What the state pays as a basic benefit, or prices a basket of essentials at.");
    await expect(page.getByTestId("headline-eur")).toContainText("at the ECB's 2025 average");
    const method = page.getByTestId("method");
    await expect(method).toHaveJSProperty("open", false);
    await expect(method).toContainText("Public assistance standard");
    await expect(method).toContainText("No carry-forward");
    await expect(method).toContainText("(2026) is not older than Japan's latest CPI year (2025)");
    await expect(method).toContainText("the ECB's 2025 average");
    // Japan's change block runs from the October 2023 revision.
    await expect(page.getByTestId("change-block").getByRole("heading")).toHaveText("How it has changed since 2023");
    await expect(page.getByTestId("no-change")).toHaveCount(0);

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
    const method = page.getByTestId("method");
    await expect(method).toContainText(/Adjusted to \d{4} prices \(\+[\d.]+%\)/);
    await expect(method).toContainText("consumer price index was");
    await expect(method).toContainText("uses the euro: no conversion");
    await expect(page.getByTestId("headline-eur")).toHaveCount(0);
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
  });

  test("Amsterdam: verified on the July 2025 edition, which the page says may be superseded", async ({ page }) => {
    await page.goto("/atlas/netherlands");
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Amsterdam");
    await expect(page.getByTestId("headline")).toContainText("€1,747");
    await expect(page.getByTestId("headline")).toContainText("2025");
    await expect(page.getByText("the July 2025 edition").first()).toBeVisible();
    await expect(page.getByTestId("sources")).toContainText("a 2026 edition may already exist");
    await expect(page.getByTestId("part")).toHaveCount(12);
  });

  test("Milan publishes a total, not a split, and has no currency line", async ({ page }) => {
    await page.goto("/atlas/italy");
    await expect(page.getByTestId("headline")).toContainText("€1,256.37");
    await expect(page.getByTestId("headline")).toContainText("2025");
    await expect(page.getByTestId("kind")).toHaveText("Poverty line");
    // The euro page has no euro beside the figure, no "EUR per euro" and says "in euros".
    await expect(page.getByTestId("headline-eur")).toHaveCount(0);
    await expect(page.getByTestId("facts")).toContainText("In euros, no conversion");
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

  test("Milan's change block sets the poverty line against prices and spending since 2014", async ({ page }) => {
    await page.goto("/atlas/italy");
    const block = page.getByTestId("change-block");
    await expect(block.getByRole("heading", { name: "How it has changed since 2014" })).toBeVisible();
    await expect(page.getByTestId("change-reading")).toHaveText(
      "Milan's poverty line rose 23% from 2014 to 2025, in step with prices, while what a person in Italy spends on average rose 35%.",
    );
    await expect(block.locator("polyline")).toHaveCount(3);
    await expect(block.locator("svg")).toHaveAttribute("aria-label", /each 100 in 2014, to 2025/);
    await expect(block).toContainText("Each line is 100 in 2014.");
    await expect(page.getByTestId("no-change")).toHaveCount(0);
  });

  test("Toronto has a change block from 2020, and Dijon none", async ({ page }) => {
    await page.goto("/atlas/canada");
    await expect(page.getByTestId("change-block").getByRole("heading")).toHaveText("How it has changed since 2020");
    await expect(page.getByTestId("change-reading")).toContainText("Toronto's poverty line");
    // France has one edition on file (2014): one line instead of the change block.
    await page.goto("/atlas/france");
    await expect(page.getByTestId("change-block")).toHaveCount(0);
    await expect(page.getByTestId("no-change")).toContainText("No earlier edition");
  });

  test("where the survey is itself average spending, the other line is named as national and Mumbai says urban Maharashtra", async ({ page }) => {
    await page.goto("/atlas/china");
    await expect(page.getByTestId("change-reading")).toHaveText(
      "Shanghai's average spending rose 49% from 2015 to 2024, faster than prices, while national household spending per person rose 97%.",
    );
    await page.goto("/atlas/india");
    await expect(page.getByTestId("change-reading")).toContainText("Urban Maharashtra's average spending rose 11% from 2023 to 2024");
    await expect(page.getByTestId("change-block")).toContainText("not Urban Maharashtra's");
    await expect(page.getByTestId("change-block").locator('[data-end="spending"] text').first()).toHaveText("National");
  });

  test("each chart has a one-line reading, and the method sits behind the toggle", async ({ page }) => {
    await page.goto("/atlas/japan");
    await expect(page.getByTestId("chart-shares-reading")).toHaveText(/^At [\d,]+ in [A-Z][a-z]+ \d{4}, .* its 2015 level, in yen and before inflation\. The chart below shows what the yen was worth in euros\.$/);
    await expect(page.getByTestId("chart-currency-reading")).toHaveText(/^[\d.,]+ yen to the euro in [A-Z][a-z]+ \d{4}, .*\. A rising line is a weaker yen\.$/);
    await expect(page.getByTestId("chart-housing-reading")).toHaveText(/^\d+% (above|below) 2010, and .*\./);
    // Dataset IDs and the scale note are in the method, not under the charts.
    await expect(page.getByTestId("chart-shares")).not.toContainText("SPASTT01");
    const method = page.getByTestId("method");
    await expect(method).toHaveJSProperty("open", false);
    await expect(method).toContainText("SPASTT01JPM661N");
    await expect(method).toContainText("logarithmic scale");
    await method.locator("summary").click();
    await expect(method).toHaveJSProperty("open", true);
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
    expect(html).toContain("equal distance is equal percentage change");
    expect(html).toContain("a quarter behind");
  });

  test("the economy: five dated figures and the composition with its derived residual", async ({ page }) => {
    await page.goto("/atlas/japan");
    for (const key of ["inflation", "spending", "gni", "unemployment", "life"]) {
      await expect(page.getByTestId(`macro-${key}`)).toContainText(/20\d\d/);
    }
    await expect(page.getByTestId("method")).toContainText("World Bank");
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
    await gotoAtlas(page, "countries");
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
