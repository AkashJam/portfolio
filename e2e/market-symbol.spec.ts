import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 14 step 8, moved to /market/<sensor>/price by Phase 16 step 2: the price page for the eighteen sensors. A sensor is named by
// its place and symbol, a basket or any other real symbol has no page, and the
// closed state is step 7's, applied to the header and the chart. The simulator is
// never closed, so closed is shown by stubbing the browser's /api/market-state, as
// in market-closed.spec.ts. The chart is a canvas, so what it draws is read from
// the attributes the chart exposes, not from pixels.

const HOUR = 60 * 60_000;
const MUTED = "rgb(139, 146, 155)"; // --text-muted

const closedBody = (inMs: number) => ({
  tripped: false,
  feed: "closed",
  session: "closed",
  opensAt: new Date(Date.now() + inMs).toISOString(),
});

async function stubClosed(page: Page, inMs = 4 * HOUR + 12 * 60_000 + 30_000) {
  await page.route("**/api/market-state", (route) => route.fulfill({ json: closedBody(inMs) }));
}

const snapshot = (page: Page) => page.locator("[data-session]").first();

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a country sensor is named by its country and symbol, under a breadcrumb", async ({ page }) => {
    await page.goto("/market/MUFG/price");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan · MUFG");
    const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumb).toContainText("Market / Japan / Price");
    await expect(crumb.getByRole("link", { name: "Market" })).toHaveAttribute("href", "/market");
    await expect(page.getByText("country sensor")).toBeVisible();
    await expect(page).toHaveTitle(/^Japan · MUFG — Market/);
  });

  test("a global sensor is named by its theme", async ({ page }) => {
    await page.goto("/market/NVDA/price");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semiconductors · NVDA");
    await expect(page.getByText("global sensor")).toBeVisible();
  });

  test("a real symbol that is not a sensor has no page", async ({ page }) => {
    const res = await page.goto("/market/IXN/price");
    expect(res?.status()).toBe(404);
  });

  test("a simulator symbol still renders in dev and CI, with no place and no breadcrumb", async ({ page }) => {
    await page.goto("/market/SIM:NOVA/price");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("SIM:NOVA");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
  });

  test("a sensor's page carries no simulator copy", async ({ page }) => {
    await page.goto("/market/MUFG/price");
    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("sim:");
    expect(text).not.toContain("simulated");
  });

  test("the daily view has no volume panel and the intraday views keep it", async ({ page }) => {
    await page.goto("/market/MUFG/price");
    const chart = page.getByTestId("price-chart");
    // The page opens on 1h, or on 1d while a sensor has no intraday bars yet.
    await page.getByRole("button", { name: "1h", exact: true }).click();
    await expect(chart).toHaveAttribute("data-volume", "true");
    await page.getByRole("button", { name: "1d", exact: true }).click();
    await expect(chart).toHaveAttribute("data-volume", "false");
    await page.getByRole("button", { name: "15m", exact: true }).click();
    await expect(chart).toHaveAttribute("data-volume", "true");
  });

  test("closed: the header is frozen in muted ink and says when it opens", async ({ page }) => {
    await stubClosed(page);
    await page.goto("/market/MUFG/price");
    await expect(snapshot(page)).toHaveAttribute("data-session", "closed");
    await expect(page.getByTestId("market-state-line")).toContainText("Opens in 4h 12m");
    await expect(page.getByTestId("symbol-asof")).toHaveText(/^Frozen · .+ · opens in 4h 12m$/);
    await expect(page.getByTestId("live-price")).toHaveCSS("color", MUTED);
    await expect(page.getByText("SSE connected")).toBeVisible();
  });

  test("closed: an extended-hours quote still arriving does not move the price", async ({ page }) => {
    await stubClosed(page);
    // The server's first paint is open under the simulator, so hold the quote until
    // the poll has frozen the page; in production the server seeds it closed.
    await page.route("**/api/stream*", async (route) => {
      await expect(snapshot(page)).toHaveAttribute("data-session", "closed");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: quote\ndata: ${JSON.stringify({ symbol: "MUFG", price: 99.5, volume: 1, time: new Date().toISOString() })}\n\n`,
      });
    });
    await page.goto("/market/MUFG/price");
    await expect(snapshot(page)).toHaveAttribute("data-session", "closed");
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("live-price")).not.toHaveText("99.50");
    await expect(page.getByTestId("symbol-asof")).not.toContainText("Live");
  });

  test("open: not frozen, and the price is in a market colour", async ({ page }) => {
    await page.route("**/api/market-state", (route) =>
      route.fulfill({ json: { tripped: false, feed: "live", session: "open", opensAt: null } }),
    );
    await page.goto("/market/MUFG/price");
    await expect(page.getByTestId("market-state-line")).toContainText("Open.");
    await expect(page.locator("[data-session='closed']")).toHaveCount(0);
    await expect(page.getByTestId("symbol-asof")).not.toContainText("Frozen");
    await expect(page.getByTestId("live-price")).not.toHaveCSS("color", MUTED);
  });

  for (const [name, closed] of [["open", false], ["closed", true]] as const) {
    test(`${name} has no WCAG 2.1 AA violations`, async ({ page }) => {
      if (closed) await stubClosed(page);
      await page.goto("/market/MUFG/price");
      if (closed) await expect(snapshot(page)).toHaveAttribute("data-session", "closed");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }

  test("an Atlas row's sensor symbol links to the sensor's record", async ({ page }) => {
    await page.goto("/atlas");
    const link = page.locator("#countries tbody tr td:first-child small a[href='/market/japan']");
    await link.click();
    await expect(page).toHaveURL(/\/market\/japan$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan");
  });

  test("the price page answers to the symbol as well as the country, and the record links to it", async ({ page }) => {
    await page.goto("/market/japan/price");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan · MUFG");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/market\/japan\/price$/);
    await page.goto("/market/MUFG/price");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan · MUFG");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/market\/japan\/price$/);
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Japan" }).click();
    await expect(page).toHaveURL(/\/market\/japan$/);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closed: nothing overflows and the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await stubClosed(page, 65 * HOUR + 30 * 60_000);
    await page.goto("/market/MUFG/price");
    await expect(snapshot(page)).toHaveAttribute("data-session", "closed");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
