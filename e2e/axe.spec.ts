import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// §21 "Accessibility" tier — WCAG 2.1 AA on key pages; regressions fail
// the build. /market/SIM:NOVA is included since it's the one page with
// live-updating content (charts, SSE badges) that static analysis can't
// catch accessibility regressions in.
const PAGES = ["/", "/about", "/market", "/market/SIM:NOVA", "/projects", "/blog"];

for (const path of PAGES) {
  test(`${path} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
