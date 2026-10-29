import type { Page } from "@playwright/test";

/** Waits until React has hydrated /atlas: the view tabs mark themselves ready once they have read the address. */
export async function atlasHydrated(page: Page) {
  await page.waitForSelector('[role=tablist][aria-label="Atlas views"][data-ready]');
}

/**
 * Opens /atlas on a view and waits until it has hydrated. A control driven before
 * that point is reset by hydration (a <select> falls back to its default), which
 * made the specs that change an axis flaky under load. The default view is Compare.
 */
export async function gotoAtlas(page: Page, view: "compare" | "map" | "countries" = "compare") {
  await page.goto(view === "compare" ? "/atlas" : `/atlas?view=${view}`);
  await atlasHydrated(page);
}
