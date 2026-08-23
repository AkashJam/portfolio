// §21 "Performance" tier — budgets on Home and About, the two fully-static
// pages with no backend dependency. Thresholds are set from a real
// baseline run against this build, not guessed upfront (Home: perf 0.92,
// a11y/best-practices/SEO 1.0; About the same, before the heading-order/
// contrast fixes this session found and applied — expect a11y 1.0 on the
// next real run). Some headroom below the baseline so normal variance
// doesn't flake the build, not razor-thin against the exact numbers seen.
//
// LCP/TBT numbers from this specific run reflect a shared, resource-
// constrained sandbox, not the real t4g.small production box — treat the
// performance *score* thresholds as the meaningful budget, the ones tied
// to relative timing, not as a claim about production's actual latency.
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/", "http://localhost:3000/about"],
      numberOfRuns: 3,
      // Same standalone-server command as playwright.config.ts, and for
      // the same reason: `next start` doesn't work with `output:
      // "standalone"` — this mirrors the Dockerfile's actual production
      // runtime rather than a different mode that happens to run.
      startServerCommand:
        "cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/ && node .next/standalone/server.js",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 30_000,
      settings: {
        chromePath: process.env.CHROME_PATH,
        chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        throttlingMethod: "provided",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
