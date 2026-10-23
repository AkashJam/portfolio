import { expect, test } from "@playwright/test";

// Phase 18 step 6 (I5, I6, I13, M29): the skip link, the expanded states, the palette's name.

test("the skip link is the first Tab stop and moves focus to the page's main", async ({ page }) => {
  await page.goto("/about");
  await page.keyboard.press("Tab");
  const link = page.getByRole("link", { name: "Skip to content" });
  await expect(link).toBeFocused();
  await expect(link).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("the skip link is hidden until it has focus", async ({ page }) => {
  await page.goto("/about");
  const box = await page.getByRole("link", { name: "Skip to content" }).boundingBox();
  // Visually hidden (sr-only: one pixel), not display: none, so a reader still finds it.
  expect(box === null || box.width <= 1).toBe(true);
});

test("the palette button says it opens a dialog and whether it is open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  const button = page.locator("button[aria-haspopup='dialog']:visible").first();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("the palette is named by the dialog, and is no heading in the page's outline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  // Closed, the title used to sit outside the dialog as an h2 on every page.
  await expect(page.getByRole("heading", { name: "Command Palette" })).toHaveCount(0);
  await page.locator("button[aria-haspopup='dialog']:visible").first().click();
  await expect(page.getByRole("dialog", { name: "Command Palette" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Command Palette" })).toHaveCount(0);
});

test("the menu button says whether the drawer is open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  // By attribute, not role: with the drawer open the page behind it is aria-hidden.
  const menu = page.locator("button[aria-label='Open menu']");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
});

test("the blog is called Blog on its index and its posts", async ({ page }) => {
  await page.goto("/blog");
  await expect(page).toHaveTitle(/^Blog — /);
  await expect(page.getByText("Writing", { exact: true })).toHaveCount(0);
  await page.goto("/blog/cache-invalidation");
  await expect(page.getByRole("link", { name: "Blog", exact: true }).first()).toBeVisible();
  await expect(page).toHaveTitle(/— Blog — Akash James$/);
});
