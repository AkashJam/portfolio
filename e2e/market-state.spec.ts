import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Phase 19 step 3, I12: the Market tab's dot appears only after a trip at the last
// close, and the drawer's Market row says "N unusual moves" then and shows its route
// otherwise (it supersedes the three-state indicator of bearing.md #94, #104). The nav
// asks /api/market-state once a minute, so each state is shown by stubbing that route;
// one run is unstubbed, against the simulator, which never trips.

type Stub = { feed: string; tripped: boolean; trips?: number; session?: string; opensAt?: string | null } | "fail";

async function stub(page: Page, body: Stub) {
  await page.route("**/api/market-state", (route) =>
    // The real route always sends a session; these tests are about the dot, so
    // the session is open unless a case says otherwise.
    body === "fail" ? route.abort() : route.fulfill({ json: { session: "open", opensAt: null, ...body } }),
  );
}

// The slot is always in the tab (it holds the space); only a trip draws it.
const slot = (page: Page) => page.locator('header a[href="/market"] [data-market-state]');
const shown = (page: Page) => page.locator('header a[href="/market"] [data-dot="shown"]');

const LABEL = "An unusual move at the last close";

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("tripped: a solid indigo dot, named for a screen reader and on hover", async ({ page }) => {
    await stub(page, { feed: "live", tripped: true, trips: 1 });
    await page.goto("/about");
    await expect(shown(page)).toHaveAttribute("aria-label", LABEL);
    await expect(shown(page)).toHaveAttribute("title", LABEL);
    const p = await shown(page).evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, border: cs.borderTopWidth };
    });
    expect(p.bg).toBe("rgb(129, 140, 248)"); // --brand-hover
    expect(p.border).toBe("0px");
    // Down is red (#ef5350); a trip can be a rise, so the dot must never read as it.
    expect(p.bg).not.toBe("rgb(239, 83, 80)");
  });

  for (const [name, body] of [
    ["quiet and live", { feed: "live", tripped: false }],
    ["closed", { feed: "closed", tripped: false }],
    ["a stale feed", { feed: "stale", tripped: false }],
    ["a down feed", { feed: "down", tripped: false }],
    ["unreachable outranking a trip", { feed: "stale", tripped: true, trips: 2 }],
    ["a failed request", "fail"],
  ] as [string, Stub][]) {
    test(`${name}: no dot, and nothing for a screen reader`, async ({ page }) => {
      await stub(page, body);
      await page.goto("/about");
      await expect(slot(page)).toHaveAttribute("data-dot", "hidden");
      await expect(shown(page)).toHaveCount(0);
      await expect(page.locator('header a[href="/market"] [role="img"]')).toHaveCount(0);
      await expect(slot(page)).toHaveAttribute("aria-hidden", "true");
    });
  }

  test("only the Market tab has the slot", async ({ page }) => {
    await stub(page, { feed: "live", tripped: true, trips: 1 });
    await page.goto("/about");
    await expect(page.locator("header [data-market-state]")).toHaveCount(1);
    await expect(page.locator('header a[href="/atlas"] [data-market-state]')).toHaveCount(0);
  });

  test("the tab after Market does not move when a trip arrives", async ({ page }) => {
    await stub(page, { feed: "live", tripped: false });
    await page.goto("/about");
    const atlas = page.locator('header a[href="/atlas"]');
    const before = await atlas.boundingBox();
    await page.unroute("**/api/market-state");
    await stub(page, { feed: "live", tripped: true, trips: 1 });
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(shown(page)).toHaveCount(1);
    expect((await atlas.boundingBox())?.x).toBe(before?.x);
  });

  test("against the simulator, which never trips, there is no dot", async ({ page }) => {
    await page.goto("/about");
    await expect(slot(page)).toHaveAttribute("data-dot", "hidden");
  });

  test("the nav on a static page asks again when the tab comes back", async ({ page }) => {
    // A variable, not a call count: in development React runs effects twice, so
    // the page's first load asks twice.
    let tripped = false;
    await page.route("**/api/market-state", (route) =>
      route.fulfill({ json: { feed: "live", tripped, trips: tripped ? 1 : 0, session: "open", opensAt: null } }),
    );
    await page.goto("/about");
    await expect(slot(page)).toHaveAttribute("data-dot", "hidden");
    tripped = true;
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(shown(page)).toHaveCount(1);
  });

  test("has no WCAG 2.1 AA violations quiet and tripped", async ({ page }) => {
    for (const body of [{ feed: "live", tripped: false }, { feed: "live", tripped: true, trips: 1 }]) {
      await stub(page, body);
      await page.goto("/about");
      await expect(slot(page)).not.toHaveAttribute("data-market-state", "unknown");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      await page.unroute("**/api/market-state");
    }
  });
});

test.describe("at 390px, in the drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const market = (page: Page) => page.getByRole("dialog").getByRole("link", { name: /^Market/ });

  const unusual: [string, Stub, string][] = [
    ["one trip", { feed: "live", tripped: true, trips: 1 }, "1 unusual move"],
    ["three trips", { feed: "closed", tripped: true, trips: 3 }, "3 unusual moves"],
    ["a trip from a ticker that sends no count", { feed: "live", tripped: true }, "1 unusual move"],
  ];
  for (const [name, body, text] of unusual) {
    test(`the Market row says "${text}" for ${name}`, async ({ page }) => {
      await stub(page, body);
      await page.goto("/about");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByTestId("drawer-market-state")).toHaveText(text);
    });
  }

  const quiet: [string, Stub][] = [
    ["quiet and live", { feed: "live", tripped: false }],
    ["closed", { feed: "closed", tripped: false }],
    ["stale", { feed: "stale", tripped: false }],
    ["unreachable beating a trip", { feed: "down", tripped: true, trips: 2 }],
    ["a failed request", "fail"],
  ];
  for (const [name, body] of quiet) {
    test(`the Market row shows its route for ${name}, like the other rows`, async ({ page }) => {
      await stub(page, body);
      await page.goto("/about");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(market(page)).toContainText("/market");
      await expect(page.getByTestId("drawer-market-state")).toHaveCount(0);
      await expect(page.getByRole("dialog").getByRole("link", { name: /^Atlas/ })).toContainText("/atlas");
    });
  }

  test("has no WCAG 2.1 AA violations with the drawer open, tripped and quiet", async ({ page }) => {
    // /atlas, as atlas-nav.spec.ts does: on a short page like /about the footer sits
    // in the viewport behind the scrim, and its dimmed muted text is what axe reads.
    for (const body of [{ feed: "live", tripped: true, trips: 2 }, { feed: "live", tripped: false }]) {
      await stub(page, body);
      await page.goto("/atlas");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(market(page)).toBeVisible();
      // The sheet fades and slides in; axe reads the colours mid-fade unless it waits.
      await page.getByRole("dialog").evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      await page.unroute("**/api/market-state");
    }
  });
});
