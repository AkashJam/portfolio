import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Phase 19 step 5 (M24, revised 2026-10-24): the 404 as one group in one screen: the
// numeral, the h1 and its line, the trace in its own band, then the one button. The 500
// needs a thrown error, so it is looked at by hand rather than here.

const MISSING = "/no-such-page";

test("a missing page is a 404 named for itself, with the message as its h1", async ({ page }) => {
  const res = await page.goto(MISSING);
  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle("Not found — Akash James");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page drifted off the chart.");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
});

test("the numeral is decoration, and Back home is the only action", async ({ page }) => {
  await page.goto(MISSING);
  await expect(page.locator("main [aria-hidden='true']", { hasText: "404" })).toHaveCount(1);
  await expect(page.getByRole("main").getByRole("link", { name: "← Back home" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("main").getByRole("link")).toHaveCount(1);
  // The search hint is gone; the top bar's chip stays.
  await expect(page.getByText(/Press\s+(⌘K|Ctrl K)\s+to search/)).toHaveCount(0);
  await expect(page.locator("header button[aria-haspopup='dialog']").first()).toBeVisible();
});

test("the group fills the screen under the bar and nothing overlaps", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(MISSING);
  const box = async (sel: string) => (await page.locator(sel).first().boundingBox())!;
  const h1 = await box("main h1");
  const trace = await box("main svg");
  const button = await box("main a[href='/']");
  expect(h1.y + h1.height).toBeLessThanOrEqual(trace.y);
  expect(trace.y + trace.height).toBeLessThanOrEqual(button.y);
  // Full width, not boxed.
  expect(trace.width).toBeGreaterThanOrEqual(1400);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the button is full width and 48px tall", async ({ page }) => {
    await page.goto(MISSING);
    const button = (await page.locator("main a[href='/']").boundingBox())!;
    expect(button.width).toBeGreaterThanOrEqual(390 - 2 * 16 - 1);
    expect(button.height).toBeGreaterThanOrEqual(47);
  });
});

test("the trace's run is drawn only when motion is allowed", async ({ page }) => {
  const run = () => page.locator(".error-trace-run").first();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(MISSING);
  expect(await run().evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await run().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
});

test("has no WCAG 2.1 AA violations", async ({ page }) => {
  await page.goto(MISSING);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
