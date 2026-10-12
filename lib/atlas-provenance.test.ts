import { describe, expect, it } from "vitest";

import {
  COLUMN_FACTS,
  columnInfo,
  olderSlugs,
  seriesMatches,
  vintageLine,
  vintageOf,
} from "@/lib/atlas-provenance";
import type { ColumnKey } from "@/lib/atlas";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

// Fixtures carry the real strings and as-ofs `/atlas/cities` served on 2026-10-12.

const COUNTRIES: [string, string, string][] = [
  ["australia", "Australia", "AU"],
  ["brazil", "Brazil", "BR"],
  ["canada", "Canada", "CA"],
  ["chile", "Chile", "CL"],
  ["china", "China", "CN"],
  ["france", "France", "FR"],
  ["germany", "Germany", "DE"],
  ["india", "India", "IN"],
  ["indonesia", "Indonesia", "ID"],
  ["ireland", "Ireland", "IE"],
  ["israel", "Israel", "IL"],
  ["italy", "Italy", "IT"],
  ["japan", "Japan", "JP"],
  ["korea", "Korea", "KR"],
  ["mexico", "Mexico", "MX"],
  ["netherlands", "Netherlands", "NL"],
  ["new-zealand", "New Zealand", "NZ"],
  ["norway", "Norway", "NO"],
  ["poland", "Poland", "PL"],
  ["south-africa", "South Africa", "ZA"],
  ["turkiye", "Türkiye", "TR"],
  ["united-kingdom", "United Kingdom", "GB"],
  ["united-states", "United States", "US"],
];
const OLDER_SPENDING = new Set([
  "china",
  "japan",
  "new-zealand",
  "united-states",
]);

const change = (source: string, asOf: string): WindowChange => ({
  change: { "2021": 1, "2016": 1, "2010": 1 },
  years: null,
  source,
  asOf,
});
const level = (source: string, asOf: string) => ({ value: 1, source, asOf });

const rows: AtlasRow[] = COUNTRIES.map(([slug, country, code]) => ({
  slug,
  country,
  code,
  city: country,
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: change(`OECD via FRED SPASTT01${code}M661N`, "2024-12"),
  housing: change(`BIS via FRED Q${code}R628BIS`, "2024-Q4"),
  prices: change("World Bank FP.CPI.TOTL, annual average", "2024"),
  currency: change(
    code === "CL"
      ? "OECD via FRED CCUSMA02CLM618N × ECB USD per EUR"
      : "ECB euro foreign exchange reference rates",
    "2024-12",
  ),
  everydaySpendingEur: level(
    "World Bank NE.CON.PRVT.CD ÷ SP.POP.TOTL, ECB annual average",
    OLDER_SPENDING.has(slug) ? "2024" : "2025",
  ),
  gniPpp: level("World Bank NY.GNP.PCAP.PP.CD", "2025"),
  unemployment: level("World Bank SL.UEM.TOTL.ZS", "2025"),
  lifeExpectancy: level("World Bank SP.DYN.LE00.IN", "2024"),
}));

const KEYS = Object.keys(COLUMN_FACTS) as ColumnKey[];

describe("the static series facts", () => {
  it("match the source string of every row, in every column", () => {
    for (const key of KEYS)
      for (const r of rows)
        expect(seriesMatches(key, r[key].source), `${key} ${r.slug}`).toBe(
          true,
        );
  });

  it("do not match another column's source", () => {
    expect(seriesMatches("shares", rows[0].housing.source)).toBe(false);
    expect(seriesMatches("unemployment", rows[0].lifeExpectancy.source)).toBe(
      false,
    );
  });

  it("assert no base year the repo does not record", () => {
    for (const key of ["shares", "housing", "prices"] as const)
      expect(COLUMN_FACTS[key].base).toContain("own base year");
    expect(JSON.stringify(COLUMN_FACTS)).not.toMatch(/20\d\d\s*=\s*100/);
  });
});

describe("vintage", () => {
  it("is the as-of most countries share, with the older ones named", () => {
    const v = vintageOf(rows, "everydaySpendingEur");
    expect(v.modal).toBe("2025");
    expect(v.count).toBe(19);
    expect(v.older).toHaveLength(1);
    expect(v.older[0].asOf).toBe("2024");
    expect(v.older[0].rows.map((r) => r.slug)).toEqual([
      "china",
      "japan",
      "new-zealand",
      "united-states",
    ]);
  });

  it("has no exceptions in a uniform column, and no amber slugs", () => {
    expect(vintageOf(rows, "shares").older).toEqual([]);
    expect(olderSlugs(rows, "shares").size).toBe(0);
  });

  it("gives the amber dot to exactly the four spending cells and to no other column", () => {
    expect([...olderSlugs(rows, "everydaySpendingEur")].sort()).toEqual([
      "china",
      "japan",
      "new-zealand",
      "united-states",
    ]);
    for (const key of KEYS.filter((k) => k !== "everydaySpendingEur"))
      expect(olderSlugs(rows, key).size, key).toBe(0);
  });

  it("writes the split in words, with the countries named", () => {
    expect(
      vintageLine(vintageOf(rows, "everydaySpendingEur"), rows.length),
    ).toBe(
      "2025 for nineteen countries; 2024 for China, Japan, New Zealand and the United States",
    );
    expect(vintageLine(vintageOf(rows, "shares"), rows.length)).toBe(
      "2024-12, for all twenty-three countries",
    );
  });

  it("compares quarterly and monthly as-ofs as text, so an older quarter is older", () => {
    const mixed = rows.map((r, i) =>
      i === 0 ? { ...r, housing: { ...r.housing, asOf: "2024-Q3" } } : r,
    );
    expect(olderSlugs(mixed, "housing")).toEqual(new Set(["australia"]));
  });
});

describe("columnInfo", () => {
  it("lists source, series, base, cadence, window and vintage for a change measure", () => {
    const info = columnInfo("shares", rows, "2010", "2024");
    expect(info.rows.map((r) => r.label)).toEqual([
      "Source",
      "Series",
      "Base",
      "Cadence",
      "Window",
      "Vintage",
    ]);
    expect(info.rows[1].value).toBe("SPASTT01<CC>M661N");
    expect(info.note).toContain("before inflation");
  });

  it("follows the shared window", () => {
    expect(
      columnInfo("shares", rows, "2010", "2024").rows.find(
        (r) => r.label === "Window",
      )?.value,
    ).toContain("January 2010 to December 2024 (2010–24)");
    expect(
      columnInfo("shares", rows, "2016", "2024").rows.find(
        (r) => r.label === "Window",
      )?.value,
    ).toContain("January 2016");
    expect(
      columnInfo("housing", rows, "2021", "2024").rows.find(
        (r) => r.label === "Window",
      )?.value,
    ).toContain("Q1 2021 to Q4 2024");
  });

  it("has no window or base for a level measure, and names the four older cells for spending", () => {
    const info = columnInfo("everydaySpendingEur", rows, "2010", "2024");
    expect(info.rows.map((r) => r.label)).toEqual([
      "Source",
      "Series",
      "Cadence",
      "Vintage",
    ]);
    expect(info.rows.at(-1)?.value).toContain(
      "2024 for China, Japan, New Zealand and the United States",
    );
  });
});
