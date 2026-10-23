import { defineConfig, devices } from "@playwright/test";

import { SITES } from "./e2e-fixture/ports";

// The populated ledger (phase17.md step 5). The default suite runs against a ticker
// whose database holds no events, so the ledger only ever shows its empty state.
// This suite runs the same built site twice, against two real tickers whose
// databases `ticker fixture` filled with the real judge's events on the backfilled
// closes: one tripped at the newest session, one quiet. serve.mjs checks the tickers
// are up and says how to start them.
export default defineConfig({
  testDir: "./e2e-fixture",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node e2e-fixture/serve.mjs",
    url: `http://127.0.0.1:${SITES.tripped.site}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
