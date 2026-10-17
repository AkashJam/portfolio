import { describe, expect, it } from "vitest";

import {
  computedLine,
  convertRows,
  deltaUnit,
  homeDelta,
  homeMoney,
  homeReading,
  isEuroArea,
  noRateLine,
  parseHash,
  rateLine,
  writeHash,
} from "@/lib/atlas-home";
import type { AtlasRow, DisplayRate } from "@/lib/market-schemas";

const ch = (v: number) => ({ change: { "2021": v, "2016": v, "2010": v }, years: null, source: "OECD", asOf: "2024" });
const lv = (value: number | null) => ({ value, source: "WB", asOf: "2025" });
const row = (slug: string, o: Partial<AtlasRow> = {}): AtlasRow => ({
  slug,
  city: slug[0].toUpperCase() + slug.slice(1),
  country: slug,
  code: "XX",
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: ch(100),
  housing: ch(30),
  prices: ch(20),
  currency: ch(-10),
  everydaySpendingEur: lv(1000),
  gniPpp: lv(50000),
  unemployment: lv(5),
  lifeExpectancy: lv(80),
  ...o,
});

const JPY: DisplayRate = { currency: "JPY", perEur: 170, year: 2025, source: "ECB" };

describe("the address", () => {
  it("reads a row, a home, and both", () => {
    expect(parseHash("#italy")).toEqual({ target: "italy", home: null });
    expect(parseHash("#home=japan")).toEqual({ target: null, home: "japan" });
    expect(parseHash("#italy&home=japan")).toEqual({ target: "italy", home: "japan" });
    expect(parseHash("")).toEqual({ target: null, home: null });
  });
  it("never reads home= as a row", () => {
    expect(parseHash("#home=japan").target).toBeNull();
  });
  it("writes the same thing back, and clears when both are empty", () => {
    expect(writeHash({ target: "italy", home: "japan" })).toBe("#italy&home=japan");
    expect(writeHash({ target: null, home: "japan" })).toBe("#home=japan");
    expect(writeHash({ target: "italy", home: null })).toBe("#italy");
    expect(writeHash({ target: null, home: null })).toBe("");
  });
});

describe("display currency", () => {
  it("converts a euro figure at the one rate", () => {
    expect(homeMoney(1381, JPY)).toBe("¥234,770");
  });
  it("re-expresses only everyday spending", () => {
    const [r] = convertRows([row("japan")], JPY);
    expect(r.everydaySpendingEur.value).toBe(170000);
    expect(r.gniPpp.value).toBe(50000);
    expect(convertRows([row("japan")], null)[0].everydaySpendingEur.value).toBe(1000);
  });
  it("states the rate, its source year and that it is one rate", () => {
    expect(rateLine(JPY)).toBe("Shown in Japanese Yen at ¥170.00 per € — ECB reference rate, 2025 average. Every € figure in the table and on the axis uses this one rate.");
  });
  it("says why a home with no rate stays in euros", () => {
    const chile = row("chile", { country: "Chile", currency: { ...ch(0), derived: "via USD" } });
    expect(noRateLine(chile)).toContain("Shown in euros");
    expect(noRateLine(chile)).toContain("via USD");
  });
  it("recognises the euro area", () => {
    expect(isEuroArea(row("italy", { currency: { change: null, years: null, reason: "euro", source: "ECB", asOf: "2024-12" } }))).toBe(true);
    expect(isEuroArea(row("japan"))).toBe(false);
  });
});

describe("homeDelta", () => {
  const home = row("italy", { shares: ch(70), housing: ch(-26), everydaySpendingEur: lv(1839), unemployment: lv(6.4), lifeExpectancy: lv(84) });
  const tokyo = row("japan", { shares: ch(193), housing: ch(19), everydaySpendingEur: lv(1381), unemployment: lv(2.5), lifeExpectancy: lv(84.1) });
  it("gives points for a change and signs it", () => {
    expect(homeDelta(tokyo, home, "shares", "2010")).toBe("+123");
    expect(homeDelta(tokyo, home, "housing", "2010")).toBe("+45");
    expect(homeDelta(home, tokyo, "housing", "2010")).toBe("−45");
  });
  it("gives a ratio for a level, points for unemployment and years for life expectancy", () => {
    expect(homeDelta(tokyo, home, "everydaySpendingEur", "2010")).toBe("×0.75");
    expect(homeDelta(tokyo, home, "unemployment", "2010")).toBe("−3.9");
    expect(homeDelta(tokyo, home, "lifeExpectancy", "2010")).toBe("+0.1");
  });
  it("has none for the home itself, for currency, or for a missing figure", () => {
    expect(homeDelta(home, home, "shares", "2010")).toBeNull();
    expect(homeDelta(tokyo, home, "currency", "2010")).toBeNull();
    expect(homeDelta(row("x", { everydaySpendingEur: lv(null) }), home, "everydaySpendingEur", "2010")).toBeNull();
    expect(homeDelta(tokyo, row("y", { everydaySpendingEur: lv(0) }), "everydaySpendingEur", "2010")).toBeNull();
  });
  it("states each column's unit", () => {
    expect(deltaUnit("shares")).toBe("Δ in points");
    expect(deltaUnit("gniPpp")).toBe("Δ as ×");
    expect(deltaUnit("lifeExpectancy")).toBe("Δ in years");
    expect(deltaUnit("currency")).toBe("no Δ");
  });
  it("names both legs in the popover's computed line", () => {
    expect(computedLine("housing", home, "2010", "2024", null)).toContain("this row − Italy's, in percentage points over the same window (2010–24)");
    expect(computedLine("everydaySpendingEur", home, "2010", "2024", JPY)).toContain("euros × 170.00, the ECB's 2025 average");
    expect(computedLine("currency", home, "2010", "2024", null)).toContain("stays against the euro");
  });
});

describe("homeReading", () => {
  const home = row("italy", { everydaySpendingEur: lv(1839), housing: ch(-26), lifeExpectancy: lv(84) });
  const ny = row("newyork", { city: "New York", country: "United States", everydaySpendingEur: lv(4505), housing: ch(59), lifeExpectancy: lv(78.9), unemployment: lv(4.2) });
  it("compares the published figures with the home's, each with its line", () => {
    const r = homeReading(ny, home, "2010", (v) => `€${v}`)!;
    expect(r.title).toBe("New York against Italy");
    expect(r.figs[0]).toMatchObject({ value: "€4505", label: "United States, spend/mo · ×2.45 Italy" });
    expect(r.figs.map((f) => f.label)).toContain("United States, housing, real · +85 Italy");
    expect(r.sentence).toContain("Italy stands at €1839, −26% housing, 84.0 years.");
  });
  it("is null against itself", () => {
    expect(homeReading(home, home, "2010", String)).toBeNull();
  });
});
