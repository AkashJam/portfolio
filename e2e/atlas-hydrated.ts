import type { Page } from "@playwright/test";

/**
 * Opens /atlas and waits until React has hydrated it. The jump bar sets
 * --atlas-jump in an effect, so it is the cheapest proof. A control driven before
 * that point is reset by hydration (a <select> falls back to its default), which
 * made the specs that change an axis flaky under load.
 */
export async function gotoAtlas(page: Page) {
  await page.goto("/atlas");
  await page.waitForFunction(
    () =>
      document.documentElement.style.getPropertyValue("--atlas-jump") !== "",
  );
}
