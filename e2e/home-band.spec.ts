import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 20 step 2: Home — the hero's text with the live NVDA band full-bleed under it,
// the showcase rows and the contact section (phase18.md D4–D6). The simulator is never
// closed, so closed is shown by stubbing the browser's /api/market-state, as in
// market-closed.spec.ts; the server's own first paint is "open" here, so the band
// re-reads its line for the closed mode. The server-seeded closed first paint is
// covered by band-series.test.ts.

const HOUR = 60 * 60_000;

async function stubClosed(page: Page, inMs = 4 * HOUR + 12 * 60_000 + 30_000) {
  await page.route("**/api/market-state", (route) =>
    route.fulfill({
      json: { tripped: false, feed: "closed", session: "closed", opensAt: new Date(Date.now() + inMs).toISOString() },
    }),
  );
}

// The band's own `<section>`, found by what it holds rather than by a label that changes with the state.
const band = (page: Page) => page.locator("section[data-session]");

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("opens on NVDA, live, and carries no simulator symbol", async ({ page }) => {
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "open");
    await expect(page.getByTestId("band-chart-open")).toHaveAttribute("aria-label", "Live price series, NVDA");
    await expect(page.getByTestId("band-end-point")).toBeVisible();
    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("sim:");
  });

  test("the band carries no pill, symbol, price, picker or labels (D4)", async ({ page }) => {
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "open");
    const text = await band(page).innerText();
    // The feed's wording is for screen readers only, and only when the feed is interrupted.
    expect(text.trim()).toBe("");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByText("⌘K for all")).toHaveCount(0);
  });

  test("the sentence is true open or closed, and the band sits under the text", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/is one of them/)).toHaveText("The chart behind this page is one of them, live only while New York trades.", { useInnerText: true });
    await expect(page.getByText("right now")).toHaveCount(0);
    const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
    const chart = await band(page).boundingBox();
    expect(chart!.y).toBeGreaterThan(heading!.y + heading!.height);
    // Full-bleed: the band spans the whole viewport.
    expect(chart!.x).toBe(0);
    expect(chart!.width).toBe(1440);
  });

  test("the hero fills the screen under the bar, and Work does too", async ({ page }) => {
    await page.goto("/");
    const hero = await page.locator("main section").first().boundingBox();
    expect(hero!.height).toBeGreaterThanOrEqual(900 - 56 - 1);
    const work = await page.getByRole("heading", { name: "Three systems, end to end" }).locator("xpath=ancestor::section").boundingBox();
    expect(work!.height).toBeGreaterThanOrEqual(900 - 56 - 1);
  });

  test("closed: the last session's line, still, with no label and no state line", async ({ page }) => {
    await stubClosed(page);
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await expect(page.getByTestId("band-chart-closed")).toBeVisible();
    await expect(page.getByTestId("band-chart-closed").getByRole("img")).toHaveAttribute("aria-label", "NVDA, last session, closed");
    await expect(page.getByTestId("band-chart-open")).toHaveCount(0);
    await expect(page.getByText("CLOSED")).toHaveCount(0);
    await expect(page.getByText("CLOSE", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("market-state-line")).toHaveCount(0);
  });

  test("closed: an extended-hours quote does not move the band", async ({ page }) => {
    await stubClosed(page);
    await page.route("**/api/stream*", async (route) => {
      await expect(band(page)).toHaveAttribute("data-session", "closed");
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: quote\ndata: ${JSON.stringify({ symbol: "NVDA", price: 999.5, volume: 1, time: new Date().toISOString() })}\n\n`,
      });
    });
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("band-chart-closed")).toBeVisible();
    await expect(page.getByTestId("band-chart-open")).toHaveCount(0);
  });

  test("three stats, the years derived, and no link to the evidence", async ({ page }) => {
    await page.goto("/");
    const stats = page.getByRole("list", { name: "At a glance" });
    await expect(stats).toHaveText(/\d+\+ yrs\s*full-stack\s*50,000\+\s*learners\s*99\.9%\s*uptime/, { useInnerText: true });
    await expect(page.getByText("5m→30s")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /The evidence/ })).toHaveCount(0);
  });

  test("the dashboard button is a link, not a button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Open the dashboard" })).toHaveAttribute("href", "/market");
    await expect(page.getByRole("button", { name: "Open the dashboard" })).toHaveCount(0);
  });

  test("three showcase rows in order, each opening its case study, Market's with its own live link", async ({ page }) => {
    await page.goto("/");
    const rows = page.locator("article").filter({ has: page.getByRole("heading", { level: 3 }) });
    await expect(rows).toHaveCount(3);
    await expect(rows.getByRole("heading", { level: 3 })).toHaveText(["Market (Ticker)", "Internal Admin Tool", "Microlearning"]);
    await expect(rows.nth(0).getByRole("link", { name: "Market (Ticker)" })).toHaveAttribute("href", "/projects/market-ticker");
    await expect(rows.nth(0).getByRole("link", { name: /See it live/ })).toHaveAttribute("href", "/market");
    await expect(page.getByRole("link", { name: /See it live/ })).toHaveCount(1);
    await expect(page.getByText("Built with")).toHaveCount(0);
    await expect(page.getByText("FEATURED")).toHaveCount(0);
    // The whole row is the link: a click on its picture lands on the case study.
    // (`force`: the stretched link is meant to be what receives the click.)
    await rows.nth(1).locator("figure").click({ force: true });
    await expect(page).toHaveURL(/\/projects\/internal-admin-tool$/);
  });

  test("contact: Email me, the address, and a copy action that says it copied", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const mail = page.getByRole("link", { name: "Email me" });
    await expect(mail).toHaveAttribute("href", /^mailto:/);
    const address = (await mail.getAttribute("href"))!.replace("mailto:", "");
    await page.getByRole("button", { name: "Copy email address" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Email address copied" })).toBeAttached();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(address);
  });

  for (const [name, closed] of [["open", false], ["closed", true]] as const) {
    test(`${name} has no WCAG 2.1 AA violations`, async ({ page }) => {
      if (closed) await stubClosed(page);
      await page.goto("/");
      if (closed) await expect(band(page)).toHaveAttribute("data-session", "closed");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closed: nothing overflows, the sentence says under, and the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await stubClosed(page, 65 * HOUR + 30 * 60_000);
    await page.goto("/");
    await expect(band(page)).toHaveAttribute("data-session", "closed");
    await expect(page.getByText(/is one of them/)).toHaveText("The chart under this page is one of them, live only while New York trades.", { useInnerText: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("open: the button is full width, the stats stay inside the screen, and each row's picture sits above its text", async ({ page }) => {
    await page.goto("/");
    const button = await page.getByRole("link", { name: "Open the dashboard" }).boundingBox();
    expect(button!.width).toBeGreaterThanOrEqual(390 - 2 * 16 - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const row = page.locator("article").filter({ has: page.getByRole("heading", { level: 3 }) }).first();
    const picture = await row.locator("figure").boundingBox();
    const title = await row.getByRole("heading", { level: 3 }).boundingBox();
    expect(picture!.y + picture!.height).toBeLessThanOrEqual(title!.y);
  });
});
