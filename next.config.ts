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
    // .dockerignore excludes .git from the build context, so the plugin's
    // own git-based auto-detection finds nothing and uploads under the
    // literal release "undefined" otherwise — breaking release/deploy
    // tracking and suspect-commit correlation. ci.yml passes the same git
    // SHA already used for the ECR image tag via this build-arg.
    release: { name: process.env.SENTRY_RELEASE },
    // Undefined (no SENTRY_AUTH_TOKEN) is fine — the plugin skips source-map
    // upload with a warning instead of failing the build, which is exactly
    // what every local/PR build does (only the main-branch Docker build in
    // ci.yml passes this).
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // NOT !process.env.CI — that was wrong: CI=true is set on the GitHub
    // Actions *runner*, but this build runs inside `docker buildx build`'s
    // isolated container, which never inherits the runner's shell env
    // unless explicitly passed as a --build-arg (CI isn't one of the ones
    // we pass). So process.env.CI is always undefined here, making this
    // permanently silent regardless of environment — which is exactly why
    // the actual upload error (turned out to be a real one) never showed up
    // in the Docker build log. Silent only when there's truly nothing to
    // attempt (no token); verbose whenever a token is present, since that's
    // precisely when you want to see whether the upload actually worked.
    silent: !process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    // Proxies Sentry's beacon through a same-origin route instead of calling
    // ingest.sentry.io directly — sidesteps ad-blockers that drop that
    // request outright, which would otherwise silently lose error reports.
    tunnelRoute: "/monitoring-tunnel",
  })
);
