import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN is inlined into the client bundle at build time
// (next build), not read at container start — see infra/docker-compose.yml
// and .github/workflows/ci.yml's docker buildx build step for where the
// value actually comes from in each of the two places it's needed.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});

// Traces client-side route transitions (App Router doesn't have a
// server-visible "navigation" event to hook otherwise).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
