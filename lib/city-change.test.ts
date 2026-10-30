import { describe, expect, it } from "vitest";

import { changeGeometry, kindShort } from "@/lib/city-change";
import type { ChangeBlock } from "@/lib/market-schemas";

const pts = (base: number, values: number[]) => values.map((index, i) => ({ year: base + i, index }));

// Italy's 2014–25, rounded: poverty line and prices end near 123, spending at 134.
const milan: ChangeBlock = {
  baseYear: 2014,
  endYear: 2025,
  survey: pts(2014, [100, 99.5, 100, 101.2, 102.1, 102.5, 102.2, 103.7, 114.6, 118.7, 119.5, 122.6]),
  prices: pts(2014, [100, 100.1, 99.8, 101.3, 102.5, 103.3, 103.1, 105.5, 114.4, 119.1, 122.1, 122.7]),
  spending: pts(2014, [100, 105.1, 109.3, 114.9, 120.6, 124.4, 100.9, 117.9, 143, 155.6, 160.2, 134.5]),
  rises: { survey: 22.6, prices: 22.7, spending: 34.5 },
  note: "",
  surveySource: null,
  pricesSource: "",
  spendingSource: "",
};

describe("changeGeometry", () => {
  const g = changeGeometry(milan, "Poverty line", "Milan", "Italy");

  it("names the spending line as the national figure where the survey is itself average spending", () => {
    const a = changeGeometry(milan, "Average spending", "Shanghai", "China", true);
    expect(a.ends.find((e) => e.key === "spending")?.name).toBe("National");
    expect(a.alt).toContain("China's prices and national household spending per person");
    expect(g.ends.find((e) => e.key === "spending")?.name).toBe("Spending");
  });

  it("draws three lines with a point a year, all from the same left edge", () => {
    for (const k of ["survey", "prices", "spending"] as const) {
      const p = g.lines[k].split(" ");
      expect(p).toHaveLength(12);
      expect(p[0].startsWith("44,")).toBe(true);
      expect(p[11].startsWith("700,")).toBe(true);
    }
    // 100 is the same height for all three on the first point.
    const firsts = new Set(["survey", "prices", "spending"].map((k) => g.lines[k as "survey"].split(" ")[0]));
    expect(firsts.size).toBe(1);
  });

  it("marks 100 as the base and gives round tick values on both sides of the data", () => {
    expect(g.yTicks.filter((t) => t.base)).toHaveLength(1);
    const labels = g.yTicks.map((t) => Number(t.label));
    expect(labels).toContain(100);
    expect(Math.min(...labels)).toBeLessThanOrEqual(100);
    expect(Math.max(...labels)).toBeGreaterThanOrEqual(160);
  });

  it("labels every second year and the last, dropping the one that would crowd it", () => {
    expect(g.xTicks.map((t) => t.label)).toEqual(["2014", "2016", "2018", "2020", "2022", "2025"]);
    const canada = { ...milan, baseYear: 2020, endYear: 2025, survey: pts(2020, [100, 103, 110, 114, 116, 118]), prices: pts(2020, [100, 103, 111, 115, 118, 120]), spending: pts(2020, [100, 110, 120, 125, 130, 131]) };
    expect(changeGeometry(canada, "Poverty line", "Toronto", "Canada").xTicks.map((t) => t.label)).toEqual(["2020", "2022", "2025"]);
  });

  it("ends each line with its rise, and keeps the labels apart", () => {
    expect(g.ends.map((e) => e.rise)).toEqual(expect.arrayContaining(["+23%", "+35%"]));
    for (let i = 1; i < g.ends.length; i++) expect(g.ends[i].labelY - g.ends[i - 1].labelY).toBeGreaterThanOrEqual(32);
    // The two lines that end together do not draw their labels on top of one another.
    const names = g.ends.map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(["Poverty line", "Prices", "Spending"]));
  });

  it("names every line's end in the text alternative", () => {
    expect(g.alt).toBe(
      "Milan's poverty line, Italy's prices and average spending per person, each 100 in 2014, to 2025: the poverty line ends at 123, prices at 123, spending at 135",
    );
  });
});

describe("kindShort", () => {
  it("shortens the long labels and falls back to the label for a new kind", () => {
    expect(kindShort("benefit_or_reference_budget", "Benefit standard or reference budget")).toBe("Benefit standard");
    expect(kindShort("something_new", "Something new")).toBe("Something new");
  });
});
