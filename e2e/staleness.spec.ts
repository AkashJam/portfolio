import { expect, test } from "@playwright/test";

// phase7.md Step 1's gate — "kill the feed; every live
// surface says so within the threshold" — as a permanent test rather than a
// one-off manual check. Needs a running ticker for the pages to render
// their live surfaces at all (same as live-tick.spec.ts), so it runs in
// CI's integration job.
//
// The feed is killed by aborting the same-origin SSE proxy, not the ticker:
// SSR still gets real data, the browser gets no events. Playwright's clock
// then jumps past STALE_AFTER_MS (30s) instead of the test waiting it out.
const SURFACES = [
  { path: "/", name: "home hero" },
  { path: "/market", name: "market board" },
  { path: "/market/SIM:NOVA", name: "symbol page" },
];

for (const { path, name } of SURFACES) {
  test(`${name} (${path}) reports a dead feed`, async ({ page }) => {
    await page.route("**/api/stream*", (route) => route.abort());
    await page.clock.install();
    await page.goto(path);

    // Hydrated and watching, before the clock jumps — otherwise the jump
    // lands before the indicator's own timer exists.
    await expect(page.locator('[data-feed-status="fresh"]')).toBeAttached();
    await page.clock.fastForward(31_000);
    await expect(page.getByTestId("feed-stale")).toBeVisible();
    await expect(page.getByTestId("feed-stale")).toContainText("last tick");
  });

  test(`${name} (${path}) recovers when the feed comes back`, async ({ page }) => {
    await page.route("**/api/stream*", (route) => route.abort());
    await page.clock.install();
    await page.goto(path);
    await expect(page.locator('[data-feed-status="fresh"]')).toBeAttached();
    await page.clock.fastForward(31_000);
    await expect(page.getByTestId("feed-stale")).toBeVisible();

    // Restore the proxy. lib/sse.ts's backoff timer is on the same fake
    // clock, so jump far enough to fire the pending reconnect (backoff caps
    // at 30s); the first real quote after it must clear the pill, no reload.
    await page.unroute("**/api/stream*");
    await page.clock.fastForward(31_000);
    await expect(page.getByTestId("feed-stale")).toHaveCount(0, { timeout: 10_000 });
  });
}
