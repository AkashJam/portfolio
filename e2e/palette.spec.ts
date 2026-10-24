import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 19 step 4 (M24, I38): the ⌘K palette's one index. Fetched the first time the
// palette opens, it holds the four case studies and the posts (their tags are search
// keywords), the eighteen companies (the ticker's sensors) and the cities with a page.
// The empty state shows Pages, Projects and Actions and a counted hint; posts, companies
// and cities appear once there is a query. Needs the ticker; /sensors is a fixed list
// that answers the same against the simulator in dev and CI as against the real feed.

// ⌘K before React has attached its listener does nothing: press again rather
// than assert on a missed keystroke (same as atlas-nav.spec.ts).
async function openPalette(page: Page) {
  await page.keyboard.press("Control+k");
  try {
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1500 });
  } catch {
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toBeVisible();
  }
}

const search = (page: Page) => page.getByPlaceholder("Search projects, posts, companies, cities…");
const group = (page: Page, name: string) => page.getByRole("group", { name });

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("the empty state", () => {
  test("shows Pages, Projects and Actions, and a hint counted from the index", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await expect(group(page, "Pages")).toBeVisible();
    await expect(group(page, "Projects").getByRole("option")).toHaveCount(4);
    await expect(group(page, "Actions")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText(/Type to search \d+ posts, 18 companies and \d+ cities/);
    for (const hidden of ["Posts", "Companies", "Cities"]) await expect(group(page, hidden)).toHaveCount(0);
  });

  test("has Copy email address with the address under it, and Download résumé with no PDF", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await expect(page.getByRole("option", { name: /Copy email address/ })).toContainText("@");
    await expect(page.getByRole("option", { name: "Download résumé" })).toBeVisible();
    await expect(page.getByRole("dialog")).not.toContainText("PDF");
  });

  test("keeps its title as a name, not a heading, and opens empty each time", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await search(page).fill("redis");
    await page.keyboard.press("Escape");
    await openPalette(page);
    await expect(search(page)).toHaveValue("");
    await expect(page.getByRole("heading", { name: "Command Palette" })).toHaveCount(0);
  });
});

test.describe("searching", () => {
  test('"redis" finds the case study and the posts, and shows the matched tag on the row', async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await search(page).fill("redis");
    await expect(group(page, "Projects").getByRole("option", { name: /Market \(Ticker\)/ })).toBeVisible();
    await expect(group(page, "Posts").getByRole("option").first()).toBeVisible();
    await expect(group(page, "Posts").locator("mark").first()).toHaveText(/redis/i);
    // A group with no match is not drawn.
    await expect(group(page, "Cities")).toHaveCount(0);
  });

  test("a country finds its company and its city; Enter opens the company's own page", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await search(page).fill("japan");
    const mufg = group(page, "Companies").getByRole("option", { name: /MUFG/ });
    await expect(mufg).toContainText("Japan · Mitsubishi UFJ");
    await expect(mufg).toContainText("/market/japan");
    await expect(group(page, "Cities").getByRole("option", { name: /Tokyo/ })).toContainText("/atlas/japan");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/market\/japan$/);
  });

  test("a global company is found by its theme", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await search(page).fill("semiconductors");
    await expect(group(page, "Companies").getByRole("option", { name: /NVDA/ })).toContainText("Semiconductors");
  });

  test("lists the eighteen companies, none simulated and none cost of living", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    // The empty state hides the companies, so read the index the palette fetched.
    const res = await page.request.get("/api/palette-index");
    const body = await res.json();
    expect(body.companies).toHaveLength(18);
    expect(body.companies[0].label).toBe("RY");
    expect(body.companies.at(-1).label).toBe("CAT");
    const text = JSON.stringify(body).toLowerCase();
    expect(text).not.toContain("sim:");
    expect(text).not.toContain("cost of living");
  });

  test("a post opens on Enter", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await search(page).fill("lease");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/blog\//);
  });
});

test.describe("actions", () => {
  test("Copy email address copies it and says Copied", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/about");
    await openPalette(page);
    await page.getByRole("option", { name: /Copy email address/ }).click();
    await expect(page.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("@");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the route column is hidden", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    const route = page.getByRole("option", { name: /^Projects/ }).locator('[data-slot="command-shortcut"]');
    await expect(route).toBeHidden();
  });
});

test.describe("accessibility", () => {
  test("has no WCAG 2.1 AA violations empty or with a query", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await expect(page.getByRole("dialog")).toContainText("Type to search");
    for (const q of ["", "redis", "japan"]) {
      await search(page).fill(q);
      await page.getByRole("dialog").evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, `query "${q}": ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
    }
  });
});
