// Projects the world shapes once and writes data/atlas-map.json, the static
// file the /atlas map draws from (Phase 11 step 5). Run by hand when the shapes
// need to change; the site build never regenerates it.
//
//   npm run build:atlas-map
//
// Source: Natural Earth 110m admin-0 countries, via the `world-atlas` package
// (ISC; Natural Earth data is public domain). Projection: Natural Earth I,
// fitted to 900 x 440, Antarctica left out. Coordinates are rounded to whole
// numbers, which at this size costs nothing visible and keeps the file small.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const world = require("world-atlas/countries-110m.json");

const WIDTH = 900;
const HEIGHT = 440;

// The twenty-three atlas countries: alpha-2 (the API's `code`) to the ISO 3166
// numeric id world-atlas keys its features by.
const ATLAS = {
  AU: "036", BR: "076", CA: "124", CL: "152", CN: "156", FR: "250", DE: "276",
  IN: "356", ID: "360", IE: "372", IL: "376", IT: "380", JP: "392", KR: "410",
  MX: "484", NL: "528", NZ: "554", NO: "578", PL: "616", ZA: "710", TR: "792",
  GB: "826", US: "840",
};
const ANTARCTICA = "010";

const all = feature(world, world.objects.countries).features.filter((f) => f.id !== ANTARCTICA);

const projection = geoNaturalEarth1().fitExtent(
  [[0, 0], [WIDTH, HEIGHT]],
  { type: "FeatureCollection", features: all },
);
const path = geoPath(projection).digits(0);

const byId = new Map(all.map((f) => [f.id, f]));
const countries = {};
for (const [code, id] of Object.entries(ATLAS)) {
  const f = byId.get(id);
  if (!f) throw new Error(`world-atlas has no feature for ${code} (${id})`);
  const d = path(f);
  if (!d) throw new Error(`no path for ${code}`);
  countries[code] = d;
}

const atlasIds = new Set(Object.values(ATLAS));
const outline = all
  .filter((f) => !atlasIds.has(f.id))
  .map((f) => path(f))
  .filter(Boolean)
  .join("");

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../data/atlas-map.json");
mkdirSync(dirname(out), { recursive: true });
const json = JSON.stringify({ viewBox: [WIDTH, HEIGHT], outline, countries });
writeFileSync(out, json + "\n");

console.log(
  `atlas-map.json: ${Object.keys(countries).length} countries, outline ${outline.length} chars, ` +
    `${(json.length / 1024).toFixed(1)} KB`,
);
