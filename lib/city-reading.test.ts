import { describe, expect, it } from "vitest";

import { changeReading, currencyReading, housingReading, shareReading } from "@/lib/city-reading";
import type { ChangeBlock } from "@/lib/market-schemas";

// A series of `n` monthly values ending in the given month.
const monthly = (start: string, values: number[]) => ({ start, step: 1, values });

describe("shareReading", () => {
  const upTo = (last: number) => monthly("2026-08", [100, last]);

  it("uses the closed ladder for a multiple of the base", () => {
    expect(shareReading(upTo(234), "EUR", true)).toBe("At 234 in September 2026, more than double its 2015 level, in euros and before inflation.");
    expect(shareReading(upTo(263), "JPY", false)).toBe(
      "At 263 in September 2026, more than two and a half times its 2015 level, in yen and before inflation. The chart below shows what the yen was worth in euros.",
    );
    expect(shareReading(upTo(1825), "TRY", false)).toContain("more than 18 times");
    expect(shareReading(upTo(350), "USD", false)).toContain("more than three times");
  });

  it("says above, below or level for a modest move", () => {
    expect(shareReading(upTo(127), "EUR", true)).toContain("27% above its 2015 level");
    expect(shareReading(upTo(80), "EUR", true)).toContain("20% below its 2015 level");
    expect(shareReading(upTo(100), "EUR", true)).toContain("level with its 2015 level");
  });
});

describe("currencyReading", () => {
  it("compares with the record: close to, still under, far below", () => {
    // April 2026 is the record (186); September (180) is within 5%.
    const s = monthly("2026-04", [186, 183, 181, 179, 178, 180]);
    expect(currencyReading(s, "JPY")).toBe("180 yen to the euro in September 2026, close to April's record of 186. A rising line is a weaker yen.");
    expect(currencyReading(monthly("2026-04", [186, 150]), "JPY")).toContain("still under April's record of 186");
    expect(currencyReading(monthly("2026-04", [186, 120]), "JPY")).toContain("far below April's record of 186");
  });

  it("names the year when the record is from an earlier one, and says when the latest is the record", () => {
    expect(currencyReading(monthly("2025-04", [186, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 180]), "JPY")).toContain(
      "close to the April 2025 record of 186",
    );
    expect(currencyReading(monthly("2026-08", [150, 190]), "JPY")).toContain("its weakest on record");
  });

  it("falls back to the code for a currency it has no name for", () => {
    expect(currencyReading(monthly("2026-08", [10, 9]), "XYZ")).toContain("9 XYZ to the euro");
  });
});

describe("housingReading", () => {
  it("reads against 2010 and the peak, and adds the lag when the series ends early", () => {
    // Quarterly, peak in 1991-Q1, now 121.
    const s = { start: "1991-01", step: 3, values: [180, 150, 130, 121] };
    expect(housingReading(s, "2025-Q4", 0)).toBe("21% above 2010, and far below the 1991 peak.");
    expect(housingReading(s, "2025-Q4", 3)).toBe(
      "21% above 2010, and far below the 1991 peak. This series ends at 2025-Q4, a quarter behind the other countries.",
    );
    expect(housingReading(s, "2025-Q3", 6)).toContain("2 quarters behind");
  });

  it("uses still under and close to for a shallower gap, and at its peak for the top", () => {
    expect(housingReading({ start: "2007-01", step: 3, values: [105, 90, 76] }, "2025-Q4", 0)).toBe("24% below 2010, and still under the 2007 peak.");
    expect(housingReading({ start: "2007-01", step: 3, values: [105, 90, 102] }, "2025-Q4", 0)).toContain("close to the 2007 peak");
    expect(housingReading({ start: "2007-01", step: 3, values: [90, 120] }, "2025-Q4", 0)).toBe("20% above 2010, and at its peak.");
  });
});

describe("changeReading", () => {
  const block = (survey: number, prices: number, spending: number): ChangeBlock => ({
    baseYear: 2014,
    endYear: 2025,
    survey: [],
    prices: [],
    spending: [],
    rises: { survey, prices, spending },
    note: "",
    surveySource: null,
    pricesSource: "",
    spendingSource: "",
  });

  it("matches Milan's: in step with prices, spending more", () => {
    expect(changeReading(block(22.6, 22.7, 34.5), "Milan", "Italy", "Poverty line")).toBe(
      "Milan's poverty line rose 23% from 2014 to 2025, in step with prices, while what a person in Italy spends on average rose 35%.",
    );
  });

  it("says faster or slower beyond two points, and fell for a fall", () => {
    expect(changeReading(block(30, 22, 10), "X", "Y", "Living wage")).toContain("rose 30% from 2014 to 2025, faster than prices");
    expect(changeReading(block(10, 22, 10), "X", "Y", "Living wage")).toContain("slower than prices");
    expect(changeReading(block(-3, 1, -4), "X", "Y", "Living wage")).toBe(
      "X's living wage fell 3% from 2014 to 2025, slower than prices, while what a person in Y spends on average fell 4%.",
    );
  });
});
