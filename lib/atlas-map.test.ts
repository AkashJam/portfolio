import { describe, expect, it } from "vitest";

import {
  NO_FIGURE,
  TILES,
  caveatKind,
  colourFor,
  contrast,
  exceptionsLine,
  legendStops,
  limitFor,
  linkName,
  textColourFor,
} from "@/lib/atlas-map";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

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
    expect(limitFor([14, 9, 7, 3, -2, -4])).toBe(7);
  });

  it("falls back to the largest with fewer than three, and to 1 with none", () => {
    expect(limitFor([30, -12])).toBe(12);
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
    expect(caveatKind(ITALY, "currency", "2010")).toBe("euro");
    expect(caveatKind(ISRAEL, "currency", "2010")).toBe("unpublished");
    expect(caveatKind(CHILE, "currency", "2010")).toBe("derived");
    expect(caveatKind(JAPAN, "currency", "2010")).toBeNull();
  });

  it("drops Israel's caveat on a window that has its rate", () => {
    expect(caveatKind(ISRAEL, "currency", "2016")).toBeNull();
  });

  it("has no caveat on housing", () => {
    for (const r of [ITALY, ISRAEL, CHILE, JAPAN])
      expect(caveatKind(r, "housing", "2010")).toBeNull();
  });
});

describe("linkName", () => {
  it("carries the figure, the measure and the window", () => {
    expect(linkName(ITALY, "housing", "2010", "2024")).toBe(
      "Italy: −26%, house prices after inflation, change 2010–24",
    );
  });

  it("adds the caveat, and says no figure where there is none", () => {
    expect(linkName(ITALY, "currency", "2010", "2024")).toBe(
      "Italy: no figure, currency against the euro, change 2010–24, euro area, no rate against itself",
    );
    expect(linkName(CHILE, "currency", "2010", "2024")).toContain("−30%");
    expect(linkName(CHILE, "currency", "2010", "2024")).toContain(
      "derived via the dollar",
    );
    expect(linkName(ISRAEL, "currency", "2010", "2024")).toContain(
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
    expect(exceptionsLine(rows, "housing", "2010")).toBeNull();
  });

  it("names the three kinds on currency over 2010–24, with Chile asterisked", () => {
    expect(exceptionsLine(rows, "currency", "2010")).toBe(
      "No figure: the euro area has no rate against itself; Israel has no 2010 rate. * Chile's figure is derived via the dollar.",
    );
  });

  it("names only the kinds present: Israel drops out on 2016–24", () => {
    const line = exceptionsLine(rows, "currency", "2016")!;
    expect(line).not.toContain("Israel");
    expect(line).toContain("euro area");
  });
});
