import { describe, expect, it } from "vitest";

import { costChain, euro, money, sentence } from "@/lib/city-cost";
import type { CityResponse } from "@/lib/market-schemas";

const base = {
  country: "France",
  survey: {
    instrument: "ONPES reference budget",
    publisher: "CREDOC and IRES",
    headline: { value: 1571, currency: "EUR", year: 2014, label: "Reference budget", method: "m" },
  },
  cost: {
    carried: { value: 1990.12, year: 2025, from: { year: 2014, index: 100 }, to: { year: 2025, index: 126.7 }, factor: 1.267, source: "World Bank FP.CPI.TOTL" },
    eur: { value: 1990.12, rate: null, year: 0, source: "ECB", reason: "euro", basis: "carried" },
  },
} as unknown as CityResponse;

describe("money", () => {
  it("prints cents only where the figure has them", () => {
    expect(money(130920, "JPY")).toBe("¥130,920");
    expect(money(1224.64, "EUR")).toBe("€1,224.64");
    expect(money(605.5, "EUR")).toBe("€605.50");
    expect(euro(457)).toBe("€457");
    expect(money(1571, "EUR")).toBe("€1,571");
  });
});

describe("costChain", () => {
  it("cites each step of a carried figure, with its years and indices", () => {
    const steps = costChain(base);
    expect(steps.map((s) => s.key)).toEqual(["survey", "cpi", "rate"]);
    expect(steps[0].text).toContain("€1,571 a month, 2014");
    expect(steps[1].title).toBe("Carried to 2025 prices");
    expect(steps[1].text).toContain("100 in 2014 and 126.7 in 2025");
    expect(steps[1].text).toContain("× 1.267");
    expect(steps[2].text).toBe("France uses the euro: no conversion.");
  });

  it("says why nothing is carried when the survey is as new as the CPI", () => {
    const c = structuredClone(base);
    c.country = "Japan";
    c.survey.headline = { value: 130920, currency: "JPY", year: 2026, label: "Standard", method: "m" };
    c.cost.carried = { value: null, year: 2026, from: null, to: { year: 2025, index: 118.04 }, factor: null, source: "WB", reason: "x" };
    c.cost.eur = { value: 774.48, rate: 169.04, year: 2025, source: "ECB", basis: "survey" };
    const steps = costChain(c);
    expect(steps[1].title).toBe("No carry-forward");
    expect(steps[1].text).toContain("(2026) is not older than Japan's latest CPI year (2025)");
    expect(steps[2].text).toBe("At 169.04 JPY per euro, the ECB's 2025 average, the survey's figure is €774.48.");
  });

  it("shows a derived headline as its own step and a missing rate as a stated gap", () => {
    const c = structuredClone(base);
    c.survey.headline.derived = "R$ 7,750.01 ÷ 3";
    c.cost.eur = { value: null, rate: null, year: 0, source: "ECB", reason: "no ECB average for 2025", basis: "survey" };
    const steps = costChain(c);
    expect(steps.map((s) => s.key)).toEqual(["survey", "derived", "cpi", "rate"]);
    expect(steps[3].text).toBe("Not converted: no ECB average for 2025.");
  });
});

// Phase 18 step 5, M23: Milan's page read "…across all households.." because the page added a
// full stop to a note that already ended in one (Italy, Türkiye and Israel).
describe("sentence", () => {
  it("drops the full stop the data already carries, so the page's own is the only one", () => {
    expect(sentence("the components exist only as national averages across all households.")).toBe(
      "the components exist only as national averages across all households",
    );
  });
  it("drops repeated stops and trailing space, and leaves a clean phrase alone", () => {
    expect(sentence("a total..")).toBe("a total");
    expect(sentence("a total. ")).toBe("a total");
    expect(sentence("Reference budget")).toBe("Reference budget");
  });
  it("keeps a stop inside the text", () => {
    expect(sentence("one person aged 30–59, 1.5 m households.")).toBe("one person aged 30–59, 1.5 m households");
  });
});
