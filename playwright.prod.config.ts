import { defineConfig, devices } from "@playwright/test";

// Phase 14's gate (portfolio.md §15): a real tick observed end to end in
// production. This is not a CI tier: it runs by hand, during US market hours,
// against the public site, so it has no webServer, no retries (a retry would
// hide a feed that is only sometimes alive) and one worker.
//
//   npm run test:prod                       # https://akjames.dev
//   PROD_URL=https://example npm run test:prod
export default defineConfig({
  testDir: "./e2e-prod",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 150_000,
  use: {
    baseURL: process.env.PROD_URL ?? "https://akjames.dev",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
