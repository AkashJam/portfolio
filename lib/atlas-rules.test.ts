import { describe, expect, it } from "vitest";

import { rulesExample, rulesExampleSentence } from "@/lib/atlas-rules";
import type { AtlasRow } from "@/lib/market-schemas";

const row = (slug: string, country: string, housing: number | null) =>
  ({ slug, country, housing: { change: housing === null ? null : { "2010": housing, "2016": housing, "2021": housing } } }) as unknown as AtlasRow;

describe("rulesExample", () => {
  it("uses Italy and the United States when they moved in opposite directions", () => {
    const ex = rulesExample([row("italy", "Italy", -26.4), row("united-states", "United States", 59.4), row("turkiye", "Türkiye", 125)], "2010");
    expect(ex).toEqual({ fell: { country: "Italy", pct: 26 }, rose: { country: "United States", pct: 59 } });
    expect(rulesExampleSentence(ex!, "2010")).toBe(
      "Since 2010, house prices fell 26% in Italy and rose 59% in the United States. Compare those changes, not what a home costs in each.",
    );
  });
  it("falls back to the biggest fall and rise when the pair does not qualify", () => {
    const ex = rulesExample([row("italy", "Italy", 5), row("united-states", "United States", null), row("a", "Chile", -40), row("b", "Türkiye", 125)], "2010");
    expect(ex).toEqual({ fell: { country: "Chile", pct: 40 }, rose: { country: "Türkiye", pct: 125 } });
  });
  it("gives no example without both a fall and a rise", () => {
    expect(rulesExample([row("a", "Chile", 10), row("b", "Türkiye", 125)], "2010")).toBeNull();
  });
});
