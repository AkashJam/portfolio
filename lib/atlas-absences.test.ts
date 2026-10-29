import { describe, expect, it } from "vitest";

import { cityCountLine, cityHref } from "@/lib/atlas-absences";
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

describe("city pages (I59)", () => {
  it("counts the rows with a page, from the data", () => {
    expect(cityCountLine(REAL)).toBe("0 of 23 countries have a city page.");
    const some = [row("japan", { hasCityPage: true }), row("italy"), row("peru")];
    expect(cityCountLine(some)).toBe("1 of 3 countries have a city page.");
  });

  it("links a name only where its page exists", () => {
    expect(cityHref(row("japan", { hasCityPage: true }))).toBe("/atlas/japan");
    expect(cityHref(row("italy"))).toBeNull();
  });
});
