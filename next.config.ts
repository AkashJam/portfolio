import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Lean runtime image (infra/Dockerfile's `runtime` stage) — traces only
  // the deps actually needed at runtime into .next/standalone.
  output: "standalone",
};

// withContentCollections OUTSIDE withSentryConfig, not the other way around
// (Sentry's own docs suggest applying it last, which would mean the
// opposite order) — reproduced directly: withSentryConfig(withContentCollections(...))
// silently drops output: "standalone" from the final config (next build
// exits 0, but .next/standalone is simply never created — no warning, no
// error), regardless of which Sentry options are passed. This order
// doesn't have that problem; both plugins' own effects (content-collections
// codegen, Sentry instrumentation/source-map upload) still work correctly.
export default withContentCollections(
  withSentryConfig(nextConfig, {
    org: "akash-0g",
    project: "javascript-nextjs",
    // Undefined (no SENTRY_AUTH_TOKEN) is fine — the plugin skips source-map
    // upload with a warning instead of failing the build, which is exactly
    // what every local/PR build does (only the main-branch Docker build in
    // ci.yml passes this).
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    // Proxies Sentry's beacon through a same-origin route instead of calling
    // ingest.sentry.io directly — sidesteps ad-blockers that drop that
    // request outright, which would otherwise silently lose error reports.
    tunnelRoute: "/monitoring-tunnel",
  })
);
