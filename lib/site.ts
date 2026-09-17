/**
 * The site's own canonical origin — the single source for `metadataBase`
 * (app/layout.tsx), app/sitemap.ts and app/robots.ts (portfolio.md §5, §13).
 * A localhost default so a build that never received the var advertises dev
 * rather than quietly advertising the production origin.
 *
 * `||` not `??`: portfolio/Dockerfile declares `ARG NEXT_PUBLIC_SITE_URL` with
 * no default, so an image built without `--build-arg` inlines an *empty
 * string*, not `undefined` — Next's inliner keeps any value that is not null.
 * `??` would pass `""` straight through and `new URL("")` would kill the build.
 *
 * The trailing-slash strip is for sitemap.ts and robots.ts, which concatenate
 * paths onto this value directly; one stray slash in the env var would emit a
 * whole sitemap of "https://akjames.dev//about". `metadataBase` does not need
 * it — Next normalises duplicate slashes between it and relative fields.
 *
 * Kept as a literal `process.env.X` reference: Next only inlines static
 * lookups, so destructuring or an indexed read here would silently break the
 * build-time substitution this whole file depends on.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");
