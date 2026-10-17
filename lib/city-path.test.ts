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
