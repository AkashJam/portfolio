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

  test("Japan's record names the company, draws both lines with axes and end labels, and marks the trip", async ({ page }) => {
    await page.goto("/market/japan");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Japan");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Market / Japan");
    await expect(page.getByText("through Mitsubishi UFJ (MUFG) · measured against global banks and financial companies (IXG)")).toBeVisible();
    const chart = page.getByTestId("record-chart");
    await expect(chart.locator("polyline")).toHaveCount(2); // the company and its sector
    await expect(chart).toHaveAttribute("aria-label", /both rebased to 100 on 1 Jul.*Unusual moves on 8 Oct/);
    await expect(page.getByTestId("record-dot")).toHaveCount(1);
    await expect(page.getByTestId("record-dot")).toHaveAttribute("data-direction", /^(up|down)$/);
    await expect(page.getByTestId("record-ytick").filter({ hasText: /^100$/ })).toBeVisible();
    await expect(page.getByTestId("record-xtick").first()).toHaveText("Jul");
    await expect(page.getByTestId("record-end-sensor")).toHaveText(/^MUFG \d+\.\d$/);
    await expect(page.getByTestId("record-end-benchmark")).toHaveText(/^IXG \d+\.\d$/);
    // The sector is drawn first, muted and dashed; the company over it, solid.
    await expect(chart.locator("polyline").nth(0)).not.toHaveCSS("stroke-dasharray", "none");
    await expect(chart.locator("polyline").nth(1)).toHaveCSS("stroke-dasharray", "none");
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
    await expect(page.getByTestId("record-cadence")).toHaveText("No session has been checked yet; checking starts from 16 Oct.");
  });

  test("the trip is the lead card in the ledger's design, with no band and no links back out", async ({ page }) => {
    await page.goto("/market/japan#japan-2026-10-08");
    const events = page.getByTestId("record-events");
    const lead = events.getByTestId("ledger-lead");
    await expect(lead).toHaveAttribute("id", "japan-2026-10-08");
    await expect(lead.getByRole("heading", { level: 3 })).toHaveText("8 Oct");
    await expect(lead).toContainText("at the close");
    await expect(lead.getByTestId("badge")).toHaveText(/^Unusual move$/);
    await expect(lead.getByTestId("band-chart")).toHaveCount(0);
    await expect(lead.getByTestId("says")).toContainText(/times further than it usually moves against them, so the news from that day was fetched\./);
    await expect(lead.getByTestId("record-link")).toHaveCount(0);
    await expect(lead.getByRole("link", { name: /in atlas/ })).toHaveCount(0);
    // The linked entry shows its details too.
    await expect(lead.getByTestId("details")).toHaveJSProperty("open", true);
  });

  test("the count line is in words", async ({ page }) => {
    await page.goto("/market/japan");
    await expect(page.getByRole("heading", { level: 2, name: "Every unusual move" })).toBeVisible();
    await expect(page.getByTestId("record-cadence")).not.toContainText(/σ|tripped|judged|event/i);
  });

  test("the method is behind a toggle and names every source and the base date", async ({ page }) => {
    await page.goto("/market/japan");
    const block = page.getByTestId("record-provenance");
    await expect(block).toHaveJSProperty("open", false);
    await block.locator("summary").click();
    await expect(block.locator("summary")).toHaveText("How this is calculated");
    for (const key of ["price", "chart", "sigma", "judged", "country", "split", "news"]) {
      await expect(block.locator(`[data-source=${key}]`)).toBeVisible();
    }
    await expect(block.locator("[data-source=chart]")).toContainText("close on 1 Jul");
  });

  test("uses the plain words everywhere on the page, with every disclosure open", async ({ page }) => {
    await page.goto("/market/japan");
    await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => ((d as HTMLDetailsElement).open = true)));
    expect(await page.locator("main").innerText()).not.toMatch(/sensor|tripped|\bband\b|thin listing|\bbenchmark\b/i);
    expect(await page.locator("main header").innerText()).not.toMatch(/σ/);
    await expect(page).toHaveTitle(/Japan — Market/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /every unusual move, and the company against its sector/);
  });

  test("the ledger entry links to the country's full record", async ({ page }) => {
    await page.goto("/market");
    const link = page.getByTestId("ledger-lead").getByTestId("record-link");
    await expect(link).toHaveText("Japan's full record →");
    await link.click();
    await expect(page).toHaveURL(/\/market\/japan$/);
  });

  test("a global name with no events says nothing was unusual", async ({ page }) => {
    await page.goto("/market/NVDA");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("NVDA");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Market / Semiconductors");
    // The real ticker's bars may end before the trigger's go-live (16 Oct), in which case no session is judged yet.
    await expect(page.getByTestId("record-cadence")).toHaveText(
      /^(Nothing unusual in the \d+ sessions? checked since 16 Oct\.|No session has been checked yet; checking starts from 16 Oct\.)/,
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
    // I48: the price is left-aligned on a phone and its dates do not wrap mid-date.
    await expect(page.getByTestId("record-last")).toHaveCSS("text-align", "left");
    const dates = page.getByTestId("record-last").locator("span.whitespace-nowrap");
    await expect(dates).toHaveCount(2);
    for (const d of await dates.all()) expect((await d.boundingBox())!.height).toBeLessThan(24);
    await axe(page);
  });
});
