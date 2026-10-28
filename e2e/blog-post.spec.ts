import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 20 step 5: a post's opening paragraph is its lead, its footer carries the case study, up to
// three related posts and the posts before and after it (I28), and below 1024px its contents are a
// closed disclosure (I8). Needs no ticker.

const footer = (page: Page) => page.locator("footer[aria-label='After the post']");
const article = (page: Page) => page.locator("main article");

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the opening paragraph is the lead, and the second is body text", async ({ page }) => {
    await page.goto("/blog/rsc-and-seo");
    const paragraphs = article(page).locator(".prose > p");
    await expect(paragraphs.first()).toHaveClass(/lead/);
    await expect(paragraphs.first()).toHaveCSS("font-size", "18px");
    await expect(paragraphs.nth(1)).not.toHaveClass(/lead/);
    await expect(paragraphs.nth(1)).toHaveCSS("font-size", "16px");
    await expect(page.locator(".prose .lead")).toHaveCount(1);
  });

  test("a case study's opening paragraph is not a lead", async ({ page }) => {
    await page.goto("/projects/market-ticker");
    await expect(page.locator(".prose .lead")).toHaveCount(0);
  });

  test("a project post: the case-study card, same-project posts first, then previous and next", async ({ page }) => {
    await page.goto("/blog/rsc-and-seo");
    await expect(footer(page).getByRole("link", { name: "Portfolio Platform" })).toHaveAttribute("href", "/projects/portfolio-platform");
    await expect(footer(page).getByText("From the case study")).toBeVisible();
    // Same project, newest first: the other two Portfolio Platform posts; then topped up by tags.
    const related = footer(page).getByRole("region", { name: /More from Portfolio Platform|Related posts/ });
    const titles = await related.getByRole("link").allTextContents();
    expect(titles[0]).toContain("Four products, three rendering strategies");
    expect(titles[1]).toContain("Keyless deploys");
    expect(titles.length).toBeLessThanOrEqual(3);
    expect(titles.join(" ")).not.toContain("One fetch away from dynamic");
    // By date across all posts: 1 Sep sits between 29 Aug and 2 Sep.
    const pn = footer(page).getByRole("navigation", { name: "Previous and next post" });
    await expect(pn.getByRole("link").first()).toContainText("The canvas can't read your CSS");
    await expect(pn.getByRole("link").last()).toContainText("Four products, three rendering strategies");
  });

  test("a standalone post has no case-study card, and its related list is topped up by tags", async ({ page }) => {
    await page.goto("/blog/cache-invalidation");
    await expect(footer(page).getByText("From the case study")).toHaveCount(0);
    await expect(footer(page).getByRole("heading", { name: "Related posts" })).toBeVisible();
    await expect(footer(page).getByRole("heading", { name: /^More from/ })).toHaveCount(0);
  });

  test("the newest post has no Next, the oldest no Previous", async ({ page }) => {
    await page.goto("/blog/rendering-strategies-in-context");
    const pn = footer(page).getByRole("navigation", { name: "Previous and next post" });
    await expect(pn.getByRole("link")).toHaveCount(1);
    await expect(pn).toContainText("← Previous");
    await expect(pn).not.toContainText("Next →");
    await page.goto("/blog/cms-parse-engine");
    const first = footer(page).getByRole("navigation", { name: "Previous and next post" });
    await expect(first.getByRole("link")).toHaveCount(1);
    await expect(first).toContainText("Next →");
    await expect(first).not.toContainText("← Previous");
  });

  test("a post never lists itself", async ({ page }) => {
    await page.goto("/blog/redis-leader-lease");
    const own = await page.getByRole("heading", { level: 1 }).textContent();
    expect(await footer(page).getByRole("link").allTextContents()).not.toContain(own);
  });

  test("the rail shows and the disclosure does not", async ({ page }) => {
    await page.goto("/blog/rsc-and-seo");
    await expect(page.locator("nav[aria-label='On this page']")).toBeVisible();
    await expect(page.locator("details", { hasText: "On this page" })).toBeHidden();
  });

  test("no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/blog/rsc-and-seo");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a closed disclosure whose links reach the headings, with no rail", async ({ page }) => {
    await page.goto("/blog/rsc-and-seo");
    await expect(page.locator("nav[aria-label='On this page']")).toBeHidden();
    const disclosure = page.locator("details", { hasText: "On this page" });
    await expect(disclosure).toBeVisible();
    await expect(disclosure).not.toHaveAttribute("open", "");
    await disclosure.getByText("On this page").click();
    const links = disclosure.getByRole("link");
    await expect(links.first()).toBeVisible();
    const href = await links.first().getAttribute("href");
    await links.first().click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test("the footer stacks, nothing overflows, and there are no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/blog/rsc-and-seo");
    const pn = footer(page).getByRole("navigation", { name: "Previous and next post" });
    const [a, b] = await pn.getByRole("link").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().y));
    expect(b).toBeGreaterThan(a);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
