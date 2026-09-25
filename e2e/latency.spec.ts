import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// portfolio.md §15 Phase 7 step 6's gate: no unsourced figure on the Market
// Ticker case study, and its tiles degrade to an honest placeholder without
// Prometheus. CI and local builds don't set PROMETHEUS_URL, so this is the
// degraded path — the measured path is checked by hand against a real
// Prometheus (phase7.md step 6).
test("the case study shows placeholders, not estimates, without Prometheus", async ({ page }) => {
  test.skip(!!process.env.PROMETHEUS_URL, "measured path — verified against a real Prometheus instead");
  await page.goto("/projects/market-ticker");

  const section = page.locator("div.not-prose").filter({ hasText: "tick → SSE write · p50" });
  await expect(section).toBeVisible();
  await expect(section.getByText("—")).toHaveCount(4);
  await expect(page.getByTestId("latency-placeholder")).toContainText("unreachable");

  // The figures this step removed must not come back from anywhere on the
  // page — tiles, SVG labels or prose.
  const text = await page.locator("main").innerText();
  for (const stale of ["22 ms", "68 ms", "1,200", "250", "+12 ms", "illustrative"]) {
    expect(text, `stale figure "${stale}"`).not.toContain(stale);
  }

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
