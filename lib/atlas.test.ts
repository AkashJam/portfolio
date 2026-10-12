import { describe, expect, it } from "vitest";

import { columnValue, formatChange, gapLabel, sortRows } from "@/lib/atlas";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

const change = (v: number | null, reason?: WindowChange["reason"]): WindowChange => ({
  change: v === null && reason === "euro" ? null : { "2021": v, "2016": v, "2010": v },
  years: null,
  reason,
  source: "test",
  asOf: "2024",
});

const sourced = (value: number | null) => ({
  value,
  source: "test",
  asOf: "2024",
  ...(value === null ? { reason: "n/a" } : {}),
});

function row(slug: string, currency: WindowChange, spending: number | null): AtlasRow {
  return {
    slug,
    city: slug,
    country: slug,
    code: "XX",
    sensor: null,
    hasCityPage: false,
    region: "europe",
    shares: change(1),
    housing: change(1),
    prices: change(1),
    currency,
    everydaySpendingEur: sourced(spending),
    gniPpp: sourced(1),
    unemployment: sourced(1),
    lifeExpectancy: sourced(1),
  };
}

describe("sortRows", () => {
  const rows = [
    row("a", change(10), 300),
    row("b", change(null, "euro"), null),
    row("c", change(-5), 100),
    row("d", change(null, "unpublished"), 200),
  ];

  it("sorts a level column ascending and descending", () => {
    expect(sortRows(rows, "everydaySpendingEur", "asc", "2010").map((r) => r.slug)).toEqual(["c", "d", "a", "b"]);
    expect(sortRows(rows, "everydaySpendingEur", "desc", "2010").map((r) => r.slug)).toEqual(["a", "d", "c", "b"]);
  });

  it("puts gaps last in both directions, for whole-measure and per-window nulls alike", () => {
    expect(sortRows(rows, "currency", "asc", "2010").map((r) => r.slug)).toEqual(["c", "a", "b", "d"]);
    expect(sortRows(rows, "currency", "desc", "2010").map((r) => r.slug)).toEqual(["a", "c", "b", "d"]);
  });

  it("does not mutate its input", () => {
    const before = rows.map((r) => r.slug);
    sortRows(rows, "currency", "asc", "2010");
    expect(rows.map((r) => r.slug)).toEqual(before);
  });
});

describe("columnValue", () => {
  it("reads the chosen window of a change measure", () => {
    const r = row("a", { ...change(1), change: { "2021": 1, "2016": 2, "2010": 3 } }, 1);
    expect(columnValue(r, "currency", "2016")).toBe(2);
  });
});

describe("formatChange", () => {
  it("shows a sign and a real minus", () => {
    expect(formatChange(364.4)).toBe("+364%");
    expect(formatChange(-25.6)).toBe("−26%");
    expect(formatChange(1725)).toBe("+1,725%");
  });

  it("reads a change that rounds to nothing as 0%, never +0% or −0%", () => {
    expect(formatChange(0.2)).toBe("0%");
    expect(formatChange(-0.4)).toBe("0%");
  });
});

describe("gapLabel", () => {
  it("names the window for an unpublished start", () => {
    expect(gapLabel("unpublished", "2010")).toBe("no 2010 rate");
    expect(gapLabel("euro", "2010")).toBe("euro");
  });
});
