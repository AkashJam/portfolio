import { describe, expect, it } from "vitest";

import { convertToEur, deriveFxRate } from "@/lib/currency";

describe("deriveFxRate", () => {
  it("computes EUR per unit of local currency", () => {
    // London: £2522.39 -> €2945.39 (real seed value, ticker/internal/source)
    expect(deriveFxRate(2522.39, 2945.39)).toBeCloseTo(1.1677, 3);
  });

  it("is 1 when local and EUR values are equal", () => {
    expect(deriveFxRate(1000, 1000)).toBe(1);
  });
});

describe("convertToEur", () => {
  it("scales an amount by the given rate", () => {
    const rate = deriveFxRate(2522.39, 2945.39);
    expect(convertToEur(2522.39, rate)).toBeCloseTo(2945.39, 1);
  });

  it("returns 0 for a 0 amount regardless of rate", () => {
    expect(convertToEur(0, 1.5)).toBe(0);
  });
});
