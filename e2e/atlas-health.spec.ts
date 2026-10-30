import { expect, test, type Page } from "@playwright/test";
import { atlasHydrated, gotoAtlas } from "./atlas-hydrated";

// The atlas page's client JavaScript has to be alive, not just present. A
// locator-driven test passes against a page that hydrated; this one also fails
// on any uncaught error or console error, and drives the controls with real
// pointer input (mouse at coordinates, touch taps) rather than locator clicks.
// Needs the ticker (real /atlas/cities).

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Sentry's beacon goes through a same-origin tunnel that is not running in CI.
    if (text.includes("monitoring-tunnel")) return;
    errors.push(`console.error: ${text.slice(0, 300)}`);
  });
  return errors;
}

test.describe("at 1440px, with a mouse", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("loads with no uncaught or console errors, and its controls answer real clicks", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await gotoAtlas(page);

    const chip = page.getByRole("tab", { name: "Stocks & housing" });
    const b = (await chip.boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await expect(chip).toHaveAttribute("aria-selected", "true");

    await page.getByRole("tab", { name: "Countries" }).click();
    const sort = page.getByRole("button", { name: /^House prices/ }).first();
    await sort.scrollIntoViewIfNeeded();
    const s = (await sort.boundingBox())!;
    await page.mouse.click(s.x + s.width / 2, s.y + s.height / 2);
    await expect(page.locator("th[aria-sort=descending]")).toHaveCount(1);

    await expect(page.getByRole("tab", { name: "Countries" })).toHaveAttribute("aria-selected", "true");

    expect(errors).toEqual([]);
  });
});

test.describe("at 390px, with touch", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("loads with no uncaught or console errors, and its controls answer taps", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await gotoAtlas(page);

    // On a phone the questions are a dropdown.
    const question = page.locator("#atlas-question-select");
    await question.selectOption("shares-housing");
    await expect(question).toHaveValue("shares-housing");

    await page.getByRole("tab", { name: "Countries" }).tap();
    const sort = page.getByRole("button", { name: /^House prices/ }).first();
    await sort.scrollIntoViewIfNeeded();
    await sort.tap();
    await expect(page.locator("th[aria-sort=descending]")).toHaveCount(1);

    const info = page.getByRole("button", { name: "About the house prices column" });
    await info.tap();
    await expect(page.getByRole("dialog")).toBeVisible();

    expect(errors).toEqual([]);
  });
});

// Next 16's dev server refuses its HMR WebSocket to any host but `localhost`
// unless it is in `allowedDevOrigins` (next.config.ts). Refused, React never
// hydrates and every client component on the site is dead, while plain links
// still work: it looked like a broken /atlas. A production build has no such
// check, so this only bites, and only guards, against a dev server.
test("is just as alive when opened at 127.0.0.1 as at localhost", async ({
  page,
  baseURL,
}) => {
  test.skip(!baseURL, "needs a baseURL");
  const url = new URL("/atlas", baseURL!);
  url.hostname = "127.0.0.1";
  await page.goto(url.toString());
  await atlasHydrated(page);
  const chip = page.getByRole("tab", { name: "Stocks & housing" });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-selected", "true");
});
