import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Security headers (portfolio.md §13). Static, not nonce-based: Next applies a
// nonce only while rendering a request, so a nonce CSP would make every page
// dynamic and undo §3's SSG/ISR choices (/ stays static, Phase 6). That leaves
// 'unsafe-inline' for Next's inline bootstrap scripts, and for the inline
// styles Recharts and Lightweight Charts set. 'unsafe-eval' is for MDX:
// MDXRenderer builds each post and case study on the client with
// @content-collections/mdx's MDXContent, which uses new Function(); without
// it those pages fail to hydrate. With 'unsafe-inline' already allowed it adds
// little, and it can go if MDX moves to the server. Everything else is
// same-origin: fonts are self-hosted and Sentry goes through
// /monitoring-tunnel. JSON-LD is a data block, which script-src does not
// govern. No upgrade-insecure-requests: HSTS covers production, and it would
// upgrade http://localhost in dev and CI.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  // Lean runtime image (infra/Dockerfile's `runtime` stage) — traces only
  // the deps actually needed at runtime into .next/standalone.
  output: "standalone",

  // Dev only; production ignores it. Next 16 blocks cross-origin requests to its
  // dev resources unless the host is allowed, and `localhost` is the only host
  // that is by default. Opened at 127.0.0.1 (or a LAN address), the HMR
  // WebSocket is refused and React never hydrates: every client component on
  // every page is dead (buttons, selects, the palette, the drawer) while plain
  // links still work. The terminal says so once ("Blocked cross-origin request
  // to Next.js dev resource /_next/hmr"). For another host, such as a LAN IP or a
  // forwarded hostname, set ALLOWED_DEV_ORIGINS=host1,host2 and restart `next dev`.
  allowedDevOrigins: [
    "127.0.0.1",
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((h) => h.trim())
      .filter(Boolean) ?? []),
  ],
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
