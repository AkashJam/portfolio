import { defineConfig, devices } from "@playwright/test";

// §21 "Accessibility" + "E2E" tiers. Needs a live `ticker` (+ Redis +
// Timescale) reachable at TICKER_API_URL for the live-tick E2E and for
// /market's axe scan to have real data rather than the honest-degradation
// fallback — CI wires that stack up before this runs (see ci.yml).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `npm run start` (next start) doesn't work with `output: "standalone"`
    // (next.config.ts) — the Dockerfile's actual production runtime is
    // `node server.js` against the standalone build output; mirroring
    // that here so this test suite exercises what actually ships, not a
    // different runtime mode that happens to limp along.
    command:
      "npm run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/ && node .next/standalone/server.js",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dockerfile's own documented gotcha: without this, standalone
    // server.js resolves the host's own hostname instead of binding all
    // interfaces — connection refused even though the process is running.
    env: { HOSTNAME: "0.0.0.0" },
  },
});
