import type { Metadata } from "next";

import { Container } from "@/components/shell/Container";
import { AtlasViews } from "@/components/atlas/AtlasViews";
import { AtlasRules } from "@/components/atlas/AtlasRules";
import {
  AtlasWindowProvider,
  WindowHint,
} from "@/components/atlas/AtlasWindow";
import { AtlasHomeProvider, HomePicker } from "@/components/atlas/AtlasHome";
import { AtlasExplorer } from "@/components/atlas/AtlasExplorer";
import { WorldMap } from "@/components/atlas/WorldMap";
import { CountriesTable } from "@/components/atlas/CountriesTable";
import { cityPageLine, sensorLine } from "@/lib/atlas-absences";
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

  const ok = atlas && atlas.rows.length > 0;
  const unavailable = (
    <p className="text-small text-text-muted">Atlas data is temporarily unavailable.</p>
  );

  const views = (
    <AtlasViews
      bar={atlas ? <HomePicker /> : undefined}
      panels={{
        compare: (
          <>
            <h2 className="sr-only">Compare</h2>
            {ok ? <AtlasExplorer rows={atlas.rows} /> : unavailable}
          </>
        ),
        map: ok ? <WorldMap rows={atlas.rows} /> : unavailable,
        countries: (
          <>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lead font-medium">Countries</h2>
              {atlas && <WindowHint />}
            </div>
            {ok ? (
              <>
                <CountriesTable rows={atlas.rows} />
                <div className="mt-4 max-w-measure space-y-2 text-small leading-relaxed text-text-muted">
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
              unavailable
            )}
          </>
        ),
      }}
    />
  );

  const content = (
    <>
      {views}
      {ok && <AtlasRules rows={atlas.rows} />}
    </>
  );

  return (
    <Container className="space-y-10 py-16">
      <header>
        <h1 className="text-h1 font-light">Atlas</h1>
        <p className="mt-4 max-w-measure text-lead text-text">
          Fifteen years, country by country.
        </p>
        <p className="mt-2.5 max-w-measure text-body leading-relaxed text-read">
          {ok ? atlas.rows.length : "Twenty-three"} countries, each shown by one
          of its cities; every figure is national, from a source that publishes
          its method.
        </p>
      </header>

      {atlas ? (
        <AtlasWindowProvider windows={atlas.windows} end={atlas.end}>
          <AtlasHomeProvider rows={atlas.rows} rates={atlas.rates}>
            {content}
          </AtlasHomeProvider>
        </AtlasWindowProvider>
      ) : (
        content
      )}
    </Container>
  );
}
