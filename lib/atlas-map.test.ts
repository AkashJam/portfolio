import { readFileSync } from "node:fs";
import { join } from "node:path";

import { mapSearch } from "@/lib/atlas-url";
import { describe, expect, it } from "vitest";

import {
  NO_FIGURE,
  RAMP,
  TILES,
  caveatKind,
  colourFor,
  contrast,
  digitsFor,
  exceptionsLine,
  formatMapChange,
  legendStops,
  limitFor,
  linkName,
  mapValue,
  parseAddress,
  schemeOf,
  switchMeasure,
  textColourFor,
  yearBounds,
  type MapView,
} from "@/lib/atlas-map";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

const W: MapView = { period: "window", year: 2024 };
const Y = (year: number): MapView => ({ period: "year", year });

const ch = (
  v2010: number | null,
  v2016: number | null = v2010,
  extra: Partial<WindowChange> = {},
): WindowChange => ({
  change:
    extra.reason === "euro" || extra.reason === "stale"
      ? null
      : { "2021": v2016, "2016": v2016, "2010": v2010 },
  years: null,
  source: "test",
  asOf: "2024",
  ...extra,
});
const lv = { value: 1, source: "test", asOf: "2024" };
const row = (
  slug: string,
  country: string,
  o: Partial<AtlasRow> = {},
): AtlasRow => ({
  slug,
  city: country,
  country,
  code: "XX",
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: ch(10),
  housing: ch(10),
  prices: ch(10),
  currency: ch(0),
  everydaySpendingEur: lv,
  gniPpp: lv,
  unemployment: lv,
  lifeExpectancy: lv,
  ...o,
});

const ITALY = row("italy", "Italy", {
  housing: ch(-26, -7),
  currency: ch(null, null, { reason: "euro" }),
});
const ISRAEL = row("israel", "Israel", {
  currency: ch(null, 13, { reason: "unpublished" }),
});
const CHILE = row("chile", "Chile", {
  currency: ch(-30, -24, { derived: "via USD" }),
});
const JAPAN = row("japan", "Japan", { currency: ch(-19) });

// The ramp's three colours are copies of tokens (see RAMP); this is what keeps them one source.
// Phase 19's token pass will move them, and this fails until the map moves with it.
describe("RAMP", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  const tokenHex = (name: string): string => {
    const m = css.match(new RegExp(`^\\s*${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`, "m"));
    if (!m) throw new Error(`${name} is not a hex token in globals.css`);
    return m[1].toLowerCase();
  };
  const hexOf = (rgb: readonly number[]) => `#${rgb.map((n) => n.toString(16).padStart(2, "0")).join("")}`;

  it.each(Object.values(RAMP))("$token in globals.css is the colour the map computes with", ({ token, rgb }) => {
    expect(tokenHex(token)).toBe(hexOf(rgb));
  });
});

describe("colourFor", () => {
  it("is the neutral at 0 and the full colour at the limit, either way", () => {
    expect(colourFor(0, 80)).toBe("#13171d");
    expect(colourFor(80, 80)).toBe("#26a69a");
    expect(colourFor(-80, 80)).toBe("#ef5350");
  });

  it("saturates beyond the limit instead of overshooting", () => {
    expect(colourFor(500, 80)).toBe("#26a69a");
    expect(colourFor(-500, 80)).toBe("#ef5350");
  });

  it("matches the mock's legend swatches to within a step", () => {
    // atlas-map.html's housing legend: #1a4e4d #1e6b66 #228880 at +20 +40 +60 of 80 is near these
    const near = (a: string, b: string) =>
      [1, 3, 5].every(
        (i) =>
          Math.abs(
            parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16),
          ) <= 12,
      );
    expect(near(colourFor(20, 80), "#1a4e4d")).toBe(true);
    expect(near(colourFor(40, 80), "#1e6b66")).toBe(true);
    expect(near(colourFor(60, 80), "#228880")).toBe(true);
    expect(near(colourFor(-20, 80), "#672e30")).toBe(true);
  });

  it("gets brighter the further from zero it is", () => {
    const g = (v: number) => parseInt(colourFor(v, 80).slice(3, 5), 16);
    expect(g(10)).toBeLessThan(g(30));
    expect(g(30)).toBeLessThan(g(70));
  });
});

describe("legendStops", () => {
  it("has nine stops from the strongest fall to the strongest rise, neutral in the middle", () => {
    const s = legendStops(80);
    expect(s).toHaveLength(9);
    expect(s[0]).toEqual({ value: -80, fill: "#ef5350" });
    expect(s[4]).toEqual({ value: 0, fill: "#13171d" });
    expect(s[8]).toEqual({ value: 80, fill: "#26a69a" });
  });
});

describe("limitFor", () => {
  it("takes the third-largest absolute change, rounded up to a tidy step", () => {
    // Real housing, 2010-24: Türkiye 125, Chile 108, Israel 91, then 64 ...
    expect(limitFor([125, 108, 91, 64, 61, 59, -26, -5])).toBe(100);
  });

  it("is driven by the biggest fall too", () => {
    expect(limitFor([-94, -60, -44, 10, 5])).toBe(50);
  });

  it("follows a window whose changes are small", () => {
    expect(limitFor([14, 9, 7, 3, -2, -4])).toBe(8);
  });

  it("falls back to the largest with fewer than three, and to 1 with none", () => {
    expect(limitFor([30, -12])).toBe(12.5);
    expect(limitFor([])).toBe(1);
    expect(limitFor([0, 0, 0])).toBe(1);
  });
});

describe("text on a fill", () => {
  it("clears 4.5:1 on every fill the ramp can produce, and on the no-figure grey", () => {
    for (const limit of [8, 50, 100]) {
      for (let v = -limit; v <= limit; v += limit / 40) {
        const fill = colourFor(v, limit);
        expect(
          contrast(fill, textColourFor(fill)),
          fill,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(
      contrast(NO_FIGURE, textColourFor(NO_FIGURE)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("TILES", () => {
  it("places twenty-three countries on twenty-three distinct cells inside an 8 by 6 grid", () => {
    const cells = Object.values(TILES);
    expect(cells).toHaveLength(23);
    expect(new Set(cells.map(([c, r]) => `${c},${r}`)).size).toBe(23);
    for (const [c, r] of cells) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(8);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(6);
    }
  });
});

describe("caveats", () => {
  it("reads each kind from the data, not from a country list", () => {
    expect(caveatKind(ITALY, "currency", W, "2010")).toBe("euro");
    expect(caveatKind(ISRAEL, "currency", W, "2010")).toBe("unpublished");
    expect(caveatKind(CHILE, "currency", W, "2010")).toBe("derived");
    expect(caveatKind(JAPAN, "currency", W, "2010")).toBeNull();
  });

  it("drops Israel's caveat on a window that has its rate", () => {
    expect(caveatKind(ISRAEL, "currency", W, "2016")).toBeNull();
  });

  it("has no caveat on housing", () => {
    for (const r of [ITALY, ISRAEL, CHILE, JAPAN])
      expect(caveatKind(r, "housing", W, "2010")).toBeNull();
  });
});

describe("linkName", () => {
  it("carries the figure, the measure and the window", () => {
    expect(linkName(ITALY, "housing", W, "2010", "2024", 0)).toBe(
      "Italy: −26%, house prices after inflation, change 2010–24",
    );
  });

  it("adds the caveat, and says no figure where there is none", () => {
    expect(linkName(ITALY, "currency", W, "2010", "2024", 0)).toBe(
      "Italy: no figure, currency against the euro, change 2010–24, euro area, no rate against itself",
    );
    expect(linkName(CHILE, "currency", W, "2010", "2024", 0)).toContain("−30%");
    expect(linkName(CHILE, "currency", W, "2010", "2024", 0)).toContain(
      "derived via the dollar",
    );
    expect(linkName(ISRAEL, "currency", W, "2010", "2024", 0)).toContain(
      "no 2010 rate",
    );
  });
});

describe("exceptionsLine", () => {
  const rows = [
    ITALY,
    ISRAEL,
    CHILE,
    JAPAN,
    row("france", "France", { currency: ch(null, null, { reason: "euro" }) }),
  ];

  it("is absent where nothing is an exception", () => {
    expect(exceptionsLine(rows, "housing", W, "2010")).toBeNull();
  });

  it("names the three kinds on currency over 2010–24, with Chile asterisked", () => {
    expect(exceptionsLine(rows, "currency", W, "2010")).toBe(
      "No figure: the euro area has no rate against itself; Israel has no 2010 rate. * Chile's figure is derived via the dollar.",
    );
  });

  it("names only the kinds present: Israel drops out on 2016–24", () => {
    const line = exceptionsLine(rows, "currency", W, "2016")!;
    expect(line).not.toContain("Israel");
    expect(line).toContain("euro area");
  });
});

// ---- step 6: views, years, the sequential ramp, the address ------------------

const yrs = (from: number, to: number, f: (y: number) => number) =>
  Object.fromEntries(
    Array.from({ length: to - from + 1 }, (_, i) => [
      String(from + i),
      f(from + i),
    ]),
  );

const JAPAN_Y = row("japan", "Japan", {
  shares: ch(193, 193, { years: yrs(2010, 2024, () => 5) }),
  housing: ch(19, 19, {
    years: yrs(2010, 2024, (y) => (y === 2022 ? 1.4 : 0.5)),
  }),
  prices: ch(14, 14, {
    years: yrs(2011, 2024, (y) => (y === 2022 ? 2.5 : 0.1)),
  }),
  currency: ch(-19, -19, { years: yrs(2010, 2024, () => -1) }),
});
const ISRAEL_Y = row("israel", "Israel", {
  currency: ch(null, 13, {
    reason: "unpublished",
    years: yrs(2011, 2024, () => 3),
  }),
});
const ITALY_Y = row("italy", "Italy", {
  currency: ch(null, null, { reason: "euro", years: null }),
  housing: ch(-26, -7, {
    years: yrs(2010, 2024, (y) => (y === 2022 ? -3 : 1)),
  }),
});
const YROWS = [JAPAN_Y, ISRAEL_Y, ITALY_Y];

describe("mapValue", () => {
  it("reads the window's change, or one year's", () => {
    expect(mapValue(JAPAN_Y, "housing", W, "2010")).toBe(19);
    expect(mapValue(JAPAN_Y, "housing", Y(2022), "2010")).toBe(1.4);
  });

  it("ignores the window when a year is chosen", () => {
    expect(mapValue(JAPAN_Y, "housing", Y(2022), "2021")).toBe(1.4);
  });

  it("has no figure for a year the series lacks, or for the euro area", () => {
    expect(mapValue(ISRAEL_Y, "currency", Y(2010), "2010")).toBeNull();
    expect(mapValue(ISRAEL_Y, "currency", Y(2011), "2010")).toBe(3);
    expect(mapValue(ITALY_Y, "currency", Y(2022), "2010")).toBeNull();
  });
});

describe("yearBounds", () => {
  it("is the measure's own first and last year: prices start in 2011", () => {
    expect(yearBounds(YROWS, "housing")).toEqual({ first: 2010, last: 2024 });
    expect(yearBounds(YROWS, "prices")).toEqual({ first: 2011, last: 2024 });
  });

  it("keeps the shared range for Israel's currency: the others still start in 2010", () => {
    expect(yearBounds(YROWS, "currency")).toEqual({ first: 2010, last: 2024 });
  });
});

describe("caveats in a year view", () => {
  it("names the year Israel has no rate for, and not the others", () => {
    expect(caveatKind(ISRAEL_Y, "currency", Y(2010), "2010")).toBe(
      "unpublished",
    );
    expect(linkName(ISRAEL_Y, "currency", Y(2010), "2010", "2024", 0)).toBe(
      "Israel: no figure, currency against the euro, change during 2010, no 2010 rate",
    );
    expect(caveatKind(ISRAEL_Y, "currency", Y(2011), "2010")).toBeNull();
  });

  it("reads a year in the link name", () => {
    expect(linkName(JAPAN_Y, "housing", Y(2022), "2010", "2024", 1)).toBe(
      "Japan: +1.4%, house prices after inflation, change during 2022",
    );
  });

  it("keeps the euro area an exception in every year, and Israel's only in 2010", () => {
    expect(exceptionsLine(YROWS, "currency", Y(2010), "2010")).toBe(
      "No figure: the euro area has no rate against itself; Israel has no 2010 rate.",
    );
    expect(exceptionsLine(YROWS, "currency", Y(2015), "2010")).toBe(
      "No figure: the euro area has no rate against itself.",
    );
  });
});

describe("the sequential ramp (prices)", () => {
  it("is one hue from the mock's low end to its high end, linearly", () => {
    expect(colourFor(0, 10, "sequential")).toBe("#23283d");
    expect(colourFor(10, 10, "sequential")).toBe("#818cf8");
    // the mock's middle swatch is #525a9a; rounding the half-step may land one up
    expect(["#525a9a", "#525a9b"]).toContain(colourFor(5, 10, "sequential"));
  });

  it("clamps a fall to the low end and a big rise to the high end", () => {
    expect(colourFor(-3, 10, "sequential")).toBe("#23283d");
    expect(colourFor(900, 10, "sequential")).toBe("#818cf8");
  });

  it("has nine stops running low to high, and only prices use it", () => {
    const s = legendStops(10, "sequential");
    expect(s).toHaveLength(9);
    expect(s[0].value).toBe(0);
    expect(s[8].value).toBe(10);
    expect(schemeOf("prices")).toBe("sequential");
    for (const m of ["housing", "shares", "currency"] as const)
      expect(schemeOf(m)).toBe("diverging");
  });
});

describe("figures", () => {
  it("shows one decimal when the view's limit is small, whole numbers otherwise", () => {
    expect(digitsFor(7)).toBe(1);
    expect(digitsFor(19.9)).toBe(1);
    expect(digitsFor(20)).toBe(0);
    expect(formatMapChange(6.64, 1)).toBe("+6.6%");
    expect(formatMapChange(-20.04, 1)).toBe("\u221220.0%");
    expect(formatMapChange(-0.02, 1)).toBe("0.0%");
    expect(formatMapChange(125.4, 0)).toBe("+125%");
  });
});

describe("the address", () => {
  it("omits the defaults: housing over the whole window is an empty search", () => {
    expect(
      mapSearch("", { measure: "housing", period: "window", year: 2024 }),
    ).toBe("");
    expect(
      mapSearch("", { measure: "currency", period: "window", year: 2024 }),
    ).toBe("?measure=currency");
    expect(
      mapSearch("", { measure: "housing", period: "year", year: 2022 }),
    ).toBe("?year=2022");
    expect(
      mapSearch("", { measure: "prices", period: "year", year: 2022 }),
    ).toBe("?measure=prices&year=2022");
  });

  it("round-trips every state it writes", () => {
    for (const measure of [
      "housing",
      "shares",
      "prices",
      "currency",
    ] as const) {
      for (const state of [
        {
          measure,
          period: "window" as const,
          year: yearBounds(YROWS, measure).last,
        },
        { measure, period: "year" as const, year: 2022 },
      ]) {
        expect(parseAddress(mapSearch("", state), YROWS)).toEqual(state);
      }
    }
  });

  it("opens a year the measure lacks on its first year, in one-year mode", () => {
    const s = parseAddress("?measure=prices&year=2010", YROWS);
    expect(s).toEqual({ measure: "prices", period: "year", year: 2011 });
    // and the caller rewrites the address to name it
    expect(mapSearch("", s)).toBe("?measure=prices&year=2011");
  });

  it("treats a year after the last the same way", () => {
    expect(parseAddress("?year=2031", YROWS)).toEqual({
      measure: "housing",
      period: "year",
      year: 2010,
    });
  });

  it("falls back to housing for an unreadable measure and to the whole window for an unreadable year", () => {
    expect(parseAddress("?measure=gold&year=abc", YROWS)).toEqual({
      measure: "housing",
      period: "window",
      year: 2024,
    });
  });
});

describe("switchMeasure", () => {
  const base = {
    measure: "housing" as const,
    period: "year" as const,
    year: 2010,
  };

  it("keeps the year when the new measure has it", () => {
    expect(switchMeasure({ ...base, year: 2015 }, "currency", YROWS).year).toBe(
      2015,
    );
  });

  it("moves to prices' first year from 2010 (#103)", () => {
    expect(switchMeasure(base, "prices", YROWS)).toEqual({
      measure: "prices",
      period: "year",
      year: 2011,
    });
  });
});
