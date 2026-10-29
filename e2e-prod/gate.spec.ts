import { expect, test } from "@playwright/test";

// Phase 14's gate: "a real tick is observed end to end in production — a
// Playwright run of the live-tick spec against the public site during market
// hours, with the symbol and timestamp recorded in phase14.md".
//
// It fails loudly instead of passing vacuously: if the session is closed it says
// so rather than skipping, and every assertion is on something only the real feed
// can produce. The GATE: line printed at the end is what phase14.md records.
//
// The symbol is NVDA, not the home band's RY: on 16 Oct RY went 90 seconds without a
// trade at 09:45 ET while NVDA and AAPL streamed several a second, so a country
// sensor can be too quiet to prove a tick inside any short timeout. The gate needs a
// busy name; GATE_SYMBOL overrides it.

const SYMBOL = process.env.GATE_SYMBOL ?? "NVDA";
// The home band's fixed default: NVDA since 2026-10-20 (bearing.md #118; RY moved out), checked for
// being live, not for ticking.
const BAND_DEFAULT = "NVDA";

test.describe.configure({ mode: "serial" });

test("production is in US hours with a live feed", async ({ request }) => {
  const res = await request.get("/api/market-state");
  expect(res.status(), "/api/market-state: is the new release deployed?").toBe(200);
  const state = await res.json();
  expect(state.session, "run this during US hours (13:30-20:00 UTC)").toBe("open");
  expect(state.feed, `the feed reads ${state.feed}, not live`).toBe("live");
});

test("a real quote reaches the browser and moves the symbol page without a reload", async ({ page }) => {
  await page.goto(`/market/${SYMBOL}`);
  const price = page.getByTestId("live-price");
  await expect(price).toBeVisible();
  const before = (await price.textContent())!;

  // The quote's own timestamp, from a second stream opened by the page itself:
  // proof that a trade, not a cached value, crossed Finnhub, the ticker, Redis and
  // the same-origin proxy.
  const quote = await page.evaluate(
    (symbol) =>
      new Promise<{ symbol: string; price: number; time: string }>((resolve, reject) => {
        const source = new EventSource(`/api/stream?symbols=${encodeURIComponent(symbol)}`);
        const timer = setTimeout(() => {
          source.close();
          reject(new Error("no quote within 90s"));
        }, 90_000);
        source.addEventListener("quote", (event) => {
          clearTimeout(timer);
          source.close();
          resolve(JSON.parse((event as MessageEvent).data));
        });
      }),
    SYMBOL,
  );
  expect(quote.symbol).toBe(SYMBOL);
  expect(quote.price).toBeGreaterThan(0);
  // A trade from the last few minutes, not an old cached one.
  expect(Date.now() - Date.parse(quote.time), "the quote is stale").toBeLessThan(5 * 60_000);

  // And the page itself moves: a price that differs from the one it loaded with.
  await expect(price).not.toHaveText(before, { timeout: 90_000 });
  const after = (await price.textContent())!;
  await expect(page.getByTestId("live-chip")).toBeVisible();

  console.log(`GATE: ${SYMBOL} ${before} -> ${after}; quote ${quote.price} at ${quote.time}; observed ${new Date().toISOString()}`);
});

test("the Prices table row ticks while the state row says LIVE", async ({ page }) => {
  await page.goto("/market");
  const row = page.getByTestId(`market-row-${SYMBOL}`);
  await expect(row).toBeVisible();
  const before = (await row.getByTestId("price").textContent())!;
  await expect(row.getByTestId("price")).not.toHaveText(before, { timeout: 120_000 });
  await expect(page.getByTestId("live-chip")).toBeVisible();
});

test("the home band is live on the fixed default", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section[data-session]")).toHaveAttribute("data-session", "open");
  await expect(page.getByTestId("band-chart-open")).toHaveAttribute("aria-label", `Live price series, ${BAND_DEFAULT}`);
  await expect(page.getByTestId("band-end-point")).toBeVisible();
});

test("no simulator reaches a visitor", async ({ page, request }) => {
  expect((await request.get("/market/SIM:NOVA")).status()).toBe(404);
  expect((await request.get("/market/IXN")).status(), "a basket has no page").toBe(404);

  await page.goto("/market");
  const rows = page.locator("[data-testid^='market-row-']");
  await expect(rows).toHaveCount(18);
  const text = (await page.locator("main").innerText()).toLowerCase();
  expect(text).not.toContain("sim:");
  expect(text).not.toContain("simulated");
});
