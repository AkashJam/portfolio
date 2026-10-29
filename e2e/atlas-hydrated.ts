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

/** Opens "Build your own comparison" (closed by default, phase18.md I50) so its axes and window can be driven. */
export async function openBuild(page: Page) {
  const details = page.locator("#compare details");
  if (!(await details.evaluate((e) => (e as HTMLDetailsElement).open))) {
    await details.locator("summary").click();
  }
}

/** The desktop drawing of the scatter; the phone drawing is a second SVG in the same markup, hidden by CSS. */
export const desktopScatter = (page: Page) => page.locator("svg[data-drawing=desktop]");

/** Opens the Countries table's extra columns ("More columns", phase18.md I56). */
export async function openMoreColumns(page: Page) {
  const toggle = page.getByRole("button", { name: /More columns/ });
  if (await toggle.count()) await toggle.click();
}

/** Opens the Map's "Change measure or period" menu (closed by default, phase18.md I58). */
export async function openMapMenu(page: Page) {
  const details = page.locator("#map details");
  if (!(await details.evaluate((e) => (e as HTMLDetailsElement).open))) {
    await details.locator("summary").click();
  }
}
