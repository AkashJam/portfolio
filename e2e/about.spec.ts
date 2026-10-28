import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 20 step 6: /about as `site-review/about.html` draws it (phase18.md D7, I35, I4): three stats
// in one row at every width, one bio colour, "Download résumé" with no "PDF", Experience under three
// headings with neutral markers but the achievements' green ✦, Education, and no impact ledger.
// Needs no ticker.

const roles = (page: Page) => page.locator("article").filter({ has: page.getByRole("heading", { level: 3 }) });
const colour = (loc: ReturnType<Page["locator"]>) => loc.evaluate((el) => getComputedStyle(el).color);

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("three stats in one row, the figures larger than their labels, #impact on the row", async ({ page }) => {
    await page.goto("/about");
    const row = page.locator("#impact");
    await expect(row.locator("b")).toHaveText(["50,000+", "99.9%", "5m→30s"]);
    const ys = await row.locator("b").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
    expect(new Set(ys).size).toBe(1);
    const sizes = await row.evaluate((el) => ({
      figure: parseFloat(getComputedStyle(el.querySelector("b")!).fontSize),
      label: parseFloat(getComputedStyle(el.querySelector("span")!).fontSize),
    }));
    expect(sizes.figure).toBeGreaterThanOrEqual(2 * sizes.label);
    await expect(page.getByText("~8")).toHaveCount(0);
    await expect(page.getByText("+12%")).toHaveCount(0);
  });

  test("both bio paragraphs are one colour", async ({ page }) => {
    await page.goto("/about");
    const paragraphs = page.locator("main p").filter({ hasText: /Full-Stack Engineer based in Milan|What I care about most/ });
    await expect(paragraphs).toHaveCount(2);
    expect(await colour(paragraphs.nth(0))).toBe(await colour(paragraphs.nth(1)));
  });

  test('the résumé button says "Download résumé", with no PDF', async ({ page }) => {
    await page.goto("/about");
    const link = page.getByRole("link", { name: "Download résumé" });
    await expect(link).toHaveAttribute("href", "/resume.pdf");
    await expect(page.getByText("PDF")).toHaveCount(0);
  });

  test("each role has its three headings and the agreed number of bullets", async ({ page }) => {
    await page.goto("/about");
    const counts = [];
    for (let i = 0; i < 2; i++) {
      const card = roles(page).nth(i);
      await expect(card.getByRole("heading", { level: 4 })).toHaveText(["Responsibilities", "Achievements", "Key decisions"]);
      counts.push(await card.locator("li").count());
    }
    expect(counts).toEqual([11, 5]);
    await expect(roles(page).first()).toContainText("Full-Stack Engineer · Lifeed");
  });

  test("markers are neutral except the achievements' green ✦", async ({ page }) => {
    await page.goto("/about");
    const marker = (selector: string) =>
      roles(page).first().locator(selector).first().evaluate((el) => getComputedStyle(el, "::before").color);
    const green = await marker("div:has(> h4:text('Achievements')) li");
    const dash = await marker("div:has(> h4:text('Responsibilities')) li");
    const arrow = await marker("div:has(> h4:text('Key decisions')) li");
    expect(dash).toBe(arrow);
    expect(green).not.toBe(dash);
    expect(green).toBe("rgb(38, 166, 154)");
  });

  test("the timeline's dots are neutral, and only the current role's is green", async ({ page }) => {
    await page.goto("/about");
    const dots = page.locator("main b.rounded-full");
    expect(await dots.count()).toBe(4);
    const colours = await dots.evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor));
    expect(colours[0]).toBe("rgb(38, 166, 154)");
    expect(new Set(colours.slice(1)).size).toBe(1);
    expect(colours[1]).not.toBe(colours[0]);
  });

  test("Education has its two entries, and the impact ledger is gone", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 3, name: "MSc, Computer Science & Engineering" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "BSc, Computer Science & Technology" })).toBeVisible();
    await expect(page.locator("article", { hasText: "MSc, Computer Science" })).toContainText("Politecnico di Milano");
    await expect(page.locator("article", { hasText: "BSc, Computer Science" })).toContainText("SRM University");
    await expect(page.getByText(/impact ledger/i)).toHaveCount(0);
  });

  test("no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/about");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the stats stay in one row, nothing overflows, and no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/about");
    const ys = await page.locator("#impact b").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
    expect(new Set(ys).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
