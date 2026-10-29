import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { siteUrl } from "./ports";

// Phase 16 step 2: a sensor's record, against the tripped fixture ticker (phase17.md step 5).
// Japan's record holds the one event `ticker fixture` recorded for it on 8 October; NVDA,
// which the fixture never picks, is the record with no events.

async function axe(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("tripped, at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 }, baseURL: siteUrl("tripped") });

  test("Japan's record names the sensor, draws both lines and marks the trip", async ({ page }) => {
    await page.goto("/market/japan");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Market / Japan");
    await expect(page.getByText("through MUFG · Mitsubishi UFJ")).toBeVisible();
    await expect(page.getByText("benchmark IXG")).toBeVisible();
    const chart = page.getByTestId("record-chart");
    await expect(chart.locator("polyline")).toHaveCount(2); // the sensor and its benchmark
    await expect(chart.getByTestId("record-dot")).toHaveCount(1);
    await expect(chart).toHaveAttribute("aria-label", /at 100 on 1 Jul.*Tripped on 8 Oct/);
    await expect(page.getByTestId("price-link")).toHaveAttribute("href", "/market/japan/price");
  });

  test("both URL forms are one page with one canonical", async ({ page }) => {
    for (const path of ["/market/japan", "/market/MUFG", "/market/mufg"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/market\/japan$/);
    }
  });

  test("the cadence line counts no judged session before the go-live", async ({ page }) => {
    await page.goto("/market/japan");
    // The fixture's event (8 Oct) predates the trigger's go-live (16 Oct), which the
    // backfill ends before, so no session counts as judged. Production cannot reach
    // this: `ticker trigger` refuses to record a session before the go-live
    // (phase17.md step 5). The line is asserted as the page writes it for this state.
    await expect(page.getByTestId("record-cadence")).toHaveText("The trigger has not judged a session yet; it starts from 16 Oct.");
  });

  test("the trip is a ledger row with no band, opened by its fragment", async ({ page }) => {
    await page.goto("/market/japan#japan-2026-10-08");
    const row = page.getByTestId("record-events").getByTestId("ledger-row");
    await expect(row).toHaveCount(1);
    await expect(row).toHaveAttribute("id", "japan-2026-10-08");
    await expect(row).toHaveJSProperty("open", true);
    await expect(row.getByTestId("band-chart")).toHaveCount(0);
    await expect(row.getByTestId("says")).toContainText(/times further than it usually moves against them, so the news from that day was fetched\./);
    await expect(row.getByTestId("record-link")).toHaveCount(0);
  });

  test("the provenance block names every source and the base date", async ({ page }) => {
    await page.goto("/market/japan");
    const block = page.getByTestId("record-provenance");
    for (const key of ["price", "chart", "sigma", "judged", "country", "split", "news"]) {
      await expect(block.locator(`[data-source=${key}]`)).toBeVisible();
    }
    await expect(block.locator("[data-source=chart]")).toContainText("close on 1 Jul");
  });

  test("the ledger entry links to the country's full record", async ({ page }) => {
    await page.goto("/market");
    const link = page.getByTestId("ledger-lead").getByTestId("record-link");
    await expect(link).toHaveText("Japan's full record →");
    await link.click();
    await expect(page).toHaveURL(/\/market\/japan$/);
  });

  test("a global name with no events says nothing has tripped", async ({ page }) => {
    await page.goto("/market/NVDA");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("NVDA");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Market / Semiconductors");
    // The real ticker's bars may end before the trigger's go-live (16 Oct), in which case no session is judged yet.
    await expect(page.getByTestId("record-cadence")).toHaveText(
      /^(Nothing has tripped in the \d+ sessions? judged since 16 Oct\.|The trigger has not judged a session yet; it starts from 16 Oct\.)/,
    );
    await expect(page.getByTestId("record-events")).toHaveCount(0);
  });

  test("a sector fund, a simulator symbol and an unknown name have no record", async ({ page }) => {
    for (const path of ["/market/IXG", "/market/SIM:NOVA", "/market/nowhere"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
  });

  for (const path of ["/market/japan", "/market/NVDA"]) {
    test(`${path} has no WCAG 2.1 AA violations, with the row open`, async ({ page }) => {
      await page.goto(path === "/market/japan" ? `${path}#japan-2026-10-08` : path);
      await axe(page);
    });
  }
});

test.describe("tripped, at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, baseURL: siteUrl("tripped") });

  test("nothing overflows and the page has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market/japan#japan-2026-10-08");
    await expect(page.getByTestId("record-chart")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await axe(page);
  });
});
