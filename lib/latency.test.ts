import { describe, expect, it } from "vitest";

import { formatCount, formatMeasure, parseInstantValue, toLatencyStats } from "@/lib/latency";

const vector = (...values: string[]) => ({
  status: "success",
  data: { resultType: "vector", result: values.map((v) => ({ metric: {}, value: [1727300000.1, v] })) },
});

describe("parseInstantValue", () => {
  it("reads the first sample", () => {
    expect(parseInstantValue(vector("0.0049"))).toBeCloseTo(0.0049);
  });

  it("treats no series and NaN as no measurement, not failure", () => {
    expect(parseInstantValue(vector())).toBeNull();
    // histogram_quantile over a window with zero observations.
    expect(parseInstantValue(vector("NaN"))).toBeNull();
  });

  it("throws on an error or malformed response — that's 'unreachable', a different state", () => {
    expect(() => parseInstantValue({ status: "error", error: "bad query" })).toThrow();
    expect(() => parseInstantValue({ status: "success", data: { resultType: "matrix", result: [] } })).toThrow();
  });
});

describe("toLatencyStats", () => {
  it("converts seconds to ms and rounds peak viewers", () => {
    expect(toLatencyStats({ p50: 0.0047, p99: 0.021, throughput: 1.93, peakClients: 3 })).toEqual({
      status: "ok",
      p50Ms: 4.7,
      p99Ms: 21,
      ticksPerSec: 1.93,
      peakClients: 3,
    });
  });

  it("is 'no-viewers' when latency has no samples, still reporting throughput", () => {
    const stats = toLatencyStats({ p50: null, p99: null, throughput: 1.9, peakClients: 0 });
    expect(stats).toMatchObject({ status: "no-viewers", p50Ms: null, ticksPerSec: 1.9, peakClients: 0 });
  });
});

describe("formatMeasure", () => {
  it("keeps one decimal below 10, whole numbers above, a dash for nothing", () => {
    expect(formatMeasure(4.73)).toBe("4.7");
    expect(formatMeasure(21.4)).toBe("21");
    expect(formatMeasure(1234)).toBe("1,234");
    expect(formatMeasure(null)).toBe("—");
  });

  it("formats counts as whole numbers — found live: zero peak viewers read '0.0'", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(15)).toBe("15");
    expect(formatCount(null)).toBe("—");
  });
});
