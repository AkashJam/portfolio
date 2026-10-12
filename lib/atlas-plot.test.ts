import { describe, expect, it } from "vitest";

import { PLOT, buildDomain, buildPlot, niceTicks, showsDiagonal, splitClipped } from "@/lib/atlas-plot";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

const change = (v: number | null): WindowChange => ({
  change: v === null ? null : { "2021": v, "2016": v, "2010": v },
  years: null,
  reason: v === null ? "euro" : undefined,
  source: "test",
  asOf: "2024",
});
const sourced = (value: number | null) => ({ value, source: "test", asOf: "2024", ...(value === null ? { reason: "n/a" } : {}) });

function row(slug: string, o: { shares?: number | null; prices?: number | null; spending?: number | null; housing?: number }): AtlasRow {
  return {
    slug,
    city: slug,
    country: slug,
    code: "XX",
    sensor: null,
    hasCityPage: false,
    region: "europe",
    shares: change(o.shares === undefined ? 50 : o.shares),
    housing: change(o.housing ?? 10),
    prices: change(o.prices === undefined ? 30 : o.prices),
    currency: change(0),
    everydaySpendingEur: sourced(o.spending === undefined ? 1000 : o.spending),
    gniPpp: sourced(1),
    unemployment: sourced(1),
    lifeExpectancy: sourced(80),
  };
}

describe("splitClipped (the 2x rule)", () => {
  it("clips Türkiye's shares, 4.7x the next, and keeps the rest", () => {
    expect(splitClipped([1725, 365, 292, 218, 210, 193])).toEqual({ kept: [365, 292, 218, 210, 193], clipped: [1725] });
  });

  it("clips Türkiye's prices against Mumbai's", () => {
    expect(splitClipped([1223, 128, 123, 103]).clipped).toEqual([1223]);
  });

  it("clips nothing when no value is more than twice the next", () => {
    expect(splitClipped([4505, 2967, 2567, 2491]).clipped).toEqual([]);
  });

  it("does not clip a value exactly twice the next", () => {
    expect(splitClipped([200, 100, 90]).clipped).toEqual([]);
  });

  it("clips more than one when each is over twice the next", () => {
    expect(splitClipped([1000, 300, 100, 90, 80]).clipped).toEqual([1000, 300]);
  });

  it("always leaves at least three values on the axis", () => {
    expect(splitClipped([1000, 300, 100]).clipped).toEqual([]);
    expect(splitClipped([1000, 300, 100, 90]).clipped).toEqual([1000]);
  });

  it("never treats a fall as an outlier: negative and zero next values stop the walk", () => {
    expect(splitClipped([5, 0, -40]).clipped).toEqual([]);
    expect(splitClipped([5, -1]).clipped).toEqual([]);
  });
});

describe("buildDomain", () => {
  it("tops the axis just above the first value that stays", () => {
    const d = buildDomain([1725, 365, 292, 100]);
    expect(d.clipped).toEqual([1725]);
    expect(d.max).toBeGreaterThanOrEqual(365);
    expect(d.max).toBeLessThan(500);
  });

  it("keeps zero on a level axis that starts near it, but not on a tight band", () => {
    expect(buildDomain([113, 2967, 4505]).min).toBe(0);
    expect(buildDomain([66.3, 80, 84.1]).min).toBeGreaterThan(50);
  });

  it("includes the negative side of a change axis", () => {
    expect(buildDomain([-30, 10, 120]).min).toBeLessThanOrEqual(-30);
  });
});

describe("niceTicks", () => {
  it("steps by 1, 2, 2.5 or 5 times a power of ten and covers the range", () => {
    const t = niceTicks(-26, 128);
    expect(t[0]).toBeLessThanOrEqual(-26);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(128);
    const step = t[1] - t[0];
    expect([1, 2, 2.5, 5].some((m) => Math.abs(Math.log10(step / m) % 1) < 1e-9 || Number.isInteger(Math.log10(step / m)))).toBe(true);
  });
});

describe("buildPlot", () => {
  const rows = [
    row("a", { shares: 1725, prices: 30, spending: 100 }),
    row("b", { shares: 300, prices: 40, spending: 2000 }),
    row("c", { shares: 250, prices: 60, spending: 4000 }),
    row("d", { shares: 100, prices: 50, spending: 2500 }),
    row("e", { shares: null, prices: 20, spending: 3000 }),
  ];

  it("skips rows with no figure on either axis and says how many", () => {
    const m = buildPlot(rows, "prices", "shares", "2010");
    expect(m.points.map((p) => p.slug)).toEqual(["a", "b", "c", "d"]);
    expect(m.skipped).toBe(1);
  });

  it("draws a clipped point on the axis edge and records its true value", () => {
    const m = buildPlot(rows, "prices", "shares", "2010");
    const a = m.points.find((p) => p.slug === "a")!;
    expect(a.cy).toBe(PLOT.top);
    expect(a.clip).toEqual([{ axis: "y", value: 1725 }]);
    expect(a.label?.text).toContain("1,725%");
    expect(m.points.find((p) => p.slug === "b")!.clip).toBeNull();
  });

  it("reports every axis a point is clipped on, in the label", () => {
    const both = [row("t", { shares: 1725, prices: 1223 }), row("u", { shares: 300, prices: 120 }), row("v", { shares: 250, prices: 100 }), row("w", { shares: 100, prices: 60 })];
    const t = buildPlot(both, "prices", "shares", "2010").points.find((p) => p.slug === "t")!;
    expect(t.clip?.map((c) => c.axis)).toEqual(["x", "y"]);
    expect(t.label?.text).toBe("t \u25b8 +1,223% \u00b7 +1,725%");
  });

  it("keeps every point inside the plot area", () => {
    for (const p of buildPlot(rows, "everydaySpendingEur", "shares", "2010").points) {
      expect(p.cx).toBeGreaterThanOrEqual(PLOT.left);
      expect(p.cx).toBeLessThanOrEqual(PLOT.right);
      expect(p.cy).toBeGreaterThanOrEqual(PLOT.top);
      expect(p.cy).toBeLessThanOrEqual(PLOT.bottom);
    }
  });

  it("draws y = x only for prices against shares", () => {
    expect(showsDiagonal("prices", "shares")).toBe(true);
    expect(showsDiagonal("shares", "prices")).toBe(false);
    expect(showsDiagonal("everydaySpendingEur", "housing")).toBe(false);
    expect(buildPlot(rows, "prices", "shares", "2010").diagonal).not.toBeNull();
    expect(buildPlot(rows, "everydaySpendingEur", "shares", "2010").diagonal).toBeNull();
  });

  it("puts the y = x line at 45 degrees in data space: equal values meet the diagonal", () => {
    const m = buildPlot([row("a", { prices: 50, shares: 50 }), row("b", { prices: 100, shares: 20 })], "prices", "shares", "2010");
    const a = m.points[0];
    const d = m.diagonal!;
    const t = (a.cx - d.x1) / (d.x2 - d.x1);
    expect(d.y1 + t * (d.y2 - d.y1)).toBeCloseTo(a.cy, 5);
  });

  it("leaves a label off a point that would sit on another point's dot", () => {
    const crowded = [row("a", { spending: 1000, housing: 10 }), row("b", { spending: 1005, housing: 10 }), row("c", { spending: 4000, housing: 90 })];
    const m = buildPlot(crowded, "everydaySpendingEur", "housing", "2010");
    const labelled = m.points.filter((p) => p.label).length;
    expect(labelled).toBeLessThan(m.points.length);
    expect(m.points.find((p) => p.slug === "c")!.label).not.toBeNull();
  });
});
