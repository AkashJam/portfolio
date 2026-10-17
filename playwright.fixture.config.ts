import { defineConfig, devices } from "@playwright/test";

import { SITES } from "./e2e-fixture/ports";

// The populated ledger (portfolio.md §15 Phase 15 step 7, decision 6). The default
// suite runs against the simulator, whose database holds no events, so the ledger
// would only ever show its empty state. This suite runs the same built site three
// times against fixture tickers (e2e-fixture/) that serve canned events: one tripped,
// one quiet, one empty. Needs a real ticker for everything else (the stream, the
// sensors, the prices), at TICKER_API_URL as in the default suite.
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
