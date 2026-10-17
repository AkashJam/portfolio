import { describe, expect, it } from "vitest";

import { affordView } from "@/lib/city-afford";
import type { Affordability } from "@/lib/market-schemas";

const tokyo: Affordability = {
  ratio: 56.1,
  measure: "floor",
  cost: { eur: 774.48, priceYear: 2026, basis: "survey", rateYear: 2025 },
  spending: { value: 1381, unit: "EUR/person/month", source: "World Bank NE.CON.PRVT.CD", asOf: "2024" },
  gapYears: 2,
  direction: "cost-newer",
  inflation: { value: 3.2, unit: "%", source: "World Bank FP.CPI.TOTL.ZG", asOf: "2025" },
};

describe("affordView", () => {
  it("states the ratio and both legs with their years", () => {
    const v = affordView(tokyo, "Japan", "Tokyo");
    expect(v.ratio).toBe("56.1%");
    expect(v.sentence).toBe("The cost of living is 56.1% of what a typical person in Japan spends.");
    expect(v.costLine).toBe("€774.48 a month, the survey's own figure in 2026 prices, converted at the ECB's 2025 average");
    expect(v.spendingLine).toBe("€1,381 a month per person · World Bank NE.CON.PRVT.CD · 2024");
    expect(v.gap).toBe("The legs are 2 years apart: the cost is in 2026 prices, the spending is 2024's.");
    expect(v.caveat).toBeNull();
  });

  it("says both legs share a year when they do, and names a carried figure", () => {
    const v = affordView({ ...tokyo, ratio: 97.2, gapYears: 0, direction: "same", cost: { eur: 1900.9, priceYear: 2025, basis: "carried", rateYear: 0 } }, "France", "Dijon");
    expect(v.gap).toBe("Both legs are in 2025.");
    expect(v.costLine).toBe("€1,900.90 a month, the survey's figure carried to 2025 prices");
  });

  it("words an average survey as average against average", () => {
    const v = affordView({ ...tokyo, ratio: 138.1, measure: "average" }, "China", "Shanghai");
    expect(v.sentence).toBe("The average spend here is 138.1% of the national average per person in China.");
    expect(v.costLabel).toBe("Average spend, Shanghai");
    expect(v.spendingLabel).toBe("National average spend, China");
  });

  it("passes the caveat through and states a missing leg without a ratio", () => {
    expect(affordView({ ...tokyo, caveat: "Türkiye's prices rose 34.9% in 2025." }, "Türkiye", "Ankara").caveat).toBe("Türkiye's prices rose 34.9% in 2025.");
    const v = affordView({ ...tokyo, ratio: null, gapYears: 0, reason: "the country's everyday spending is unpublished" }, "Japan", "Tokyo");
    expect(v.ratio).toBeNull();
    expect(v.sentence).toBe("No ratio can be drawn.");
    expect(v.gap).toBe("");
    expect(v.reason).toBe("the country's everyday spending is unpublished");
  });

  it("uses the singular for a one-year gap", () => {
    expect(affordView({ ...tokyo, gapYears: 1 }, "Japan", "Tokyo").gap).toContain("1 year apart");
  });
});
