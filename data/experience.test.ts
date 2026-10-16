import { describe, expect, it } from "vitest";

import { experience, fullStackYears, monthsWorked, proofFigures } from "@/data/experience";

describe("monthsWorked", () => {
  it("sums the roles, an open one running to now", () => {
    // Feb 2021 - Jun 2022 is 16 months; Oct 2023 - Oct 2026 is 36.
    expect(monthsWorked(experience, new Date("2026-10-16T00:00:00Z"))).toBe(52);
  });

  it("rejects a date it cannot read, so a typo fails the build", () => {
    expect(() => monthsWorked([{ start: "Octobre 2023" }], new Date())).toThrow(/cannot read/);
  });
});

describe("fullStackYears", () => {
  it("floors the months to whole years", () => {
    expect(fullStackYears(new Date("2026-10-16T00:00:00Z"))).toBe("4+");
    expect(fullStackYears(new Date("2027-05-31T00:00:00Z"))).toBe("4+");
    expect(fullStackYears(new Date("2027-06-01T00:00:00Z"))).toBe("5+");
  });
});

describe("proofFigures", () => {
  it("are the three typed figures, beside the derived years", () => {
    expect(proofFigures.map((f) => f.value)).toEqual(["50,000+", "99.9%", "5m→30s"]);
  });
});
