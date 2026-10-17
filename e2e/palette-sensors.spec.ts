import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 14 step 2: the ⌘K palette's Sensors group replaces the old Symbols group.
// Its eighteen entries come from the ticker's GET /sensors, in the ticker's fixed
// order, labelled by country and company or by theme, with the route on the right.
// Needs the ticker; /sensors does not depend on which symbols are tracked, so it
// answers the same against the simulator in dev and CI as against the real feed.

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

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("palette Sensors group", () => {
  test("lists the eighteen sensors, none simulated and none cost of living", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    const group = page.getByRole("group", { name: "Sensors" });
    await expect(group.getByRole("option")).toHaveCount(18);
    await expect(group.getByRole("option").first()).toContainText("RY");
    await expect(group.getByRole("option").last()).toContainText("CAT");

    const text = (await page.getByRole("dialog").innerText()).toLowerCase();
    expect(text).not.toContain("sim:");
    expect(text).not.toContain("cost of living");
  });

  test("labels a country sensor by country and company, and a global one by its theme", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    const group = page.getByRole("group", { name: "Sensors" });
    await expect(group.getByRole("option", { name: /MUFG/ })).toContainText("Japan · Mitsubishi UFJ");
    await expect(group.getByRole("option", { name: /MUFG/ })).toContainText("/market/japan");
    await expect(group.getByRole("option", { name: /NVDA/ })).toContainText("Semiconductors");
  });

  test("typing a country finds its sensor, and Enter opens the sensor's own page", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await page.getByPlaceholder("Search pages, sensors, actions…").fill("japan");
    await expect(page.getByRole("option", { name: /MUFG/ })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/market\/japan$/);
  });

  test("has no WCAG 2.1 AA violations with the Sensors group showing", async ({ page }) => {
    await page.goto("/about");
    await openPalette(page);
    await expect(page.getByRole("group", { name: "Sensors" }).getByRole("option")).toHaveCount(18);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
