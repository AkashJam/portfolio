import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 14 step 7: the closed state. "Closed" is the regular session, not feed
// silence: US hours are 15:30-22:00 CET, so a European reader sees this state
// roughly seven times in ten. The simulator is never closed, so each state is shown
// by stubbing the browser's /api/market-state; the server's own first-paint seed is
// "open" under the simulator, and the stub flips it. The server-seeded closed first
// paint is covered by the unit test of seedFromResponse, not here.

type Stub = { feed: string; session: string; opensAt: string | null; tripped?: boolean };

const MIN = 60_000;
const HOUR = 60 * MIN;

const closedStub = (inMs: number, feed = "closed"): Stub => ({
  feed,
  session: "closed",
  opensAt: new Date(Date.now() + inMs).toISOString(),
  tripped: false,
});

async function stub(page: Page, body: Stub) {
  await page.route("**/api/market-state", (route) => route.fulfill({ json: { tripped: false, ...body } }));
}

const MUTED = "rgb(139, 146, 155)"; // --text-muted
const UP = "rgb(38, 166, 154)"; // --market-up
const DOWN = "rgb(239, 83, 80)"; // --market-down

const line = (page: Page) => page.getByTestId("market-state-line");
const table = (page: Page) => page.locator("[data-session]");

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("closed: the state row says the last close and when it opens, in plain words", async ({ page }) => {
    await stub(page, closedStub(4 * HOUR + 12 * MIN + 30_000));
    await page.goto("/market");
    await expect(line(page)).toHaveAttribute("data-tone", "closed");
    await expect(line(page)).toContainText(/Last close \d{1,2} \w{3}, 16:00 ET · opens in 4h 12m/);
    await expect(line(page)).not.toContainText("Closed");
    await expect(page.getByText("Closed", { exact: false })).toHaveCount(0);
    await expect(page.getByTestId("live-chip")).toHaveCount(0);
  });

  test("closed: the table is frozen, in muted ink with no up or down colour", async ({ page }) => {
    await stub(page, closedStub(4 * HOUR + 12 * MIN + 30_000));
    await page.goto("/market");
    await expect(table(page)).toHaveAttribute("data-session", "closed");

    const row = page.getByTestId("market-row-MUFG");
    await expect(row.getByTestId("price")).toHaveCSS("color", MUTED);
    await expect(row.getByTestId("change")).toHaveCSS("color", MUTED);
    // Frozen is drawn in ink, not opacity: the muted second lines must stay readable.
    await expect(table(page)).toHaveCSS("opacity", "1");
  });

  test("closed: no stream pill, and no word SSE, anywhere on the page (M15)", async ({ page }) => {
    await stub(page, closedStub(HOUR));
    await page.goto("/market");
    await expect(page.getByText("SSE")).toHaveCount(0);
  });

  test("closed: Industries is not dimmed and keeps its colours", async ({ page }) => {
    await stub(page, closedStub(HOUR));
    await page.goto("/market");
    const strip = page.getByTestId("industries");
    await expect(strip).toHaveCSS("opacity", "1");
    const colours = await strip.getByTestId("industry-change").evaluateAll((els) => els.map((e) => getComputedStyle(e).color));
    // The strip keeps the market colours the table has just given up.
    expect(colours.some((c) => c === UP)).toBe(true);
    expect(colours.some((c) => c === DOWN)).toBe(true);
  });

  test("closed: an extended-hours quote still arriving does not move the table", async ({ page }) => {
    // The feed is live (after-hours trades flow) but the session is closed.
    await stub(page, closedStub(HOUR, "live"));
    // The server's first paint is "open" under the simulator, so hold the quote until
    // the poll has frozen the table; in production the server seeds it closed.
    await page.route("**/api/stream*", async (route) => {
      await expect(table(page)).toHaveAttribute("data-session", "closed");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: quote\ndata: ${JSON.stringify({ symbol: "MUFG", price: 99.5, volume: 1, time: new Date().toISOString() })}\n\n`,
      });
    });
    await page.goto("/market");
    const price = page.getByTestId("market-row-MUFG").getByTestId("price");
    await expect(table(page)).toHaveAttribute("data-session", "closed");
    await page.waitForTimeout(1500);
    await expect(price).not.toHaveText("99.50");
  });

  test("the nav draws no dot while closed", async ({ page }) => {
    // A closed session is quiet, and a quiet day draws nothing (I12): the slot is there to hold
    // the space, hidden from readers, and the Market tab has no image in it.
    await stub(page, closedStub(HOUR, "live"));
    await page.goto("/market");
    const slot = page.locator('header a[href="/market"] [data-market-state]');
    await expect(slot).toHaveAttribute("data-market-state", "quiet");
    await expect(slot).toHaveAttribute("data-dot", "hidden");
    await expect(page.locator('header a[href="/market"] [role="img"]')).toHaveCount(0);
  });

  test("the countdown falls as the clock does", async ({ page }) => {
    await page.clock.install({ time: new Date() });
    await stub(page, closedStub(4 * HOUR + 12 * MIN + 30_000));
    await page.goto("/market");
    await expect(line(page)).toContainText("opens in 4h 12m");
    await page.clock.fastForward(75_000);
    await expect(line(page)).toContainText("opens in 4h 11m");
  });

  test("open: no freeze, and the LIVE chip is the state", async ({ page }) => {
    await stub(page, { feed: "live", session: "open", opensAt: null });
    await page.goto("/market");
    await expect(line(page)).toHaveAttribute("data-tone", "open");
    await expect(page.getByTestId("live-chip")).toHaveText("LIVE");
    await expect(table(page)).toHaveAttribute("data-session", "open");
    await expect(page.getByText("SSE")).toHaveCount(0);
  });

  test("unreachable: it says so, never closed, and does not freeze", async ({ page }) => {
    await stub(page, { feed: "stale", session: "open", opensAt: null });
    await page.goto("/market");
    await expect(line(page)).toHaveAttribute("data-tone", "unreachable");
    await expect(line(page)).toContainText("Unreachable.");
    await expect(line(page)).not.toContainText("Closed");
    await expect(table(page)).toHaveAttribute("data-session", "open");
  });

  test("a closed session whose ticker cannot be reached is unreachable, not closed", async ({ page }) => {
    await page.route("**/api/market-state", (route) => route.abort());
    await page.goto("/market");
    await expect(line(page)).toHaveAttribute("data-tone", "unreachable");
  });

  test("closed has no WCAG 2.1 AA violations", async ({ page }) => {
    await stub(page, closedStub(4 * HOUR));
    await page.goto("/market");
    await expect(table(page)).toHaveAttribute("data-session", "closed");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closed: the line wraps inside the screen, and the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await stub(page, closedStub(65 * HOUR + 30 * MIN));
    await page.goto("/market");
    await expect(line(page)).toContainText("Opens in 2d 17h");
    const box = await line(page).boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
