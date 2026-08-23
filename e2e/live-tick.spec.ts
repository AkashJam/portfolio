import { expect, test } from "@playwright/test";

// §21 "E2E" tier — the concrete, automated proof of the §15 milestone
// ("a live SIM: tick streams end-to-end into the browser"), not just a
// one-off manual check. Asserts against MarketTable's price cell, which
// genuinely re-renders on SSE `quote` events (lib/sse.ts) — the
// /market/[symbol] header price is SSR-only and never updates client-side,
// so it can't prove a live pipeline the way this row can.
test("a live SIM: tick updates the market table without a page reload", async ({ page }) => {
  await page.goto("/market");

  const row = page.getByTestId("market-row-SIM:NOVA");
  await expect(row).toBeVisible();
  const priceCell = row.getByTestId("price");

  const initialPrice = await priceCell.textContent();
  expect(initialPrice).not.toBeNull();

  // The sim source ticks every 1-3s (portfolio.md §6.2) — 15s is enough
  // headroom for at least one real quote to arrive over the SSE proxy.
  await expect(priceCell).not.toHaveText(initialPrice!, { timeout: 15_000 });
});
