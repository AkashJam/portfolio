import { allBlogs, allProjects } from "content-collections";
import { NextResponse } from "next/server";

import { getAtlasCities, getSensors } from "@/lib/ticker-client";
import { buildPaletteIndex } from "@/lib/palette-index";

// Fetched client-side by CommandPalette when it first opens, not from
// app/layout.tsx — a root-layout fetch would force every page (including the static
// Home and About) into dynamic, server-rendered-on-demand mode just to feed the ⌘K
// groups. Isolating it to its own route keeps that dynamism scoped to exactly this
// one endpoint (portfolio.md §15 Phase C). It is the palette's one index (Phase 19
// step 4, M24): the four case studies and the posts with their tags as search
// keywords, the eighteen companies (the ticker's sensors, in its fixed order; a
// country sensor reads "Japan · Mitsubishi UFJ", a global one its theme) and the
// cities with a page. Each company links to its own page, never to a ledger anchor.
const isDev = process.env.NODE_ENV !== "production";

export async function GET() {
  const [sensors, atlas] = await Promise.all([
    getSensors({ revalidateSeconds: 300 }),
    getAtlasCities({ revalidateSeconds: 3600 }),
  ]);

  return NextResponse.json(
    buildPaletteIndex({
      projects: allProjects.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags, draft: p.draft })),
      posts: allBlogs.map((p) => ({ path: p._meta.path, date: p.date, title: p.title, tags: p.tags, draft: p.draft })),
      sensors,
      atlasRows: atlas?.rows ?? null,
      includeDrafts: isDev,
    }),
  );
}
