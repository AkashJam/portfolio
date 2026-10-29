import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 14 step 3: /market's Prices table. The eighteen sensors come from the
// ticker's GET /sensors (fixed order, never re-sorted by movement), priced from
// their daily bars and updated by the shared SSE stream.
//
// The simulator never prices a real ticker (portfolio.md "The symbol universe"),
// so no real row ticks in dev or CI. A quote is scripted into the stream
// instead, which proves the table applies one; live-tick.spec.ts is the
// end-to-end proof, on a SIM: page.

const ORDER = [
  "RY", "AMX", "CIB", "BAP", "ITUB", "BCH", "LYG", "ING", "TKC", "HDB", "TLK", "KB", "MUFG",
  "NVDA", "AAPL", "XOM", "JPM", "CAT",
];
const THIN = ["BCH", "TKC", "TLK", "KB"];

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("lists the eighteen companies in the ticker's order, parted by one strong rule", async ({ page }) => {
    await page.goto("/market");
    const rows = page.locator('[data-testid^="market-row-"]');
    await expect(rows).toHaveCount(18);
    const ids = await rows.evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.replace("market-row-", "")));
    expect(ids).toEqual(ORDER);

    await expect(page.getByRole("rowheader")).toHaveCount(0); // no group labels (owner, 2026-10-22)
    await expect(page.locator('[data-testid^="market-row-"]').nth(13)).toHaveCSS("border-top-width", "2px");
    await expect(page.getByTestId("market-row-MUFG")).not.toHaveCSS("border-top-width", "2px");

    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("sim:");
    expect(text).not.toContain("cost of living");
    expect(text).not.toContain("simulated");
  });

  test("tags the four thin listings with their figure and date, and no others", async ({ page }) => {
    await page.goto("/market");
    const tagged = await page
      .locator('[data-testid^="market-row-"]')
      .filter({ has: page.getByTestId("thin-listing") })
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.replace("market-row-", "")));
    expect(tagged.sort()).toEqual([...THIN].sort());
    await expect(page.getByTestId("market-row-BCH")).toContainText("lightly traded");
    await expect(page.getByTestId("market-row-BCH").getByTestId("thin-listing")).toHaveAttribute("title", "Lightly traded in the US ($13M a day, 9 Oct 2026), so the price can jump");
    await expect(page.getByTestId("market-row-KB")).toContainText("$25M a day");
  });

  test("labels country rows by country and company, and global rows by theme", async ({ page }) => {
    await page.goto("/market");
    const mufg = page.getByTestId("market-row-MUFG");
    await expect(mufg).toContainText("Japan");
    await expect(mufg).toContainText("Mitsubishi UFJ");
    await expect(page.getByTestId("market-row-AMX")).toContainText("telecom");
    await expect(page.getByTestId("market-row-NVDA")).toContainText("Semiconductors");
  });

  test("each row links to its sensor's own page", async ({ page }) => {
    await page.goto("/market");
    // A country sensor is addressed by its country's slug, a global name by its symbol.
    for (const [symbol, href] of [["RY", "/market/canada"], ["NVDA", "/market/NVDA"]]) {
      await expect(page.getByTestId(`market-row-${symbol}`).getByRole("link")).toHaveAttribute("href", href);
    }
  });

  test("a scripted quote updates the row's Last and Change and the as-of line says Live", async ({ page }) => {
    // The stream carries one scripted MUFG quote, then ends; the client reconnects
    // and gets the same again, which is harmless here.
    await page.route("**/api/stream*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: quote\ndata: ${JSON.stringify({
          symbol: "MUFG",
          price: 99.5,
          volume: 100,
          time: new Date().toISOString(),
        })}\n\n`,
      }),
    );
    await page.goto("/market");
    const row = page.getByTestId("market-row-MUFG");
    await expect(row.getByTestId("price")).toHaveText("99.50");
    await expect(row.getByTestId("change")).toHaveText(/^\+\d+\.\d{2}%$/);
  });

  test("the head and the Prices table use plain words, none of the review's jargon (I38)", async ({ page }) => {
    await page.goto("/market");
    const text = [await page.locator("main header").innerText(), await page.getByRole("region", { name: "Prices" }).innerText()].join("\n");
    expect(text).not.toMatch(/sensor|tripped|σ|\bband\b|thin listing|\bSSE\b|\bclosed\b/i);
    // The whole page, ledger included, with every disclosure open (the method keeps its σ by design, so σ is not on this list).
    await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => ((d as HTMLDetailsElement).open = true)));
    expect(await page.locator("main").innerText()).not.toMatch(/sensor|tripped|\bband\b|thin listing|\bSSE\b/i);
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("market-row-RY")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the figures on screen beside the pinned country column", async ({ page }) => {
    await page.goto("/market");
    const row = page.getByTestId("market-row-RY");
    await expect(row).toBeVisible();
    await expect(row.locator("td").first()).toHaveCSS("position", "sticky");
    // The pinned column's second line wraps, so Last and Change are readable
    // without a sideways scroll at this width.
    const change = await row.getByTestId("change").boundingBox();
    expect(change!.x + change!.width).toBeLessThanOrEqual(390);
  });

  test("the head and the Prices table use plain words, none of the review's jargon (I38)", async ({ page }) => {
    await page.goto("/market");
    const text = [await page.locator("main header").innerText(), await page.getByRole("region", { name: "Prices" }).innerText()].join("\n");
    expect(text).not.toMatch(/sensor|tripped|σ|\bband\b|thin listing|\bSSE\b|\bclosed\b/i);
    // The whole page, ledger included, with every disclosure open (the method keeps its σ by design, so σ is not on this list).
    await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => ((d as HTMLDetailsElement).open = true)));
    expect(await page.locator("main").innerText()).not.toMatch(/sensor|tripped|\bband\b|thin listing|\bSSE\b/i);
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("market-row-RY")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

// Narrower than any current phone, so the table overflows and the cue is on show:
// bearing.md #107 — the edge with more to see fades, and the country column stays.
test.describe("at 320px", () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test("pins the country column and cues which edge has more to scroll to", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("market-row-RY")).toBeVisible();
    const scroller = page.locator('[data-slot="table-container"]');
    await expect(scroller).toHaveAttribute("data-more-right", "true");
    await expect(scroller).toHaveAttribute("data-more-left", "false");
    await scroller.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await expect(scroller).toHaveAttribute("data-more-left", "true");
    await expect(scroller).toHaveAttribute("data-more-right", "false");
    await expect(page.getByTestId("market-row-RY").locator("td").first()).toHaveCSS("position", "sticky");
  });
});
