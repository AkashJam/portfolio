import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Guards the `.reveal` scroll animation (app/globals.css) against the bug it
// shipped with: a scroll-linked animation's progress *is* scroll position, so
// content that loads partly on-screen froze partway through an opacity fade
// and failed contrast until the user scrolled (phase7.md, "Reveal contrast
// fix"). axe.spec.ts couldn't see it at its default 1280×720 — the affected
// section sat fully below the fold there, where axe skips invisible content.
// These are the viewports that exposed it.
//
// Home only reproduces with its live band rendered (the band is what pushes
// Work up into the first screen), so this needs the ticker running, like
// live-tick.spec.ts, and asserts the band is there rather than passing
// vacuously without it.
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

for (const path of ["/", "/about"]) {
  for (const viewport of VIEWPORTS) {
    test(`${path} at ${viewport.width}×${viewport.height}: reveal content is fully opaque and AA-clean before any scroll`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      if (path === "/") {
        await expect(page.getByRole("region", { name: "Live market feed" })).toBeVisible();
      }

      const opacities = await page.$$eval(".reveal", (els) => els.map((el) => getComputedStyle(el).opacity));
      expect(opacities.length).toBeGreaterThan(0);
      expect(opacities.every((o) => o === "1"), `opacities: ${opacities.join(", ")}`).toBe(true);

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([]);
    });
  }
}
