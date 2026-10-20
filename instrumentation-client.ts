import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN is inlined into the client bundle at build time
// (next build), not read at container start — see infra/docker-compose.yml
// and .github/workflows/ci.yml's docker buildx build step for where the
// value actually comes from in each of the two places it's needed.
//
// Errors only, no tracing (phase17.md step 4, decision 4). The SDK adds
// BrowserTracing by default whatever the sample rate, and its build-time
// switch (bundleSizeOptimizations.excludeTracing) only works under webpack,
// not the Turbopack `next build`, so it is filtered out here instead.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: (defaults) => defaults.filter((i) => i.name !== "BrowserTracing"),
});
