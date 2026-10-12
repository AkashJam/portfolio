import type { Metadata } from "next";

import { Container } from "@/components/shell/Container";
import {
  AtlasWindowProvider,
  WindowHint,
} from "@/components/atlas/AtlasWindow";
import { AtlasExplorer } from "@/components/atlas/AtlasExplorer";
import { CountriesTable } from "@/components/atlas/CountriesTable";
import { getAtlasCities } from "@/lib/ticker-client";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/atlas",
  title: "Atlas — Akash James",
  description:
    "Living standards compared across twenty-three countries, each labelled by a city: change over time, with the source and as-of year on every figure.",
});

// The data refreshes daily to yearly (§8), so an hour is a staleness ceiling,
// not a freshness mechanism. Passing it keeps the page static/ISR.
const ATLAS_REVALIDATE_SECONDS = 3600;

export default async function AtlasPage() {
  const atlas = await getAtlasCities({
    revalidateSeconds: ATLAS_REVALIDATE_SECONDS,
  });

  const sections = (
    <>
      <section id="compare" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Compare</h2>
          <span className="text-sm text-text-muted">
            any two of the eight measures
          </span>
        </div>
        {atlas && atlas.rows.length > 0 ? (
          <AtlasExplorer rows={atlas.rows} />
        ) : (
          <p className="text-sm text-text-muted">
            Atlas data is temporarily unavailable.
          </p>
        )}
      </section>

      <section id="countries" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Countries</h2>
          {atlas && <WindowHint />}
        </div>
        {atlas && atlas.rows.length > 0 ? (
          <CountriesTable rows={atlas.rows} />
        ) : (
          <p className="text-sm text-text-muted">
            Atlas data is temporarily unavailable.
          </p>
        )}
      </section>
    </>
  );

  return (
    <Container className="space-y-10 py-16">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
          Atlas
        </p>
        <h1 className="mt-1 text-4xl font-light">Living standards, compared</h1>
      </div>

      {atlas ? (
        <AtlasWindowProvider windows={atlas.windows} end={atlas.end}>
          {sections}
        </AtlasWindowProvider>
      ) : (
        sections
      )}
    </Container>
  );
}
