import * as Sentry from "@sentry/nextjs";

// Loaded by instrumentation.ts's register() when NEXT_RUNTIME === "edge"
// (middleware, edge routes — none exist yet, but Next.js still probes this
// file). Same init shape as sentry.server.config.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
