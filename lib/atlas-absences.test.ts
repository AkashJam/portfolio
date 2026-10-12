import { describe, expect, it } from "vitest";

import {
  anyCityPage,
  cityHref,
  cityPageLine,
  noCityPageNote,
  sensorLine,
} from "@/lib/atlas-absences";
import type { AtlasRow } from "@/lib/market-schemas";

const ch = {
  change: { "2021": 1, "2016": 1, "2010": 1 },
  years: null,
  source: "t",
  asOf: "2024",
};
const lv = { value: 1, source: "t", asOf: "2025" };
const row = (slug: string, o: Partial<AtlasRow> = {}): AtlasRow => ({
  slug,
  city: slug,
  country: slug,
  code: "XX",
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: ch,
  housing: ch,
  prices: ch,
  currency: ch,
  everydaySpendingEur: lv,
  gniPpp: lv,
  unemployment: lv,
  lifeExpectancy: lv,
  ...o,
});

// The real split on 2026-10-12: eleven rows carry a sensor, twelve do not.
const REAL = [
  ...Array.from({ length: 11 }, (_, i) => row(`s${i}`, { sensor: `S${i}` })),
  ...Array.from({ length: 12 }, (_, i) => row(`n${i}`)),
];

describe("sensorLine", () => {
  it("counts the rows from the data, in words", () => {
    expect(sensorLine(REAL)).toBe(
      "Eleven of these rows name a US-listed bank or telecom as their market sensor; the other twelve have none. The name is text, not a link: this page shows no market figure, so it never depends on a market feed.",
    );
  });

  it("follows the data when the split changes", () => {
    expect(sensorLine(REAL.slice(0, 20))).toContain("Eleven of these rows");
    expect(sensorLine(REAL.slice(0, 20))).toContain("the other nine have none");
  });

  it("handles none and all", () => {
    expect(sensorLine([row("a"), row("b")])).toMatch(
      /^No row names a market sensor\./,
    );
    expect(sensorLine([row("a", { sensor: "X" })])).toMatch(/^Every row names/);
  });

  it("makes no promise about a later release", () => {
    expect(sensorLine(REAL)).not.toMatch(
      /\b(later|soon|will|planned|release|phase)\b/i,
    );
  });
});

describe("city pages (#101)", () => {
  it("says no city has a page, once, while none does", () => {
    expect(anyCityPage(REAL)).toBe(false);
    expect(cityPageLine(REAL)).toBe(
      "No city has a page yet, so no name is a link.",
    );
    for (const r of REAL) expect(noCityPageNote(r, REAL)).toBeNull();
  });

  it("links a name only where its page exists", () => {
    expect(cityHref(row("japan", { hasCityPage: true }))).toBe("/atlas/japan");
    expect(cityHref(row("italy"))).toBeNull();
  });

  it("once one city has a page, each row without one says so", () => {
    const some = [row("japan", { hasCityPage: true }), row("italy")];
    expect(anyCityPage(some)).toBe(true);
    expect(cityPageLine(some)).toContain("the rest say no city page yet");
    expect(noCityPageNote(some[0], some)).toBeNull();
    expect(noCityPageNote(some[1], some)).toBe("no city page yet");
  });
});
