import * as Sentry from "@sentry/nextjs";

// Node only: nothing runs on the edge runtime (no middleware, no
// `runtime = "edge"`), so there is no edge config (phase17.md step 4).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

// Catches errors thrown in Server Components / Route Handlers that never
// reach a React error boundary (app/error.tsx and app/global-error.tsx only
// catch render-time errors) — the other half of server-side coverage.
export const onRequestError = Sentry.captureRequestError;
