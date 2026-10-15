import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 14 step 6: the three-state indicator on the Market tab and in the drawer's
// Market row (bearing.md #94, #104). The nav asks /api/market-state once a minute,
// so each state is shown by stubbing that route; one run is unstubbed, against the
// simulator, whose ticks never stop. "Tripped" cannot occur until Phase 15 switches
// the trigger on, so a stub is the only way to see it, and it proves the rendering
// is built.

type Stub = { feed: string; tripped: boolean; session?: string; opensAt?: string | null } | "fail";

async function stub(page: Page, body: Stub) {
  await page.route("**/api/market-state", (route) =>
    // The real route always sends a session; these tests are about the dot, so
    // the session is open unless a case says otherwise.
    body === "fail" ? route.abort() : route.fulfill({ json: { session: "open", opensAt: null, ...body } }),
  );
}

const dot = (page: Page) => page.locator('header a[href="/market"] [data-market-state]');

// Computed styles read back from the browser, so the test sees what the reader sees.
async function paint(page: Page) {
  return dot(page).evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, border: cs.borderTopWidth, borderColor: cs.borderTopColor };
  });
}

const TRANSPARENT = "rgba(0, 0, 0, 0)";

// The ring is drawn 1.5px wide; a browser at one device pixel per CSS pixel
// computes that as 1px. What matters is that there is a ring at all.
const hasRing = (width: string) => parseFloat(width) >= 1;

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("quiet and live: a hollow ring, named for a screen reader", async ({ page }) => {
    await stub(page, { feed: "live", tripped: false });
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "quiet");
    await expect(dot(page)).toHaveAttribute("data-market-live", "true");
    await expect(dot(page)).toHaveAttribute("aria-label", "quiet, live");
    const p = await paint(page);
    expect(p.bg).toBe(TRANSPARENT);
    expect(hasRing(p.border)).toBe(true);
  });

  test("closed is quiet and not live: the same hollow ring", async ({ page }) => {
    await stub(page, { feed: "closed", tripped: false });
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "quiet");
    await expect(dot(page)).toHaveAttribute("data-market-live", "false");
    await expect(dot(page)).toHaveAttribute("aria-label", "quiet");
  });

  test("tripped: a solid dot, not the market-down colour", async ({ page }) => {
    await stub(page, { feed: "live", tripped: true });
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "tripped");
    await expect(dot(page)).toHaveAttribute("aria-label", "a sensor tripped, live");
    const p = await paint(page);
    expect(p.bg).not.toBe(TRANSPARENT);
    expect(p.border).toBe("0px");
    // Down is red (#ef5350); a trip can be a rise, so the dot must never read as it.
    expect(p.bg).not.toBe("rgb(239, 83, 80)");
  });

  for (const feed of ["stale", "down"]) {
    test(`a ${feed} feed is unreachable: an amber ring`, async ({ page }) => {
      await stub(page, { feed, tripped: false });
      await page.goto("/about");
      await expect(dot(page)).toHaveAttribute("data-market-state", "unreachable");
      await expect(dot(page)).toHaveAttribute("aria-label", "unreachable");
      const p = await paint(page);
      expect(p.bg).toBe(TRANSPARENT);
      expect(hasRing(p.border)).toBe(true);
      expect(p.borderColor).toBe("rgb(224, 168, 58)"); // --stale
    });
  }

  test("a failed request is unreachable, not left on the last answer", async ({ page }) => {
    await stub(page, "fail");
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "unreachable");
  });

  test("unreachable outranks tripped", async ({ page }) => {
    await stub(page, { feed: "stale", tripped: true });
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "unreachable");
  });

  test("only the Market tab carries the dot", async ({ page }) => {
    await stub(page, { feed: "live", tripped: false });
    await page.goto("/about");
    await expect(page.locator("header [data-market-state]")).toHaveCount(1);
    await expect(page.locator('header a[href="/atlas"] [data-market-state]')).toHaveCount(0);
  });

  test("against the simulator, whose ticks never stop, it reads quiet and live", async ({ page }) => {
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "quiet");
    await expect(dot(page)).toHaveAttribute("data-market-live", "true");
  });

  test("the nav on a static page asks again when the tab comes back", async ({ page }) => {
    // A variable, not a call count: in development React runs effects twice, so
    // the page's first load asks twice.
    let feed = "live";
    await page.route("**/api/market-state", (route) => route.fulfill({ json: { feed, tripped: false, session: "open", opensAt: null } }));
    await page.goto("/about");
    await expect(dot(page)).toHaveAttribute("data-market-state", "quiet");
    feed = "stale";
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(dot(page)).toHaveAttribute("data-market-state", "unreachable");
  });

  test("has no WCAG 2.1 AA violations in the unreachable and tripped states", async ({ page }) => {
    for (const body of [{ feed: "stale", tripped: false }, { feed: "live", tripped: true }]) {
      await stub(page, body);
      await page.goto("/about");
      await expect(dot(page)).not.toHaveAttribute("data-market-state", "unknown");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      await page.unroute("**/api/market-state");
    }
  });
});

test.describe("at 390px, in the drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const cases: [string, Stub, string][] = [
    ["quiet and live", { feed: "live", tripped: false }, "quiet · live"],
    ["closed", { feed: "closed", tripped: false }, "quiet"],
    ["tripped", { feed: "live", tripped: true }, "a sensor tripped · live"],
    ["stale", { feed: "stale", tripped: false }, "unreachable"],
    ["unreachable beats tripped", { feed: "down", tripped: true }, "unreachable"],
    ["a failed request", "fail", "unreachable"],
  ];

  for (const [name, body, text] of cases) {
    test(`the Market row says "${text}" for ${name}, where the other rows show their route`, async ({ page }) => {
      await stub(page, body);
      await page.goto("/about");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByTestId("drawer-market-state")).toHaveText(text);
      await expect(page.getByRole("dialog").getByRole("link", { name: /^Atlas/ })).toContainText("/atlas");
    });
  }

  test("has no WCAG 2.1 AA violations with the drawer open, tripped and unreachable", async ({ page }) => {
    // /atlas, as atlas-nav.spec.ts does: on a short page like /about the footer sits
    // in the viewport behind the scrim, and its dimmed muted text is what axe reads.
    for (const body of [{ feed: "live", tripped: true }, { feed: "stale", tripped: false }]) {
      await stub(page, body);
      await page.goto("/atlas");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByTestId("drawer-market-state")).toBeVisible();
      // The sheet fades and slides in; axe reads the colours mid-fade unless it waits.
      await page.getByRole("dialog").evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      await page.unroute("**/api/market-state");
    }
  });
});
