import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Lean runtime image (infra/Dockerfile's `runtime` stage) — traces only
  // the deps actually needed at runtime into .next/standalone.
  output: "standalone",
};

export default withSentryConfig(withContentCollections(nextConfig), {
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
});
