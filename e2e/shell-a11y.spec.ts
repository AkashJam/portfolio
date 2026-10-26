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
  await expect(page).toHaveTitle(/— Akash James$/);
});

test("the drawer marks the current section, as the desktop nav does (I7)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog").getByRole("navigation", { name: "Menu" });
  await expect(menu.locator("[aria-current='page']")).toHaveCount(1);
  await expect(menu.getByRole("link", { name: /^Projects/ })).toHaveAttribute("aria-current", "page");
  await expect(menu.getByRole("link", { name: /^Home/ })).not.toHaveAttribute("aria-current", "page");
});

test("the drawer's role line wraps instead of truncating (I7)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Open menu" }).click();
  const role = page.getByRole("dialog").getByText(/Milan$/);
  const clipped = await role.evaluate((el) => {
    const cs = getComputedStyle(el);
    return cs.textOverflow === "ellipsis" || cs.whiteSpace === "nowrap" || el.scrollWidth > el.clientWidth;
  });
  expect(clipped).toBe(false);
});

test("the search chip names the shortcut for the platform, after hydration (I11)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  const search = page.locator("header button[aria-label='Open command palette'][aria-haspopup='dialog']").first();
  await expect(search).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K");
  await expect(search.locator("kbd")).toHaveText("Ctrl K");
  await expect(search.locator("kbd")).toBeVisible();
});

test("the search chip reads ⌘K on a Mac (I11)", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "platform", { get: () => "MacIntel" }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  await expect(page.locator("header button[aria-haspopup='dialog'] kbd")).toHaveText("⌘K");
});
