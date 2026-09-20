import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// §21 "Accessibility" tier — WCAG 2.1 AA on key pages; regressions fail
// the build. /market/SIM:NOVA is included since it's the one page with
// live-updating content (charts, SSE badges) that static analysis can't
// catch accessibility regressions in. The case study, blog post, and 404
// were added in Phase 6 step 5 — real rendered pages, previously unscanned.
const PAGES = [
  "/",
  "/about",
  "/market",
  "/market/SIM:NOVA",
  "/projects",
  "/projects/market-ticker",
  "/blog",
  "/blog/rendering-strategies-in-context",
  "/this-page-does-not-exist",
];

for (const path of PAGES) {
  test(`${path} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
