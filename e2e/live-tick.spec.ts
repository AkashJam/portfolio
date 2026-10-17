import { expect, test } from "@playwright/test";

// §21 "E2E" tier — the concrete, automated proof of the §15 milestone
// ("a live SIM: tick streams end-to-end into the browser"), not just a
// one-off manual check. It asserts on the symbol page's price, which re-renders
// on SSE `quote` events (lib/sse.ts).
//
// It runs against the simulator by design: CI has no network and no keys, and
// the simulator never prices a real ticker, so the Prices table's rows cannot
// tick here. That table's handling of a quote is covered by market-prices.spec.ts
// with a scripted stream; the real feed is the gate's one-time production check.
test("a live SIM: tick updates the symbol page's price without a reload", async ({ page }) => {
  await page.goto("/market/SIM:NOVA/price");

  const priceCell = page.getByTestId("live-price");
  await expect(priceCell).toBeVisible();

  const initialPrice = await priceCell.textContent();
  expect(initialPrice).not.toBeNull();

  // The sim source ticks every 1-3s (portfolio.md §6.2) — 15s is enough
  // headroom for at least one real quote to arrive over the SSE proxy.
  await expect(priceCell).not.toHaveText(initialPrice!, { timeout: 15_000 });
});
