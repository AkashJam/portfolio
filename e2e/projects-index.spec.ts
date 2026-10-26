import { expect, test, type Page } from "@playwright/test";

// Phase 20 step 3: /projects is an index with a preview (phase18.md I20, I21): server-rendered,
// every row the link, "See it live" its own, the preview hidden from screen readers, no filters
// or search. Needs no ticker.

const TITLES = ["Market (Ticker)", "Internal Admin Tool", "Microlearning", "Portfolio Platform"];
const rows = (page: Page) => page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 2 }) });

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("every project is a link in the server HTML, in order, with no script", async ({ request }) => {
    const html = await (await request.get("/projects")).text();
    const hrefs = [...html.matchAll(/<h2[^>]*>\s*<a[^>]*href="(\/projects\/[a-z-]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual([
      "/projects/market-ticker",
      "/projects/internal-admin-tool",
      "/projects/microlearning",
      "/projects/portfolio-platform",
    ]);
  });

  test("rows in the shared order, each with its tagline, role, year and status", async ({ page }) => {
    await page.goto("/projects");
    await expect(rows(page).getByRole("heading", { level: 2 })).toHaveText(TITLES);
    await expect(rows(page).first()).toContainText("Live market data, streamed end to end on one small AWS box.");
    await expect(rows(page).first()).toContainText("2026");
    await expect(rows(page).first()).toContainText("Live");
  });

  test("the whole row is the link, and \"See it live\" is its own", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("link", { name: /See it live/ })).toHaveCount(1);
    await expect(rows(page).first().getByRole("link", { name: /See it live/ })).toHaveAttribute("href", "/market");
    // Clicking the row's role text (nowhere near the title) opens the case study.
    await rows(page).nth(1).getByText("Full-Stack Engineer").click({ force: true });
    await expect(page).toHaveURL(/\/projects\/internal-admin-tool$/);
  });

  test("no search box and no filter chips", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByPlaceholder(/search/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^(Go|Redis|Vue|Next\.js)$/ })).toHaveCount(0);
  });

  test("the preview follows the hovered row and starts on the first project's", async ({ page }) => {
    await page.goto("/projects");
    const shown = async () => {
      const all = page.locator(".proj-pv");
      const visible: number[] = [];
      for (let i = 0; i < (await all.count()); i++) if (await all.nth(i).isVisible()) visible.push(i);
      return visible;
    };
    expect(await shown()).toEqual([0]);
    await rows(page).nth(2).hover();
    expect(await shown()).toEqual([2]);
    await page.mouse.move(0, 0);
    await rows(page).nth(1).getByRole("link", { name: "Internal Admin Tool" }).focus();
    expect(await shown()).toEqual([1]);
  });

  test("the preview is hidden from screen readers and every fact is in the row", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator(".proj-preview")).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("img")).toHaveCount(0);
    await expect(rows(page).nth(1)).toContainText("Full-Stack Engineer");
    await expect(rows(page).nth(1)).toContainText("Backend · Platform");
  });

  test("the status column is present at 1440", async ({ page }) => {
    await page.goto("/projects");
    await expect(rows(page).first().getByText("● Live")).toBeVisible();
  });
});

test("the status column goes below 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/projects");
  await expect(rows(page).first().getByText("● Live")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1000);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the preview is gone and each row carries its picture above its title", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator(".proj-preview")).toBeHidden();
    const first = rows(page).first();
    const picture = await first.locator("figure").boundingBox();
    const title = await first.getByRole("heading", { level: 2 }).boundingBox();
    expect(picture!.y + picture!.height).toBeLessThanOrEqual(title!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
