import { describe, expect, it } from "vitest";

import eventsFixture from "@/e2e/fixtures/events.json";
import { BAND_HEIGHT, BAND_WIDTH, SPARK_HEIGHT, SPARK_WIDTH, bandGeometry, sigmaBarWidth, sparkPoints } from "@/lib/band-path";
import { eventsResponseSchema } from "@/lib/market-schemas";

const { events } = eventsResponseSchema.parse(eventsFixture);

const pairs = (points: string): [number, number][] =>
  points.split(" ").map((p) => p.split(",").map(Number) as [number, number]);

describe("bandGeometry", () => {
  const japan = bandGeometry(events[0].band!)!;
  const korea = bandGeometry(events[1].band!)!;

  it("spans the box left to right with every session", () => {
    expect(japan.sessions).toBe(60);
    const upper = pairs(japan.upper);
    expect(upper).toHaveLength(60);
    expect(upper[0][0]).toBe(0);
    expect(upper[59][0]).toBe(BAND_WIDTH);
    for (const [, y] of [...upper, ...pairs(japan.lower)]) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(BAND_HEIGHT);
    }
  });

  it("draws the upper edge above the lower, wherever the band sits (SVG y grows downward)", () => {
    const u = pairs(japan.upper);
    const l = pairs(japan.lower);
    for (let i = 0; i < 60; i++) expect(u[i][1]).toBeLessThan(l[i][1]);
  });

  it("shades a closed path between the edges", () => {
    expect(japan.fill.startsWith("M0")).toBe(true);
    expect(japan.fill.endsWith("Z")).toBe(true);
    expect(japan.fill.match(/L/g)!.length).toBe(119); // 59 along the top, 60 back along the bottom
  });

  it("breaks the line where it leaves the band, and ends the dot on the last close", () => {
    expect(japan.side).toBe("below");
    expect(korea.side).toBe("above");
    const out = pairs(japan.outside);
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out.at(-1)).toEqual([japan.dot.x, japan.dot.y]);
    // The two pieces share the last point inside the band, so the line has no gap.
    expect(pairs(japan.inside).at(-1)).toEqual(out[0]);
    // Below the band means a larger y than the lower edge at the end.
    expect(japan.dot.y).toBeGreaterThan(pairs(japan.lower).at(-1)![1]);
    expect(korea.dot.y).toBeLessThan(pairs(korea.upper).at(-1)![1]);
  });

  it("draws nothing for under two sessions", () => {
    expect(bandGeometry({ dates: ["a"], close: [1], lower: [0.9], upper: [1.1] })).toBeNull();
    expect(bandGeometry({ dates: [], close: [], lower: [], upper: [] })).toBeNull();
    expect(bandGeometry({ dates: ["a", "b"], close: [1, 2], lower: [1], upper: [1, 2] })).toBeNull();
  });

  it("survives a flat series", () => {
    const g = bandGeometry({ dates: ["a", "b"], close: [5, 5], lower: [5, 5], upper: [5, 5] })!;
    expect(g.side).toBe("inside");
    expect(g.outside).toBe("");
    expect(Number.isFinite(g.dot.y)).toBe(true);
  });
});

describe("sparkPoints", () => {
  it("fits the closes in the box, low at the bottom", () => {
    const pts = pairs(sparkPoints([1, 2, 3])!);
    expect(pts[0][0]).toBe(0);
    expect(pts[2][0]).toBe(SPARK_WIDTH);
    expect(pts[0][1]).toBeGreaterThan(pts[2][1]);
    for (const [, y] of pts) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(SPARK_HEIGHT);
    }
  });

  it("is null under two closes, and survives a flat line", () => {
    expect(sparkPoints([])).toBeNull();
    expect(sparkPoints([4])).toBeNull();
    expect(sparkPoints([4, 4, 4])).not.toContain("NaN");
  });
});

describe("sigmaBarWidth", () => {
  it("is eleven pixels a sigma, capped at 3.3σ", () => {
    expect(sigmaBarWidth(1)).toBe(11);
    expect(sigmaBarWidth(-1.4)).toBe(15);
    expect(sigmaBarWidth(0)).toBe(0);
    expect(sigmaBarWidth(9)).toBe(36);
  });
});
