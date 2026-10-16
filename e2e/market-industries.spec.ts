import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 14 step 5: /market's Industries strip. Ten global sector baskets, each the
// close against the previous session's, strongest to weakest. They are not
// streamed, so nothing here depends on the feed; it needs the ticker for the
// daily bars the sweep (and the backfill) wrote.

const SYMBOLS = ["IXN", "IXP", "RXI", "IXG", "IXJ", "IXC", "KXI", "EXI", "MXI", "JXI"];
const LABELS: Record<string, string> = {
  IXN: "Technology", IXP: "Communications", RXI: "Discretionary", IXG: "Financials", IXJ: "Health care",
  IXC: "Energy", KXI: "Staples", EXI: "Industrials", MXI: "Materials", JXI: "Utilities",
};

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the ten baskets, each with its label", async ({ page }) => {
    await page.goto("/market");
    const tiles = page.locator('[data-testid^="industry-"]:not([data-testid="industry-change"])');
    await expect(tiles).toHaveCount(10);
    const ids = await tiles.evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")!.replace("industry-", "")));
    expect([...ids].sort()).toEqual([...SYMBOLS].sort());
    for (const symbol of SYMBOLS) {
      await expect(page.getByTestId(`industry-${symbol}`)).toContainText(LABELS[symbol]);
    }
    expect((await page.getByTestId("industries").innerText()).toLowerCase()).not.toContain("sim:");
  });

  test("orders them strongest to weakest by the day's change", async ({ page }) => {
    await page.goto("/market");
    const changes = await page
      .getByTestId("industries")
      .getByTestId("industry-change")
      .allTextContents();
    expect(changes).toHaveLength(10);
    const num = (s: string) => (s.includes("—") ? Number.NEGATIVE_INFINITY : parseFloat(s.replace("−", "-").replace("%", "")));
    const values = changes.map(num);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  test("dates the strip to a close, and says what a tile is", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("industries-vintage")).toHaveText(/^Last close, \d{1,2} \w{3} \d{4}$/);
    await expect(page.getByTestId("industries")).toContainText("its close against the previous session");
  });

  test("keeps the meters out of assistive technology: the printed figure is the information", async ({ page }) => {
    await page.goto("/market");
    const meters = page.getByTestId("industries").locator("li > span[aria-hidden='true']");
    await expect(meters).toHaveCount(10);
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market");
    await expect(page.getByTestId("industries")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("fits two or more tiles across without sideways scroll, and is axe clean", async ({ page }) => {
    await page.goto("/market");
    const strip = page.getByTestId("industries").locator("ul");
    await expect(strip).toBeVisible();
    const box = await strip.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const first = await page.locator('[data-testid^="industry-"]:not([data-testid="industry-change"])').nth(0).boundingBox();
    const second = await page.locator('[data-testid^="industry-"]:not([data-testid="industry-change"])').nth(1).boundingBox();
    expect(second!.y).toBeCloseTo(first!.y, 0); // the second tile sits beside the first
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
