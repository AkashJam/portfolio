import type { Metadata } from "next";

import { Container } from "@/components/shell/Container";
import { JumpBar } from "@/components/atlas/JumpBar";
import {
  AtlasWindowProvider,
  WindowHint,
} from "@/components/atlas/AtlasWindow";
import { AtlasHomeProvider, HomePicker } from "@/components/atlas/AtlasHome";
import { AtlasExplorer } from "@/components/atlas/AtlasExplorer";
import { WorldMap } from "@/components/atlas/WorldMap";
import { CountriesTable } from "@/components/atlas/CountriesTable";
import { cityPageLine, sensorLine } from "@/lib/atlas-absences";
import { TierOne } from "@/components/atlas/TierOne";
import { MEASURES } from "@/lib/atlas-plot";
import { count } from "@/lib/atlas-provenance";
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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function AtlasPage() {
  const atlas = await getAtlasCities({
    revalidateSeconds: ATLAS_REVALIDATE_SECONDS,
  });

  const sections = (
    <>
      <section id="compare">
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

      {atlas && atlas.rows.length > 0 ? (
        <WorldMap rows={atlas.rows} />
      ) : (
        <section id="map">
          <h2 className="mb-4 text-lg font-medium">Where and when</h2>
          <p className="text-sm text-text-muted">
            Atlas data is temporarily unavailable.
          </p>
        </section>
      )}

      <section id="countries">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Countries</h2>
          {atlas && <WindowHint />}
        </div>
        {atlas && atlas.rows.length > 0 ? (
          <>
            <TierOne />
            <CountriesTable rows={atlas.rows} />
            <div className="mt-4 max-w-[78ch] space-y-2 text-[13px] leading-relaxed text-text-muted">
              <p>
                <b className="font-medium text-read">
                  Market answers a different question about the same countries.
                </b>{" "}
                {sensorLine(atlas.rows)}
              </p>
              <p>{cityPageLine(atlas.rows)}</p>
            </div>
          </>
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
      <header>
        <h1 className="text-4xl font-light">Atlas</h1>
        <p className="mt-3 max-w-[66ch] text-[16.5px] leading-relaxed text-read">
          {atlas ? `${cap(count(atlas.rows.length))} countries` : "Countries"},
          each labelled by a city, {count(MEASURES.length)} measures. What
          living standards look like for the median person: what their savings,
          their housing and their prices have done, what they earn, how long
          they live, from sources that publish their methodology. Nothing here
          is ranked and nothing is scored; put two measures on the axes and read
          it yourself.
        </p>
        <p className="mt-3.5 max-w-[66ch] border-t border-hairline pt-3.5 font-mono text-[12.5px] leading-relaxed text-text-muted">
          Every figure carries its source and the year it describes, one click
          away in the column header. Measures that could not clear that bar for
          all {atlas ? count(atlas.rows.length) : "the"} countries were left out
          rather than shown with an empty cell; the euro-area currency cells are
          blank by design, because the euro has no rate against itself.
        </p>
      </header>

      <JumpBar />

      {atlas ? (
        <AtlasWindowProvider windows={atlas.windows} end={atlas.end}>
          <AtlasHomeProvider rows={atlas.rows} rates={atlas.rates}>
            <HomePicker />
            {sections}
          </AtlasHomeProvider>
        </AtlasWindowProvider>
      ) : (
        sections
      )}
    </Container>
  );
}
