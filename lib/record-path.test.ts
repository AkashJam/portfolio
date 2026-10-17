import { describe, expect, it } from "vitest";

import { RECORD_HEIGHT, RECORD_WIDTH, rebase, recordGeometry } from "@/lib/record-path";

const series = (close: number[], benchmarkClose: number[] | null) => ({
  dates: close.map((_, i) => `2026-07-0${i + 1}`),
  close,
  benchmarkClose,
});

describe("rebase", () => {
  it("puts the first close at 100 and the rest as a percentage of it", () => {
    expect(rebase([20, 21, 19])).toEqual([100, 105, 95]);
  });

  it("is null with no first close to divide by", () => {
    expect(rebase([])).toBeNull();
    expect(rebase([0, 1])).toBeNull();
  });
});

describe("recordGeometry", () => {
  it("draws both lines across the box, rebased to the same start", () => {
    const g = recordGeometry({ series: series([20, 22, 21], [100, 99, 101]), events: [] })!;
    expect(g.sessions).toBe(3);
    expect(g.sensor.split(" ")).toHaveLength(3);
    expect(g.benchmark.split(" ")).toHaveLength(3);
    expect(g.sensor.split(" ")[0].startsWith("0,")).toBe(true);
    expect(g.sensor.split(" ")[2].startsWith(`${RECORD_WIDTH},`)).toBe(true);
    // Both lines start at 100, so they start at the same height.
    expect(g.sensor.split(" ")[0]).toBe(g.benchmark.split(" ")[0]);
    expect(g.last).toEqual({ sensor: 105, benchmark: 101 });
  });

  it("keeps every point inside the box", () => {
    const g = recordGeometry({ series: series([20, 30, 10], [100, 140, 60]), events: [] })!;
    for (const p of [...g.sensor.split(" "), ...g.benchmark.split(" ")]) {
      const y = Number(p.split(",")[1]);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(RECORD_HEIGHT);
    }
  });

  it("marks a dot on each session that tripped, and skips one outside the series", () => {
    const g = recordGeometry({
      series: series([20, 22, 21], [100, 99, 101]),
      events: [{ sessionDate: "2026-07-02" }, { sessionDate: "2025-01-01" }],
    })!;
    expect(g.dots).toHaveLength(1);
    expect(g.dots[0].date).toBe("2026-07-02");
    expect(g.dots[0].x).toBe(RECORD_WIDTH / 2);
  });

  it("draws no benchmark line for a sensor without one", () => {
    const g = recordGeometry({ series: series([20, 22], null), events: [] })!;
    expect(g.benchmark).toBe("");
    expect(g.last.benchmark).toBeNull();
  });

  it("has nothing to draw under two sessions", () => {
    expect(recordGeometry({ series: series([20], [100]), events: [] })).toBeNull();
  });
});
