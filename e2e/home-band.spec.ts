import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 14 step 9: the home band on the eighteen sensors, open and closed, with the
// proof strip. The simulator is never closed, so closed is shown by stubbing the
// browser's /api/market-state, as in market-closed.spec.ts; the server's own first
// paint is "open" here, so the band re-reads its line for the closed mode. The
// server-seeded closed first paint is covered by band-series.test.ts.

const HOUR = 60 * 60_000;
const MUTED = "rgb(139, 146, 155)"; // --text-muted

async function stubClosed(page: Page, inMs = 4 * HOUR + 12 * 60_000 + 30_000) {
  await page.route("**/api/market-state", (route) =>
    route.fulfill({
      json: { tripped: false, feed: "closed", session: "closed", opensAt: new Date(Date.now() + inMs).toISOString() },
    }),
  );
}

// The band's own `<section>`, found by what it holds rather than by a label that changes with the state.
const band = (page: Page) => page.locator("section[data-session]");
const quote = (page: Page) => page.getByTestId("band-quote");
const picker = (page: Page) => page.getByTestId("band-picker");

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("opens on RY, with a LIVE pill, and carries no simulator symbol", async ({ page }) => {
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "open");
    await expect(picker(page)).toContainText("Canada");
    await expect(picker(page)).toContainText("RY");
    await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("sim:");
  });

  test("the hero claim is true open or closed", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("eighteen real instruments, ingested, stored, and pushed to your browser while New York trades.")).toBeVisible();
    await expect(page.getByText("right now")).toHaveCount(0);
  });

  test("the picker lists the eighteen sensors, grouped, in the ticker's order", async ({ page }) => {
    await page.goto("/");
    await picker(page).click();
    const listbox = page.getByRole("listbox", { name: "Chart symbol" });
    await expect(listbox.getByRole("option")).toHaveCount(18);
    await expect(listbox.getByRole("group", { name: /^Countries/ }).getByRole("option")).toHaveCount(13);
    await expect(listbox.getByRole("group", { name: "Global" }).getByRole("option")).toHaveCount(5);
    const symbols = await listbox.getByRole("option").evaluateAll((els) => els.map((e) => e.children[1].textContent));
    expect(symbols[0]).toBe("RY");
    expect(symbols.slice(-5)).toEqual(["NVDA", "AAPL", "XOM", "JPM", "CAT"]);
  });

  test("picking another sensor changes the symbol and the line, and nothing re-ranks", async ({ page }) => {
    await page.goto("/");
    await picker(page).click();
    await page.getByRole("option", { name: /NVDA/ }).click();
    await expect(picker(page)).toContainText("NVDA");
    await expect(picker(page)).toContainText("Semiconductors");
    await expect(page.getByTestId("band-chart-open")).toHaveAttribute("aria-label", "Live price series, NVDA");
    // A reload goes back to the fixed default.
    await page.reload();
    await expect(picker(page)).toContainText("RY");
  });

  test("closed: a CLOSED pill, the state line, the last session's line in muted ink", async ({ page }) => {
    await stubClosed(page);
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await expect(page.getByText("CLOSED", { exact: true })).toBeVisible();
    const line = page.getByTestId("market-state-line");
    await expect(line).toContainText("Closed.");
    await expect(line).toContainText("Opens in 4h 12m");
    await expect(page.getByTestId("band-chart-closed")).toBeVisible();
    await expect(page.getByTestId("band-chart-closed").getByRole("img")).toHaveAttribute("aria-label", "RY, last session, closed");
    await expect(page.getByText("CLOSE", { exact: true })).toBeVisible();
    // The quote loses its market colour and says which close it is.
    await expect(quote(page)).toContainText(/close$/);
    await expect(quote(page).locator("span")).toHaveCSS("color", MUTED);
  });

  test("closed: an extended-hours quote does not move the band", async ({ page }) => {
    await stubClosed(page);
    await page.route("**/api/stream*", async (route) => {
      await expect(band(page)).toHaveAttribute("data-session", "closed");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: quote\ndata: ${JSON.stringify({ symbol: "RY", price: 999.5, volume: 1, time: new Date().toISOString() })}\n\n`,
      });
    });
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await page.waitForTimeout(1500);
    await expect(quote(page)).not.toContainText("999.50");
  });

  test("closed: the countdown falls as the clock does", async ({ page }) => {
    await page.clock.install({ time: new Date() });
    await stubClosed(page);
    await page.goto("/");
    await expect(page.getByTestId("market-state-line")).toContainText("Opens in 4h 12m");
    await page.clock.fastForward(75_000);
    await expect(page.getByTestId("market-state-line")).toContainText("Opens in 4h 11m");
  });

  test("closed: the picker still works and the picked sensor's last session is drawn", async ({ page }) => {
    await stubClosed(page);
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await picker(page).click();
    await page.getByRole("option", { name: /MUFG/ }).click();
    await expect(picker(page)).toContainText("MUFG");
    await expect(page.getByTestId("band-chart-closed").getByRole("img")).toHaveAttribute("aria-label", "MUFG, last session, closed");
  });

  test("the proof strip: four figures, the years derived, a link to the evidence", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByTestId("proof-strip");
    await expect(strip).toContainText(/^\d+\+ yrs full-stack/);
    await expect(strip).toContainText("50,000+ learners");
    await expect(strip).toContainText("99.9% uptime");
    await expect(strip).toContainText("5m→30s dashboard rescue");
    await strip.getByRole("link", { name: /The evidence/ }).click();
    await expect(page).toHaveURL(/\/about#impact$/);
    await expect(page.locator("#impact")).toBeVisible();
  });

  for (const [name, closed] of [["open", false], ["closed", true]] as const) {
    test(`${name} has no WCAG 2.1 AA violations, with the picker open`, async ({ page }) => {
      if (closed) await stubClosed(page);
      await page.goto("/");
      if (closed) await expect(band(page)).toHaveAttribute("data-session", "closed");
      await picker(page).click();
      await expect(page.getByRole("listbox", { name: "Chart symbol" })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closed: nothing overflows, the ticker stays, and the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await stubClosed(page, 65 * HOUR + 30 * 60_000);
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await expect(picker(page)).toContainText("RY");
    await expect(page.getByTestId("market-state-line")).toContainText("Opens in 2d 17h");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("open: the proof strip wraps inside the screen", async ({ page }) => {
    await page.goto("/");
    const box = await page.getByTestId("proof-strip").boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
