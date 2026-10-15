import { describe, expect, it } from "vitest";

import { rsiPath, rsiY, RSI_HEIGHT } from "@/lib/rsi-path";

describe("rsiY", () => {
  it("puts 0 at the bottom and 100 at the top, and clamps", () => {
    expect(rsiY(0)).toBe(RSI_HEIGHT);
    expect(rsiY(100)).toBe(0);
    expect(rsiY(50)).toBe(80);
    expect(rsiY(130)).toBe(0);
    expect(rsiY(-5)).toBe(RSI_HEIGHT);
  });

  it("puts the 30 and 70 guides where the lines are drawn", () => {
    expect(rsiY(30)).toBe(112);
    expect(rsiY(70)).toBe(48);
  });
});

describe("rsiPath", () => {
  it("spreads the points evenly across the width", () => {
    expect(rsiPath([50, 100, 0])).toBe("M0 80 L450 0 L900 160");
  });

  it("is empty for no points and a single move for one", () => {
    expect(rsiPath([])).toBe("");
    expect(rsiPath([50])).toBe("M0 80");
  });
});
