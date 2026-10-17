import { describe, expect, it } from "vitest";

import { basketAlt, largest, segments } from "@/lib/city-basket";

const parts = [
  { label: "Housing, up to (a ceiling)", amount: 53700, share: 41.02, hatched: true },
  { label: "Personal", amount: 46930, share: 35.85 },
  { label: "Household", amount: 27790, share: 21.23 },
  { label: "Special supplement", amount: 2500, share: 1.9 },
];

describe("segments", () => {
  it("sizes each part by its share, summing to the whole bar", () => {
    const s = segments(parts, "JPY", "welfare_ceiling");
    expect(s.reduce((t, x) => t + x.width, 0)).toBeCloseTo(100, 0);
    expect(s[0]).toMatchObject({ label: "Housing, up to (a ceiling)", amount: "¥53,700", share: "41.0%", hatched: true, outlined: false });
  });

  it("steps opacity down by rank", () => {
    const s = segments(parts, "JPY", "welfare_ceiling");
    expect(s[0].opacity).toBe(1);
    expect(s[3].opacity).toBeCloseTo(0.35, 2);
    expect(s[1].opacity).toBeGreaterThan(s[2].opacity);
  });

  it("outlines a rent added to a survey that leaves housing out, and only that part", () => {
    const s = segments(
      [
        { label: "Rent, added", amount: 15260, share: 54.2, derived: "SSB" },
        { label: "SIFO budget", amount: 12909, share: 45.8 },
      ],
      "NOK",
      "derived_rent",
    );
    expect(s.map((x) => x.outlined)).toEqual([true, false]);
  });
});

describe("largest and basketAlt", () => {
  it("names the largest slice for the closed summary", () => {
    expect(largest(parts, "JPY")).toBe("Housing, up to (a ceiling) · ¥53,700 · 41.0%");
  });
  it("lists every part in the text alternative", () => {
    const t = basketAlt("Tokyo", parts, "JPY");
    expect(t).toContain("Tokyo's budget by part");
    expect(t).toContain("Special supplement ¥2,500, 1.9%");
  });
});
