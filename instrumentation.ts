import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Catches errors thrown in Server Components / Route Handlers that never
// reach a React error boundary (app/error.tsx and app/global-error.tsx only
// catch render-time errors) — the other half of server-side coverage.
export const onRequestError = Sentry.captureRequestError;
