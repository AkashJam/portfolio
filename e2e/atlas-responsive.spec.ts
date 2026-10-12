import AxeBuilder from "@axe-core/playwright";
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
    await page.goto("/atlas");
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
    await page.goto("/atlas");
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

  test("a fade marks the table's scroller, and the pinned cell is opaque", async ({
    page,
  }) => {
    await page.goto("/atlas");
    expect(
      await tableBox(page).evaluate((e) => getComputedStyle(e).backgroundImage),
    ).toContain("linear-gradient");
    expect(
      await firstCell(page, "japan").evaluate(
        (e) => getComputedStyle(e).backgroundColor,
      ),
    ).toBe(panel);
  });

  test("the scatter takes the fade only: it scrolls at a 720px minimum and its first column is not pinned", async ({
    page,
  }) => {
    await page.goto("/atlas");
    const scroller = page.locator("#compare .scroll-fade");
    expect(
      await scroller.evaluate((e) => getComputedStyle(e).backgroundImage),
    ).toContain("linear-gradient");
    const [sw, cw] = await scroller.evaluate((e) => [
      e.scrollWidth,
      e.clientWidth,
    ]);
    expect(sw).toBeGreaterThanOrEqual(720);
    expect(sw).toBeGreaterThan(cw);
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
    await page.goto("/atlas");
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
    await page.goto("/atlas");
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
    await page.goto("/atlas");
    const q = page.locator('#compare svg circle[data-q="true"]');
    const plain = page.locator("#compare svg circle:not([data-q])");
    expect(await q.count()).toBeGreaterThan(0);
    expect(await plain.count()).toBeGreaterThan(0);
    for (const c of await q.all())
      expect(await c.evaluate((e) => getComputedStyle(e).opacity)).toBe("0.72");
    for (const c of (await plain.all()).slice(0, 5))
      expect(await c.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    // and the suppression is the collision's, not the data's: every flagged point has no label of its own
    for (const g of await page
      .locator('#compare svg g:has(circle[data-q="true"])')
      .all()) {
      expect(await g.locator("text").count()).toBe(0);
    }
  });

  test("eleven rows name a market sensor and twelve say they have none", async ({
    page,
  }) => {
    await page.goto("/atlas");
    const lines = await page
      .locator("#countries tbody tr td:first-child small")
      .allInnerTexts();
    expect(lines).toHaveLength(23);
    expect(lines.filter((t) => /no market sensor/.test(t))).toHaveLength(12);
    expect(lines.filter((t) => /market sensor [A-Z]/.test(t))).toHaveLength(11);
  });

  test("the stated absences read with the counts from the data", async ({
    page,
  }) => {
    await page.goto("/atlas");
    const notes = page.locator("#countries");
    await expect(
      notes.getByText(
        /Eleven of these rows name a US-listed bank or telecom as their market sensor; the other twelve have none\./,
      ),
    ).toBeVisible();
    await expect(
      notes.getByText(
        /The name is text, not a link: this page shows no market figure/,
      ),
    ).toBeVisible();
    await expect(
      notes.getByText("No city has a page yet, so no name is a link."),
    ).toBeVisible();
  });

  test("no city name is a link, and no row repeats 'no city page yet'", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await expect(page.locator("#countries tbody td:first-child a")).toHaveCount(
      0,
    );
    await expect(
      page.locator("#countries tbody").getByText("no city page yet"),
    ).toHaveCount(0);
  });

  test("the page shows no market figure: no price, no feed badge", async ({
    page,
  }) => {
    await page.goto("/atlas");
    await expect(page.getByText(/SSE|live feed|●/)).toHaveCount(0);
  });
});
