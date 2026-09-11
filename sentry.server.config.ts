import * as Sentry from "@sentry/nextjs";

// Loaded by instrumentation.ts's register() when NEXT_RUNTIME === "nodejs".
// Same DSN as instrumentation-client.ts — NEXT_PUBLIC_SENTRY_DSN isn't
// sensitive (it only lets you submit events, not read Sentry data), so
// there's no separate server-only var to plumb.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
