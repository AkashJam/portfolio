// Temporary — verifies Sentry end-to-end (error capture + source-map
// upload) on the real deployed site. Delete this whole directory once
// confirmed in the Sentry dashboard.
//
// force-dynamic: without it, `next build` tries to statically prerender
// this page and the throw below fails the *build* instead of only firing
// on request.
export const dynamic = "force-dynamic";

export default function DebugSentryPage() {
  throw new Error("Sentry verification test — safe to ignore/resolve");
}
