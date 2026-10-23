import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { siteUrl } from "./ports";

// The populated ledger, against real tickers whose databases `ticker fixture` filled
// (phase17.md step 5): the production judge on the backfilled closes (1 July to
// 8 October), at a threshold of 0.001σ so the story's sensors trip, with invented
// news through the production collector. The figures are the data's, and fixed by
// it: Japan and Canada at the last close (Canada with its split and news pending),
// Korea a thin listing gone ex-dividend, Brazil with a Portuguese central bank
// release, Caterpillar a global name with an 8-K, Colombia with no atlas row and a
// bank feed that kept failing. Every split is "neither": at this threshold no part
// passes 2σ alone.

const ROWS = ["canada-2026-10-08", "korea-2026-10-06", "brazil-2026-10-02", "cat-2026-09-30", "colombia-2026-09-28"];

async function expandAll(page: Page) {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll("[data-testid=ledger] details")) (d as HTMLDetailsElement).open = true;
  });
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("tripped, at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 }, baseURL: siteUrl("tripped") });

  test("the head names what tripped at the last close, and the nav dot says tripped", async ({ page }) => {
    await page.goto("/market");
    const line = page.getByTestId("ledger-line");
    await expect(line).toHaveAttribute("data-kind", "tripped");
    await expect(line).toContainText("Japan and Canada tripped at the last close.");
    await expect(line).toContainText("16 of 18 inside their band");
    await expect(page.locator('header a[href="/market"] [data-market-state]')).toHaveAttribute("data-market-state", "tripped");
  });

  test("the newest entry is open at the head, the rest are collapsed rows in time order", async ({ page }) => {
    await page.goto("/market");
    const lead = page.getByTestId("ledger-lead");
    await expect(lead).toHaveAttribute("id", "japan-2026-10-08");
    await expect(lead.getByRole("heading", { level: 3 })).toHaveText("Japan");
    await expect(lead).toContainText("as seen through MUFG");

    const rows = page.getByTestId("ledger-row");
    await expect(rows).toHaveCount(5);
    expect(await rows.evaluateAll((els) => els.map((e) => e.id))).toEqual(ROWS);
    for (const open of await rows.evaluateAll((els) => els.map((e) => (e as HTMLDetailsElement).open))) expect(open).toBe(false);
  });

  test("the lead carries the band, the split and the coverage", async ({ page }) => {
    await page.goto("/market");
    const lead = page.getByTestId("ledger-lead");

    const chart = lead.getByTestId("band-chart");
    await expect(chart).toHaveAttribute("data-side", "below");
    await expect(chart.locator("polyline")).toHaveCount(4); // upper edge, lower edge, inside, the departure
    await expect(lead).toContainText("−0.8σ against its sector (IXG).");
    await expect(lead).toContainText("±0.001σ of the residual over 60 sessions");

    const split = lead.getByTestId("split");
    await expect(split).toHaveAttribute("data-label", "neither");
    await expect(split).toContainText("JPY against the dollar 0.0% (0.1σ)");
    await expect(split).toContainText("MUFG net of its sector and its currency −1.1% (0.7σ)");
    await expect(split).toContainText("Neither part passed alone");
    await expect(split).toContainText("ECB fix, about 16:00 CET");

    await expect(lead.getByTestId("source-centralBank")).toContainText("Summary of Opinions at the Monetary Policy Meeting");
    await expect(lead.getByTestId("source-filings")).toContainText("No 6-K was filed in the window");
    await expect(lead.getByTestId("source-filings")).toContainText("cannot be categorised");

    const econ = lead.getByTestId("source-economyNews");
    await expect(econ).toContainText("5 outlets");
    await expect(econ).toContainText("before the close · 3");
    await expect(econ).toContainText("after the close · 3");
    await expect(econ).not.toContainText("Left out of");
    // The last close's own fetch: the follow-up comes after the next close.
    await expect(lead.getByTestId("coverage")).toHaveAttribute("data-complete", "false");
    await expect(lead.getByTestId("coverage-incomplete")).toBeVisible();
  });

  test("every outlet is a click away, in two tables split at the close", async ({ page }) => {
    await page.goto("/market");
    const econ = page.getByTestId("ledger-lead").getByTestId("source-economyNews");
    const more = econ.locator("summary");
    await expect(more).toHaveText("Show all 5 outlets and their headlines");
    await expect(econ.getByTestId("outlets-before")).toBeHidden();
    await more.click();
    await expect(econ.getByTestId("outlets-before").locator("tbody tr")).toHaveCount(3);
    await expect(econ.getByTestId("outlets-after").locator("tbody tr")).toHaveCount(3);
    await expect(econ.getByTestId("outlets-before").getByRole("link").first()).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("a row expands in place, and opening one does not close another", async ({ page }) => {
    await page.goto("/market");
    const korea = page.locator("#korea-2026-10-06");
    const brazil = page.locator("#brazil-2026-10-02");
    await korea.locator(":scope > summary").click();
    await brazil.locator(":scope > summary").click();
    await expect(korea).toHaveJSProperty("open", true);
    await expect(brazil).toHaveJSProperty("open", true);
    await expect(korea.getByTestId("band-chart")).toHaveAttribute("data-side", "below");
    await expect(korea.getByTestId("caveats")).toContainText("Thin listing · about $25M a day in New York (measured to 2026-10-09)");
    await expect(korea.getByTestId("split")).toHaveAttribute("data-label", "neither");
    await expect(korea).toContainText("→ South Korea in atlas");
    // South Korea has no verified survey, so no city page: the link lands on its row.
    await expect(korea.getByRole("link", { name: /South Korea in atlas/ })).toHaveAttribute("href", "/atlas#korea");
    // Japan has one, and the link goes there.
    await expect(page.getByTestId("ledger-lead").getByRole("link", { name: /Japan in atlas/ })).toHaveAttribute("href", "/atlas/japan");
  });

  test("an ex-dividend session is named, an ordinary one says nothing, and a lookup that kept failing says it is unknown", async ({ page }) => {
    await page.goto("/market");
    // Korea went ex on its session: the date, the amount and what it does to the figure.
    const korea = page.locator("#korea-2026-10-06");
    await korea.locator(":scope > summary").click();
    const named = korea.locator('[data-caveat="dividend"]');
    await expect(named).toContainText("Ex-dividend session · $0.55 a share went ex on 6 Oct");
    await expect(named).toContainText("of the previous close");
    await expect(named).toContainText("the figure above is not corrected for it");
    // Japan's and Colombia's lookups answered "none": no line, which is the ordinary case.
    await expect(page.getByTestId("ledger-lead").locator('[data-caveat="dividend"]')).toHaveCount(0);
    const colombia = page.locator("#colombia-2026-09-28");
    await colombia.locator(":scope > summary").click();
    await expect(colombia.locator('[data-caveat="dividend"]')).toHaveCount(0);
    // Brazil's failed at the trip, the follow-up and the run after.
    const brazil = page.locator("#brazil-2026-10-02");
    await brazil.locator(":scope > summary").click();
    await expect(brazil.locator('[data-caveat="dividend"]')).toContainText("could not be checked, so a dividend may be part of this move");
    // The dividend source is a caveat, not a news block.
    await expect(korea.getByTestId("source-dividend")).toHaveCount(0);
  });

  test("a central bank release in another language says which", async ({ page }) => {
    await page.goto("/market#brazil-2026-10-02");
    const bank = page.locator("#brazil-2026-10-02").getByTestId("source-centralBank");
    await expect(bank).toContainText("BC divulga nota sobre o mercado de câmbio");
    await expect(bank).toContainText("in Portuguese");
  });

  test("a fragment opens its entry on load, and on a later change", async ({ page }) => {
    await page.goto("/market#cat-2026-09-30");
    await expect(page.locator("#cat-2026-09-30")).toHaveJSProperty("open", true);
    await expect(page.locator("#korea-2026-10-06")).toHaveJSProperty("open", false);
    await page.evaluate(() => (window.location.hash = "#korea-2026-10-06"));
    await expect(page.locator("#korea-2026-10-06")).toHaveJSProperty("open", true);
  });

  test("a global name shows its 8-K item codes, no split and no atlas link", async ({ page }) => {
    await page.goto("/market#cat-2026-09-30");
    const cat = page.locator("#cat-2026-09-30");
    await expect(cat.getByTestId("split-none")).toContainText("A global name has no home currency");
    const codes = cat.getByTestId("item-codes");
    await expect(codes).toContainText("Item 5.02");
    await expect(codes).toContainText("Departure of Directors or Certain Officers");
    await expect(cat.getByTestId("caveats")).toContainText("A large holding of its own benchmark (EXI)");
    await expect(cat.getByRole("link", { name: /in atlas/ })).toHaveCount(0);
    await expect(cat).toContainText("Industrial cycle");
    // MarketBeat's two headlines are on the excluded list: counted, never listed.
    const topic = cat.getByTestId("source-topicNews");
    await expect(topic).toContainText("Left out of the 6 headlines the search returned: 2 from outlets that generate pages from price or filing data.");
    await expect(topic).not.toContainText("MarketBeat");
  });

  test("Colombia is named, has no atlas link, and shows a source that kept failing", async ({ page }) => {
    await page.goto("/market#colombia-2026-09-28");
    const co = page.locator("#colombia-2026-09-28");
    await expect(co.locator(":scope > summary")).toContainText("Colombia");
    await expect(co.getByRole("link", { name: /in atlas/ })).toHaveCount(0);
    const bank = co.getByTestId("source-centralBank");
    await expect(bank).toHaveAttribute("data-status", "error");
    await expect(bank).toContainText("could not be read after 3 attempts");
    await expect(bank).toContainText("HTTP 403");
    await expect(co.getByTestId("split-none")).toContainText("publishes no daily rate");
  });

  test("an entry whose news and split are still pending says so", async ({ page }) => {
    await page.goto("/market#canada-2026-10-08");
    const ca = page.locator("#canada-2026-10-08");
    await expect(ca.getByTestId("split-pending")).toContainText("has not been made yet");
    await expect(ca.getByTestId("coverage-pending")).toContainText("has not been fetched yet");
  });

  test("the tape has a sparkline and the trigger's sigma for each sensor", async ({ page }) => {
    await page.goto("/market");
    const rows = page.locator("[data-testid^=market-row-]");
    await expect(rows).toHaveCount(18);
    // Every sensor has sixty returns by 8 October, so none is left without a sparkline.
    await expect(page.getByTestId("sparkline")).toHaveCount(18);
    await expect(page.getByTestId("sparkline-empty")).toHaveCount(0);
    const mufg = page.getByTestId("market-row-MUFG");
    await expect(mufg).toHaveAttribute("data-tripped", "true");
    await expect(mufg.getByTestId("sigma")).toContainText("−0.8σ");
    await expect(mufg.getByTestId("sigma").locator("b")).toHaveCSS("color", "rgb(239, 83, 80)"); // --market-down
    await expect(page.getByTestId("market-row-RY").getByTestId("sigma")).toContainText("−1.0σ");
    await expect(page.getByTestId("market-row-BCH").getByTestId("sigma")).toContainText("+1.4σ");
    await expect(page.getByRole("columnheader", { name: "σ · last close" })).toBeVisible();
    await expect(page.locator("[data-tripped=true]")).toHaveCount(2); // Japan and Canada
  });

  test("has no WCAG 2.1 AA violations, with every entry open", async ({ page }) => {
    await page.goto("/market");
    await expandAll(page);
    await axe(page);
  });
});

test.describe("tripped, at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, baseURL: siteUrl("tripped") });

  test("has no WCAG 2.1 AA violations and the ledger does not overflow the screen", async ({ page }) => {
    await page.goto("/market");
    await expandAll(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await page.getByTestId("ledger").boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await axe(page);
  });
});

test.describe("quiet", () => {
  test.use({ viewport: { width: 1440, height: 900 }, baseURL: siteUrl("quiet") });

  test("nothing past threshold, and the head says how long ago the last trip was", async ({ page }) => {
    await page.goto("/market");
    const line = page.getByTestId("ledger-line");
    await expect(line).toHaveAttribute("data-kind", "quiet");
    await expect(line).toContainText("Nothing past threshold.");
    await expect(line).toContainText("18 of 18 inside their band · last trip was South Korea, 2 sessions ago");
    await expect(page.locator('header a[href="/market"] [data-market-state]')).toHaveAttribute("data-market-state", "quiet");
    // Still the head of the ledger, but calm: no tint, and the date carries its age.
    await expect(page.getByTestId("ledger-lead")).toHaveAttribute("id", "korea-2026-10-06");
    await expect(page.getByTestId("ledger-lead")).toHaveAttribute("data-fresh", "false");
    await expect(page.locator("[data-tripped=true]")).toHaveCount(0);
  });

  test("has no WCAG 2.1 AA violations", async ({ page }) => {
    await page.goto("/market");
    await expandAll(page);
    await axe(page);
  });

  test("closed: the tape is frozen and the ledger is unaffected", async ({ page }) => {
    await page.route("**/api/market-state", (route) =>
      route.fulfill({ json: { feed: "closed", session: "closed", opensAt: new Date(Date.now() + 5 * 3_600_000).toISOString(), tripped: false } }),
    );
    await page.goto("/market");
    await expect(page.getByTestId("market-state-line")).toHaveAttribute("data-tone", "closed");
    await expect(page.locator("[data-session]")).toHaveAttribute("data-session", "closed");
    await expect(page.getByTestId("ledger-lead")).toBeVisible();
    await expect(page.getByTestId("ledger-line")).toContainText("Nothing past threshold.");
    await axe(page);
  });
});
