import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 11 step 8: navigation. The top bar, drawer, footer and palette all read
// one list (lib/nav.ts); /atlas gets a jump bar and row highlighting on arrival.
// Needs the ticker for /atlas.

// ⌘K before React has attached its listener does nothing. If the first press did
// not open the palette, press once more rather than assert on a missed keystroke.
async function openPalette(page: Page) {
  await page.keyboard.press("Control+k");
  try {
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1500 });
  } catch {
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toBeVisible();
  }
}

const SIX = ["Home", "Projects", "Blog", "About", "Market", "Atlas"];
// The jump bar sets --atlas-jump once its scroll listener is attached, so waiting
// for it avoids scrolling before hydration (the first scroll would be missed).
const hydrated = (page: Page) =>
  page.waitForFunction(
    () =>
      document.documentElement.style.getPropertyValue("--atlas-jump") !== "",
  );
const jump = (page: Page) =>
  page.getByRole("navigation", { name: "On this page" });

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the top bar reads Home, Projects, Blog, About, a divider, then Market and Atlas", async ({
    page,
  }) => {
    await page.goto("/about");
    const parts = await page
      .getByRole("navigation", { name: "Primary" })
      // The nav's own children: the Market tab holds an invisible dot slot (a span[aria-hidden]) too.
      .locator(":scope > a, :scope > span[aria-hidden]")
      .evaluateAll((els) =>
        els.map((e) => (e.tagName === "A" ? e.textContent?.trim() : "|")),
      );
    expect(parts).toEqual([
      "Home",
      "Projects",
      "Blog",
      "About",
      "|",
      "Market",
      "Atlas",
    ]);
  });

  test("the right-side market icon is gone; the Market tab carries the one state dot and Atlas none", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page.getByRole("link", { name: "Live markets" })).toHaveCount(
      0,
    );
    await expect(page.locator('header a[href="/market"]')).toHaveCount(1);
    // The state indicator is a dot (market-state.spec.ts), never an icon or a pulse.
    await expect(
      page.locator(
        'header a[href="/market"] svg, header a[href="/market"] [class*="animate-pulse"]',
      ),
    ).toHaveCount(0);
    await expect(
      page.locator('header a[href="/market"] [data-market-state]'),
    ).toHaveCount(1);
    await expect(
      page.locator('header a[href="/atlas"] [data-market-state]'),
    ).toHaveCount(0);
  });

  test("Atlas is the current page on /atlas and reachable from the top bar", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await expect(
      page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Atlas" }),
    ).toHaveAttribute("aria-current", "page");
    await page.goto("/about");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Atlas" })
      .click();
    await expect(page).toHaveURL(/\/atlas$/);
  });

  test("the footer reads the same list", async ({ page }) => {
    await page.goto("/about");
    const links = await page
      .getByRole("navigation", { name: "Footer" })
      .getByRole("link")
      .allTextContents();
    expect(links).toEqual(SIX);
  });

  test("⌘K lists Atlas and Atlas · map with icons and route hints, in the list's order", async ({
    page,
  }) => {
    await page.goto("/about");
    await openPalette(page);
    const items = page.getByRole("dialog").getByRole("option");
    await expect(items.filter({ hasText: "/atlas#map" })).toHaveCount(1);
    const pages = await items.allInnerTexts();
    expect(pages.slice(0, 7).map((t) => t.replace(/\s+/g, " ").trim())).toEqual(
      [
        "Home /",
        "Projects /projects",
        "Blog /blog",
        "About /about",
        "Market /market",
        "Atlas /atlas",
        "Atlas · map /atlas#map",
      ],
    );
    await expect(items.first().locator("svg").first()).toBeVisible();
  });

  test("Atlas · map from the palette lands on the map section, clear of the bars", async ({
    page,
  }) => {
    await page.goto("/about");
    await openPalette(page);
    await page.getByRole("option", { name: /Atlas · map/ }).click();
    await expect(page).toHaveURL(/\/atlas#map$/);
    await expect(page.locator("#map")).toBeInViewport();
    await expect
      .poll(async () => (await page.locator("#map").boundingBox())?.y ?? 0)
      .toBeGreaterThanOrEqual(90);
  });

  test("the jump bar links the three sections and marks the one in view", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await hydrated(page);
    const links = jump(page).getByRole("link");
    await expect(links).toHaveText(["Compare", "Map", "Countries"]);
    await expect(links.nth(0)).toHaveAttribute("href", "#compare");
    await expect(links.nth(1)).toHaveAttribute("href", "#map");
    await expect(links.nth(2)).toHaveAttribute("href", "#countries");
    await expect(links.nth(0)).toHaveAttribute("aria-current", "location");
    await links.nth(2).click();
    await expect(page).toHaveURL(/#countries$/);
    await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
    await expect(links.nth(0)).not.toHaveAttribute("aria-current", "location");
  });

  test("the jump bar stays on screen while scrolling, up or down, on a desktop", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await hydrated(page);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(300);
    await expect(jump(page)).toBeInViewport();
    await expect(jump(page)).not.toHaveAttribute("inert", "");
    expect(await jump(page).evaluate((e) => getComputedStyle(e).position)).toBe(
      "sticky",
    );
  });

  test("a section anchor lands clear of the top bar and the jump bar", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await hydrated(page);
    await jump(page).getByRole("link", { name: "Map" }).click();
    await expect
      .poll(async () => (await page.locator("#map").boundingBox())?.y ?? 0)
      .toBeGreaterThanOrEqual(90);
    await expect
      .poll(async () => (await page.locator("#map").boundingBox())?.y ?? 999)
      .toBeLessThan(200);
  });

  test("/atlas#japan highlights Tokyo's row and rings its dot together, and a hash change moves both", async ({
    page,
  }) => {
    await page.goto("/atlas#japan");
    await expect(page.locator("tr#japan")).toHaveAttribute(
      "data-target",
      "true",
    );
    await expect(page.locator('g[data-slug="japan"]')).toHaveAttribute(
      "data-target",
      "true",
    );
    await expect(page.locator("tr#japan")).toBeInViewport();
    expect(
      (await page.locator("tr#japan").boundingBox())!.y,
    ).toBeGreaterThanOrEqual(90);
    await page.evaluate(() => {
      window.location.hash = "#italy";
    });
    await expect(page.locator("tr#italy")).toHaveAttribute(
      "data-target",
      "true",
    );
    await expect(page.locator('g[data-slug="italy"]')).toHaveAttribute(
      "data-target",
      "true",
    );
    await expect(page.locator("tr[data-target]")).toHaveCount(1);
  });

  test("a map link highlights its row", async ({ page }) => {
    await page.goto("/atlas");
    await page.getByRole("link", { name: /^Japan: / }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("tr#japan")).toHaveAttribute(
      "data-target",
      "true",
    );
  });

  test("/atlas is in the sitemap", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(await res.text()).toContain("/atlas</loc>");
  });

  // The sitemap regenerates in the background (ISR), and CI builds without a
  // ticker, so the first request can be the build-time copy: ask until the
  // regenerated one arrives (phase18.md step 3, M25).
  test("the sitemap lists a city page and a sensor's record", async ({ request }) => {
    await expect
      .poll(async () => (await (await request.get("/sitemap.xml")).text()).match(/\/atlas\/japan<|\/market\/japan</g)?.length ?? 0, {
        timeout: 30_000,
      })
      .toBe(2);
  });

  test("has no WCAG 2.1 AA violations with the palette open", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await openPalette(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the jump bar hides on scroll down and returns on any scroll up", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await hydrated(page);
    await expect(jump(page)).not.toHaveAttribute("inert", "");
    await page.mouse.wheel(0, 900);
    await expect(jump(page)).toHaveAttribute("inert", "");
    await page.mouse.wheel(0, -120);
    await expect(jump(page)).not.toHaveAttribute("inert", "");
  });

  test("with reduced motion the jump bar does not slide", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/atlas");
    expect(
      await jump(page).evaluate((e) => getComputedStyle(e).transitionDuration),
    ).toBe("0s");
  });

  test("the drawer lists the same six with route hints, grouped between dividers, then Résumé and the social links", async ({
    page,
  }) => {
    // The Market row shows its route unless the last close tripped something; pin a
    // quiet day so the list is the same on every run (market-state.spec.ts covers each state).
    await page.route("**/api/market-state", (route) =>
      route.fulfill({ json: { feed: "closed", tripped: false } }),
    );
    await page.goto("/about");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page
      .getByRole("dialog")
      .getByRole("navigation", { name: "Menu" });
    const rows = (await menu.getByRole("link").allInnerTexts()).map((t) =>
      t.replace(/\s+/g, " ").trim(),
    );
    expect(rows).toEqual([
      "Home /",
      "Projects /projects",
      "Blog /blog",
      "About /about",
      "Market /market",
      "Atlas /atlas",
      "Résumé",
    ]);
    await expect(menu.locator('[aria-hidden="true"].h-px')).toHaveCount(2);
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "GitHub" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .locator('a[href="/market"] [class*="animate-pulse"]'),
    ).toHaveCount(0);
    await expect(
      page.getByRole("dialog").getByText("live", { exact: true }),
    ).toHaveCount(0);
  });

  test("Atlas from the drawer opens /atlas and closes the drawer", async ({
    page,
  }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: /^Atlas/ })
      .click();
    await expect(page).toHaveURL(/\/atlas$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("has no WCAG 2.1 AA violations with the drawer open", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});
