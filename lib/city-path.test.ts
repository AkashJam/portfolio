import { describe, expect, it } from "vitest";

import { CITY_H, CITY_W, cityAlt, cityGeometry, linearTicks, logTicks, seriesDate } from "@/lib/city-path";

const monthly = (start: string, values: number[]) => ({ start, step: 1, values });

describe("seriesDate", () => {
  it("labels a month and a quarter", () => {
    expect(seriesDate({ start: "1957-12", step: 1, values: [] }, 2)).toBe("1958-02");
    expect(seriesDate({ start: "1955-01", step: 3, values: [] }, 0)).toBe("1955-Q1");
    expect(seriesDate({ start: "1955-01", step: 3, values: [] }, 7)).toBe("1956-Q4");
  });
});

describe("ticks", () => {
  it("puts log ticks at 1, 2 and 5 times a power of ten", () => {
    expect(logTicks(3, 120)).toEqual([5, 10, 20, 50, 100]);
  });
  // Phase 18 step 5, M32: Tokyo's share index ran 93 to 186, which holds one 1-2-5 value (100),
  // so its axis read a single label.
  it("gives a short log range at least four round labels, found by finer steps", () => {
    expect(logTicks(93, 186)).toEqual([100, 120, 140, 160, 180]);
  });
  it("gives no ticks for a range a log axis cannot draw, rather than looping", () => {
    expect(logTicks(0, 10)).toEqual([]);
    expect(logTicks(-1, 10)).toEqual([]);
    expect(logTicks(5, 1)).toEqual([]);
    expect(logTicks(1, Infinity)).toEqual([]);
  });
  it("keeps the 1-2-5 ticks when a range holds four or more", () => {
    expect(logTicks(1, 10_000)).toEqual([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000]);
  });
  it("labels the ranges the city pages actually draw, inside the range, four or more", () => {
    // Share indices and rates as they run on the production pages (ranges, not values).
    for (const [lo, hi] of [[93, 186], [0.9, 1.6], [99, 101], [4, 7.5], [58, 110], [1.1, 1.3], [210, 480]] as const) {
      const ticks = logTicks(lo, hi);
      expect(ticks.length, `${lo} to ${hi}`).toBeGreaterThanOrEqual(4);
      for (const t of ticks) {
        expect(t).toBeGreaterThanOrEqual(lo);
        expect(t).toBeLessThanOrEqual(hi);
      }
    }
  });
  it("keeps a short log range logarithmic: its labels are placed by their logarithm", () => {
    const g = cityGeometry(monthly("2000-01", [93, 120, 186]), "log")!;
    const pct = g.yTicks.map((t) => t.pct);
    expect(g.yTicks.map((t) => t.label)).toEqual(["100", "120", "140", "160", "180"]);
    // Each step of 20 is a smaller share of the log axis the higher it goes: gaps shrink upward.
    const gaps = pct.slice(1).map((v, i) => pct[i] - v);
    expect(gaps[0]).toBeGreaterThan(gaps[gaps.length - 1]);
  });
  it("puts linear ticks on round values", () => {
    expect(linearTicks(0, 130)).toEqual([0, 50, 100]);
    expect(linearTicks(95, 125, 4)).toEqual([100, 110, 120]);
  });
});

describe("cityGeometry", () => {
  it("spans the box and finds the first, last, peak and trough", () => {
    const g = cityGeometry(monthly("2000-01", [10, 100, 1000, 100]), "log")!;
    expect(g.line.split(" ")[0].startsWith("0,")).toBe(true);
    expect(g.line.split(" ")[3].startsWith(`${CITY_W},`)).toBe(true);
    expect(g.peak).toEqual({ date: "2000-03", value: 1000 });
    expect(g.trough).toEqual({ date: "2000-01", value: 10 });
    expect(g.last.value).toBe(100);
  });

  it("draws equal ratios an equal distance apart on a log axis, and not on a linear one", () => {
    const ys = (s: "log" | "linear") =>
      cityGeometry(monthly("2000-01", [1, 10, 100]), s)!.line.split(" ").map((p) => Number(p.split(",")[1]));
    const log = ys("log");
    expect(log[0] - log[1]).toBeCloseTo(log[1] - log[2], 1);
    const lin = ys("linear");
    expect(Math.abs(lin[0] - lin[1] - (lin[1] - lin[2]))).toBeGreaterThan(50);
  });

  it("keeps every point inside the box", () => {
    const g = cityGeometry(monthly("2000-01", [3, 9, 1, 27, 2]), "log")!;
    for (const p of g.line.split(" ")) {
      const y = Number(p.split(",")[1]);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(CITY_H);
    }
  });

  it("refuses a log axis for a value that is not positive, and a single point", () => {
    expect(cityGeometry(monthly("2000-01", [1, 0, 2]), "log")).toBeNull();
    expect(cityGeometry(monthly("2000-01", [1, 0, 2]), "linear")).not.toBeNull();
    expect(cityGeometry(monthly("2000-01", [1]), "linear")).toBeNull();
  });

  it("ticks the years it covers, six at most", () => {
    const g = cityGeometry(monthly("1957-01", Array.from({ length: 830 }, (_, i) => 10 + i)), "linear")!;
    expect(g.xTicks.length).toBeLessThanOrEqual(7);
    expect(g.xTicks[0].pct).toBeGreaterThanOrEqual(0);
    expect(g.xTicks.every((t) => Number(t.label) % 10 === 0 || Number(t.label) % 20 === 0)).toBe(true);
  });
});

describe("cityAlt", () => {
  it("states the scale and the five figures", () => {
    const g = cityGeometry(monthly("2000-01", [10, 100, 1000, 100]), "log")!;
    const t = cityAlt("Japan's share index", "2015 = 100", g);
    expect(t).toContain("logarithmic");
    expect(t).toContain("peaks at 1000 in 2000-03");
    expect(t).toContain("ends at 100");
  });
});
