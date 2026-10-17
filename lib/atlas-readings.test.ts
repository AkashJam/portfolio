import { describe, expect, it } from "vitest";

import { CHIPS, buildReading, generatedReading } from "@/lib/atlas-readings";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

// Fixtures carry the real 2010-24 figures the mocks quote (atlas.html and
// atlas-presets.html): Milan -26 / New York +59 on housing, Tuerkiye +1725
// shares against +1223 prices, Tokyo +193 shares against a yen at -19.

const ch = (
  v2010: number | null,
  v2016: number | null = v2010,
  reason?: "euro",
): WindowChange => ({
  change:
    v2010 === null && reason === "euro"
      ? null
      : { "2021": v2016, "2016": v2016, "2010": v2010 },
  years: null,
  reason,
  source: "test",
  asOf: "2024",
});
const lv = (value: number | null) => ({
  value,
  source: "test",
  asOf: "2024",
  ...(value === null ? { reason: "n/a" } : {}),
});

interface O {
  slug: string;
  city: string;
  country: string;
  shares?: WindowChange;
  housing?: WindowChange;
  prices?: WindowChange;
  currency?: WindowChange;
  spend?: number | null;
  life?: number | null;
}
const row = (o: O): AtlasRow => ({
  slug: o.slug,
  city: o.city,
  country: o.country,
  code: "XX",
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: o.shares ?? ch(10),
  housing: o.housing ?? ch(10),
  prices: o.prices ?? ch(10),
  currency: o.currency ?? ch(0),
  everydaySpendingEur: lv(o.spend === undefined ? 1000 : o.spend),
  gniPpp: lv(1),
  unemployment: lv(1),
  lifeExpectancy: lv(o.life === undefined ? 80 : o.life),
});

const ROWS: AtlasRow[] = [
  row({
    slug: "italy",
    city: "Milan",
    country: "Italy",
    shares: ch(70),
    housing: ch(-26, -7),
    prices: ch(30),
    currency: ch(null, null, "euro"),
    spend: 1839,
    life: 84.2,
  }),
  row({
    slug: "united-states",
    city: "New York",
    country: "United States",
    shares: ch(170),
    housing: ch(59, 36),
    prices: ch(44),
    spend: 4505,
    life: 78.9,
  }),
  row({
    slug: "india",
    city: "Mumbai",
    country: "India",
    shares: ch(364),
    housing: ch(64, -1),
    prices: ch(128),
    spend: 113,
    life: 72.2,
  }),
  row({
    slug: "turkiye",
    city: "Ankara",
    country: "Türkiye",
    shares: ch(1725),
    housing: ch(125),
    prices: ch(1223),
    currency: ch(-94),
    spend: 750,
    life: 77.4,
  }),
  row({
    slug: "japan",
    city: "Tokyo",
    country: "Japan",
    shares: ch(193),
    housing: ch(19),
    prices: ch(14),
    currency: ch(-19),
    spend: 1381,
    life: 84,
  }),
  row({
    slug: "brazil",
    city: "São Paulo",
    country: "Brazil",
    shares: ch(81),
    prices: ch(123),
  }),
  row({
    slug: "china",
    city: "Shanghai",
    country: "China",
    shares: ch(7),
    prices: ch(33),
  }),
  row({
    slug: "mexico",
    city: "Mexico City",
    country: "Mexico",
    shares: ch(58),
    prices: ch(84),
  }),
];

const chip = (id: string) => CHIPS.find((c) => c.id === id)!;
const read = (
  id: string,
  rows = ROWS,
  win: "2010" | "2016" | "2021" = "2010",
) => {
  const c = chip(id);
  return buildReading(c.id, rows, c.x, c.y, win);
};

describe("the five chips", () => {
  it("has five chips, each with two distinct axes", () => {
    expect(CHIPS).toHaveLength(5);
    for (const c of CHIPS) expect(c.x).not.toBe(c.y);
  });

  it("1 · spending × housing: Milan against New York", () => {
    const r = read("spend-housing");
    expect(r.title).toBe("Milan against New York");
    expect(r.figs.map((f) => f.value)).toEqual([
      "€1,839",
      "−26%",
      "€4,505",
      "+59%",
    ]);
    expect(r.sentence).toContain("New York spends more than Milan");
    expect(r.sentence).toContain(
      "housing fell in Italy and rose in the United States",
    );
  });

  it("2 · shares × housing: Mumbai against Milan", () => {
    const r = read("shares-housing");
    expect(r.title).toBe("Mumbai against Milan");
    expect(r.sentence).toContain(
      "Shares rose in both; housing rose in India and fell in Italy.",
    );
  });

  it("3 · prices × shares: both above the line, the flip, and who is below", () => {
    const r = read("prices-shares");
    expect(r.title).toBe("Ankara against Tokyo");
    expect(r.sentence).toContain("Both sit above the line.");
    expect(r.sentence).toContain("Türkiye's index is up +38%");
    expect(r.sentence).toContain("Japan's up +157%");
    expect(r.sentence).toContain(
      "the larger rise on the page is the smaller one after inflation",
    );
    expect(r.sentence).toContain(
      "Below the line: São Paulo, Shanghai and Mexico City.",
    );
  });

  it("4 · spending × life expectancy: spending higher in one, life in the other", () => {
    const r = read("spend-life");
    expect(r.title).toBe("Tokyo against New York");
    expect(r.sentence).toContain(
      "Spending is higher in the United States and life expectancy is higher in Japan.",
    );
  });

  it("5 · shares × currency: what a euro holder kept, with the flip", () => {
    const r = read("shares-currency");
    expect(r.title).toBe("Tokyo against Ankara");
    expect(r.sentence).toContain("+137% in Japan");
    expect(r.sentence).toContain(
      "in Türkiye, so the larger local rise became the smaller one in euro",
    );
    expect(r.sentence).toContain("never as a column");
  });
});

describe("a reading asserts only what holds", () => {
  it("drops the flip clause when the order does not reverse", () => {
    const rows = ROWS.map((r) =>
      r.slug === "japan" ? { ...r, prices: ch(2000) } : r,
    );
    const r = read("prices-shares", rows);
    expect(r.sentence).not.toContain("larger rise");
    expect(r.sentence).toContain(
      "Türkiye sits above the line and Japan below.",
    );
    expect(r.sentence).toContain("Japan's down 86%");
  });

  it("flips the wording with the sign", () => {
    const rows = ROWS.map((r) =>
      r.slug === "united-states" ? { ...r, housing: ch(-12) } : r,
    );
    expect(read("spend-housing", rows).sentence).toContain(
      "housing fell in Italy and fell in the United States",
    );
  });

  it("says unchanged for a figure that displays as 0%", () => {
    const rows = ROWS.map((r) =>
      r.slug === "italy" ? { ...r, housing: ch(0.3) } : r,
    );
    expect(read("spend-housing", rows).sentence).toContain(
      "housing was unchanged in Italy",
    );
  });

  it("recomputes for the window and keeps the chip's question", () => {
    const r = read("shares-housing", ROWS, "2016");
    expect(r.figs[1].value).toBe("−1%");
    expect(r.sentence).toContain("housing fell in both");
  });

  it("falls back to the generated line when a needed figure is missing", () => {
    const rows = ROWS.map((r) =>
      r.slug === "japan" ? { ...r, currency: ch(null, null, "euro") } : r,
    );
    const r = read("shares-currency", rows);
    expect(r.sentence).toContain("is highest on shares");
    expect(r.sentence).not.toContain("euro holder");
  });

  it("falls back when a named country is absent", () => {
    const rows = ROWS.filter((r) => r.slug !== "italy");
    expect(read("spend-housing", rows).sentence).toContain(
      "is highest on everyday spending",
    );
  });

  it("never uses a word of size", () => {
    const size =
      /\b(nearly|almost|about|roughly|sharply|slightly|huge|massive|times|double|triple)\b/i;
    for (const c of CHIPS) expect(read(c.id).sentence).not.toMatch(size);
    expect(
      generatedReading(ROWS, "everydaySpendingEur", "housing", "2010").sentence,
    ).not.toMatch(size);
  });
});

describe("generatedReading", () => {
  it("names the highest and lowest on the horizontal axis with both figures", () => {
    const r = generatedReading(ROWS, "everydaySpendingEur", "housing", "2010");
    expect(r.title).toBe("New York against Mumbai");
    expect(r.figs.map((f) => f.value)).toEqual([
      "€4,505",
      "+59%",
      "€113",
      "+64%",
    ]);
    expect(r.sentence).toBe(
      "New York is highest on everyday spending and Mumbai lowest; on housing they stand at +59% and +64%.",
    );
  });

  it("says so plainly when fewer than two countries have both figures", () => {
    const one = [ROWS[0]];
    expect(generatedReading(one, "shares", "housing", "2010").figs).toEqual([]);
  });
});
