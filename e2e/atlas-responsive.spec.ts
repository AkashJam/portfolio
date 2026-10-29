import AxeBuilder from "@axe-core/playwright";
import { gotoAtlas, openMoreColumns } from "./atlas-hydrated";
import { expect, test, type Page } from "@playwright/test";

// Phase 11 step 9: the responsive pass (bearing.md #107, "The responsive
// contract"), `.q`, and the stated absences. Needs the ticker (real /atlas/cities).

const tableBox = (page: Page) =>
  page.locator("#countries [data-slot=table-container]");
const firstCell = (page: Page, slug: string) =>
  page.locator(`tr#${slug} td`).first();
const panel = "rgb(15, 18, 22)"; // --panel

for (const width of [390, 768, 1024, 1440]) {
  test(`at ${width}px the document does not scroll sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoAtlas(page, "countries");
    await expect(page.locator("#countries tbody tr")).toHaveCount(23);
    const [sw, cw] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(sw).toBeLessThanOrEqual(cw + 1);
  });
}

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the table scrolls sideways inside its container, with its first column pinned", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    const box = tableBox(page);
    const [sw, cw] = await box.evaluate((e) => [e.scrollWidth, e.clientWidth]);
    expect(sw).toBeGreaterThan(cw);
    expect(
      await firstCell(page, "japan").evaluate(
        (e) => getComputedStyle(e).position,
      ),
    ).toBe("sticky");

    const left = (await box.boundingBox())!.x;
    const before = (await firstCell(page, "japan").boundingBox())!.x;
    await box.evaluate((e) => (e.scrollLeft = 400));
    const after = (await firstCell(page, "japan").boundingBox())!.x;
    const figure = (await page.locator("tr#japan td").nth(3).boundingBox())!.x;
    expect(Math.abs(after - before)).toBeLessThan(2); // the city did not move
    expect(Math.abs(after - left)).toBeLessThan(2); // and it sits at the container's left edge
    expect(figure).toBeLessThan(after + 400); // while the figures did scroll under it
  });

  test("the table fades the edge that has more to show, and only that edge", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await openMoreColumns(page); // nine columns, so there is room to scroll through all three states
    const box = tableBox(page);
    const edges = () =>
      box.evaluate((e) => [e.dataset.moreLeft, e.dataset.moreRight]);
    const mask = () => box.evaluate((e) => getComputedStyle(e).maskImage);

    await box.evaluate((e) => (e.scrollLeft = 0));
    await expect.poll(edges).toEqual(["false", "true"]); // at the start: more to the right
    expect(await mask()).toContain("calc(100% - 40px)");

    await box.evaluate((e) => (e.scrollLeft = 260));
    await expect.poll(edges).toEqual(["true", "true"]); // mid: both
    // the left cue is the pinned column's shadow over what scrolls under it, not a mask
    expect(await mask()).toContain("calc(100% - 40px)");
    expect(
      await firstCell(page, "japan").evaluate(
        (e) => getComputedStyle(e).boxShadow,
      ),
    ).not.toBe("none");

    await box.evaluate((e) => (e.scrollLeft = 99999));
    await expect.poll(edges).toEqual(["true", "false"]); // at the end: nothing more to the right
    expect(await mask()).not.toContain("calc(100% - 40px)");
  });

  test("the pinned cell is opaque, so what scrolls under it does not show through", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    expect(
      await firstCell(page, "japan").evaluate(
        (e) => getComputedStyle(e).backgroundColor,
      ),
    ).toBe(panel);
  });

  test("the scatter is its own phone drawing: 360 units wide, nothing scrolls sideways inside it", async ({
    page,
  }) => {
    await gotoAtlas(page);
    const svg = page.locator("svg[data-drawing=phone]");
    await expect(svg).toBeVisible();
    await expect(page.locator("svg[data-drawing=desktop]")).toBeHidden();
    expect(await svg.getAttribute("viewBox")).toBe("0 0 360 420");
    const [sw, cw] = await svg.evaluate((e) => [e.parentElement!.scrollWidth, e.parentElement!.clientWidth]);
    expect(sw).toBeLessThanOrEqual(cw + 1);
    // its labels are 11px, not the desktop drawing's scaled-down text
    const size = await svg.locator("g[data-slug] text").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(size).toBeGreaterThanOrEqual(10);
  });

  test("the fade never runs along the top or bottom: its gradient is horizontal", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    for (const sel of [
      "#countries [data-slot=table-container]",
    ]) {
      const mask = await page
        .locator(sel)
        .evaluate((e) => getComputedStyle(e).maskImage);
      expect(mask, sel).toContain("linear-gradient(to right");
      expect(mask, sel).not.toMatch(/to (top|bottom)|180deg|0deg/);
    }
  });

  test("a highlighted row's tint shows on the pinned cell too", async ({
    page,
  }) => {
    await page.goto("/atlas#japan");
    await expect(page.locator("tr#japan")).toHaveAttribute(
      "data-target",
      "true",
    );
    expect(
      await firstCell(page, "japan").evaluate(
        (e) => getComputedStyle(e).backgroundColor,
      ),
    ).not.toBe(panel);
  });

  test("has no WCAG 2.1 AA violations with the table scrolled", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await tableBox(page).evaluate((e) => (e.scrollLeft = 400));
    const results = await new AxeBuilder({ page })
      .include("#countries")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});

test.describe("at 1440px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("nothing is pinned and nothing fades: the whole table is on screen", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    expect(
      await firstCell(page, "japan").evaluate(
        (e) => getComputedStyle(e).position,
      ),
    ).toBe("static");
    expect(
      await tableBox(page).evaluate((e) => getComputedStyle(e).backgroundImage),
    ).toBe("none");
    const [sw, cw] = await tableBox(page).evaluate((e) => [
      e.scrollWidth,
      e.clientWidth,
    ]);
    expect(sw).toBeLessThanOrEqual(cw + 1);
  });

  test("a point whose label was suppressed for collision is drawn at 0.72, the others at full strength", async ({
    page,
  }) => {
    // A built pair, so no reading pair is highlighted and no dot is muted.
    await page.goto("/atlas?x=everydaySpendingEur&y=housing");
    const q = page.locator('svg[data-drawing=desktop] circle[data-q="true"]');
    const plain = page.locator("svg[data-drawing=desktop] circle:not([data-q])");
    expect(await q.count()).toBeGreaterThan(0);
    expect(await plain.count()).toBeGreaterThan(0);
    for (const c of await q.all())
      expect(await c.evaluate((e) => getComputedStyle(e).opacity)).toBe("0.72");
    for (const c of (await plain.all()).slice(0, 5))
      expect(await c.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    // and the suppression is the collision's, not the data's: every flagged point has no label of its own
    for (const g of await page
      .locator('svg[data-drawing=desktop] g[data-slug]:has(circle[data-q="true"])')
      .all()) {
      // the value readout is not a label
      expect(await g.evaluate((e) => [...e.querySelectorAll("text")].filter((t) => !t.closest(".atlas-tip")).length)).toBe(0);
    }
  });

  test("the table opens on four columns and More columns reveals the rest, in the address", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    const heads = page.locator("#countries thead th:visible");
    await expect(heads).toHaveCount(4);
    await expect(heads.nth(1)).toContainText("House prices");
    await expect(heads.nth(2)).toContainText("Inflation");
    await expect(heads.nth(3)).toContainText("Average spending a month");
    const toggle = page.getByRole("button", { name: /More columns/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(heads).toHaveCount(9);
    await expect(page).toHaveURL(/\?view=countries&cols=more$/);
    await page.reload();
    await expect(page.locator("#countries thead th:visible")).toHaveCount(9);
    await page.getByRole("button", { name: /Fewer columns/ }).click();
    await expect(heads).toHaveCount(4);
    expect(new URL(page.url()).search).toBe("?view=countries");
  });

  test("the sort is in the address and survives a reload", async ({ page }) => {
    await gotoAtlas(page, "countries");
    await page.getByRole("button", { name: "House prices", exact: true }).click();
    await expect(page).toHaveURL(/sort=housing\.desc$/);
    await page.reload();
    await expect(page.locator("th[aria-sort=descending]")).toContainText("House prices");
    await page.goto("/atlas?view=countries&sort=bogus");
    await expect(page.locator("th[aria-sort=ascending]")).toContainText("Average spending a month");
  });

  test("only the gain and loss columns are coloured; inflation is not", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    const colour = (n: number) =>
      page.locator("tr#united-states td").nth(n).evaluate((e) => getComputedStyle(e).color);
    const read = await colour(2); // inflation: a rise of +44%, still the text colour
    expect(read).not.toBe(await colour(1)); // house prices (+59%) carry the gain colour
    await openMoreColumns(page);
    expect(await colour(4)).toBe(await colour(1)); // so does the stock market
    const plain = await page.locator("tr#united-states td").nth(3).evaluate((e) => getComputedStyle(e).color);
    expect(read).toBe(plain); // inflation reads like any uncoloured figure
  });

  test("the city count is said once, from the data, and no row says it has no page", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await expect(page.getByText("17 of 23 countries have a city page.")).toHaveCount(1);
    await expect(page.getByText("no city page yet")).toHaveCount(0);
    const links = page.locator("#countries tbody td:first-child a[href^='/atlas/']");
    await expect(links).toHaveCount(17);
    await expect(page.locator("#countries tbody a[href='/atlas/japan']")).toHaveText("Tokyo");
  });

  test("the sensor is in the city's popover: a symbol linking to its price page, or none", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await expect(page.locator("#countries tbody td:first-child small")).toHaveCount(23);
    await expect(page.locator("#countries").getByText(/market sensor/i)).toHaveCount(0);
    await page.getByRole("button", { name: "About Tokyo" }).click();
    const d = page.getByRole("dialog");
    await expect(d.getByTestId("sensor-note")).toContainText("Market sensor");
    await expect(d.locator("a[href^='/market/']")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "About Dijon" }).click();
    await expect(page.getByRole("dialog").getByTestId("sensor-note")).toContainText("No market sensor");
  });

  test("the page shows no market figure: no price, no feed badge", async ({
    page,
  }) => {
    await gotoAtlas(page, "countries");
    await expect(page.getByText(/SSE|live feed|●/)).toHaveCount(0);
  });
});
