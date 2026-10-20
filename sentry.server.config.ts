import * as Sentry from "@sentry/nextjs";

// Loaded by instrumentation.ts's register() when NEXT_RUNTIME === "nodejs".
// Same DSN as instrumentation-client.ts — NEXT_PUBLIC_SENTRY_DSN isn't
// sensitive (it only lets you submit events, not read Sentry data), so
// there's no separate server-only var to plumb.
//
// Errors only, no tracing (phase17.md step 4, decision 4): with no
// tracesSampleRate the SDK skips its performance instrumentation, which is
// the part that costs memory in this process. Latency is Prometheus' job.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
