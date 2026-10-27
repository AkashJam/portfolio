import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 20 step 4: /blog is server-rendered (M10), Featured then Latest, every card the link and
// naming its project, and the search and topic chips only hide posts (I30, I6, I32). Needs no ticker.

const FEATURED = [
  "Five-minute queries behind a sixty-second timeout: unwinding a cache cascade",
  "Rendering content whose shape nobody had decided yet",
  "The retention system we found while moving house",
];
const cards = (page: Page) => page.locator("article[data-post]");
const visibleTitles = async (page: Page) =>
  page.locator("article[data-post]:not([hidden]) h3").allTextContents();

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("every post is a link in the server HTML: 18 headings, Featured first", async ({ request }) => {
    const html = await (await request.get("/blog")).text();
    const hrefs = [...html.matchAll(/<h3[^>]*>\s*<a[^>]*href="(\/blog\/[a-z0-9-]+)"/g)].map((m) => m[1]);
    expect(hrefs).toHaveLength(18);
    expect(new Set(hrefs).size).toBe(18);
    expect(hrefs.slice(0, 3)).toEqual([
      "/blog/cache-invalidation",
      "/blog/cms-parse-engine",
      "/blog/event-driven-retention",
    ]);
  });

  test("Featured is the owner's three in order, Latest is the rest newest first", async ({ page }) => {
    await page.goto("/blog");
    const featured = page.getByRole("region", { name: "Featured" });
    const latest = page.getByRole("region", { name: "Latest" });
    await expect(featured.getByRole("heading", { level: 3 })).toHaveCount(3);
    await expect(latest.getByRole("heading", { level: 3 })).toHaveCount(15);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Featured", "Latest"]);
    const featuredTitles = await featured.getByRole("heading", { level: 3 }).allTextContents();
    expect(featuredTitles.map((t) => t.slice(0, 20))).toEqual(FEATURED.map((t) => t.slice(0, 20)));
    const dates = await latest.locator("p.font-mono").allTextContents();
    const parsed = dates.map((d) => Date.parse(d.split(" · ")[0]));
    expect(parsed).toEqual([...parsed].sort((a, b) => b - a));
  });

  test("a card names its project where it has one, and says nothing where it has none", async ({ page }) => {
    await page.goto("/blog");
    const card = (title: RegExp) => cards(page).filter({ has: page.getByRole("heading", { name: title }) });
    await expect(card(/A box you can.t log into/)).toContainText("Market (Ticker)");
    await expect(card(/Rendering content whose shape/)).toContainText("Microlearning");
    await expect(card(/If your correctness lives in SQL/)).toContainText("Internal Admin Tool");
    await expect(card(/One fetch away from dynamic/)).toContainText("Portfolio Platform");
    // A standalone post: date or topic first, no project.
    await expect(card(/Five-minute queries/)).toHaveText(/Backend and distributed systems · \d+ min/);
    await expect(card(/Five-minute queries/)).not.toContainText("Microlearning");
  });

  test("the whole card is the link", async ({ page }) => {
    await page.goto("/blog");
    await cards(page).nth(4).getByText(/min$/).click({ force: true });
    await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/);
  });

  test("a topic chip hides the other posts without reordering the rest, and is in the address", async ({ page }) => {
    await page.goto("/blog");
    const all = await visibleTitles(page);
    await page.getByRole("button", { name: "Architecture", exact: true }).click();
    await expect(page.getByRole("button", { name: "Architecture", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "false");
    const shown = await visibleTitles(page);
    expect(shown).toHaveLength(4);
    expect(shown).toEqual(all.filter((t) => shown.includes(t)));
    await expect(page).toHaveURL(/\?tag=Architecture$/);
    // Every Featured post is Backend or Frontend: Featured's heading goes with them.
    await expect(page.getByRole("heading", { name: "Featured" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Latest" })).toBeVisible();
  });

  test("search covers title, summary and tags, and survives a reload", async ({ page }) => {
    await page.goto("/blog");
    // Typing before the page hydrates is lost (React resets the box), so retry until it takes.
    await expect(async () => {
      await page.getByRole("searchbox", { name: "Search posts" }).fill("terraform");
      await expect(page).toHaveURL(/\?q=terraform$/, { timeout: 1000 });
    }).toPass();
    await expect.poll(async () => (await visibleTitles(page)).length).toBeGreaterThanOrEqual(2);
    await expect(page.getByText("A box you can't log into")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("searchbox", { name: "Search posts" })).toHaveValue("terraform");
    await expect(page.getByText("Five-minute queries")).toBeHidden();
  });

  test("a copied address reproduces the view, and a topic and a search combine", async ({ page }) => {
    await page.goto("/blog?tag=Infrastructure&q=oidc");
    await expect(page.getByRole("button", { name: "Infrastructure", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await visibleTitles(page)).toHaveLength(1);
  });

  test("no matches shows a message and Clear brings everything back", async ({ page }) => {
    await page.goto("/blog?q=zzzzqqq");
    await expect(page.getByText("No posts match.")).toBeVisible();
    expect(await visibleTitles(page)).toHaveLength(0);
    await page.getByRole("button", { name: "Clear" }).click();
    expect(await visibleTitles(page)).toHaveLength(18);
    await expect(page).toHaveURL(/\/blog$/);
  });

  test("an unknown topic in the address is ignored", async ({ page }) => {
    await page.goto("/blog?tag=Nonsense");
    expect(await visibleTitles(page)).toHaveLength(18);
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("three columns of cards, and no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/blog");
    const xs = await page.getByRole("region", { name: "Latest" }).locator("article").evaluateAll((els) =>
      [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().x)))],
    );
    expect(xs).toHaveLength(3);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});

test("two columns below 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/blog");
  const xs = await page.getByRole("region", { name: "Latest" }).locator("article").evaluateAll((els) =>
    [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().x)))],
  );
  expect(xs).toHaveLength(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1000);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("one column, nothing overflows, and no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/blog");
    const xs = await page.getByRole("region", { name: "Latest" }).locator("article").evaluateAll((els) =>
      [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().x)))],
    );
    expect(xs).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
