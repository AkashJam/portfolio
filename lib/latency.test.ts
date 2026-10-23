import { describe, expect, it } from "vitest";

import {
  LATENCY_CEILING_SECONDS,
  NO_READING,
  formatCount,
  formatLatency,
  formatMeasure,
  latencyQueries,
  parseInstantValue,
  quantileReading,
  toLatencyStats,
  windowSuffix,
} from "@/lib/latency";

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

const reading = (value: number | null, window: "24h" | "7d" | "15d" | null = "24h") => ({ value, window });

describe("quantileReading", () => {
  it("converts seconds to ms and records its window", () => {
    expect(quantileReading(0.0047, "7d")).toEqual({ value: 4.7, window: "7d", pastCeiling: false });
  });

  it("flags a quantile at the last bucket's edge as past it, not as 10,000 ms measured", () => {
    // histogram_quantile reports a quantile in the +Inf bucket as the last
    // finite edge, so exactly the ceiling means "more than".
    expect(quantileReading(LATENCY_CEILING_SECONDS, "24h")).toMatchObject({ value: 10000, pastCeiling: true });
    expect(quantileReading(9.9, "24h")).toMatchObject({ pastCeiling: false });
  });

  it("is no reading for no samples", () => {
    expect(quantileReading(null, "24h")).toEqual(NO_READING);
  });
});

describe("toLatencyStats", () => {
  it("keeps each reading's window and rounds peak viewers", () => {
    const stats = toLatencyStats({
      p50: quantileReading(0.0047, "24h"),
      p99: quantileReading(0.021, "24h"),
      throughput: reading(1.93, "7d"),
      peakClients: reading(2.6, "15d"),
    });
    expect(stats).toMatchObject({
      status: "ok",
      p50: { value: 4.7, window: "24h" },
      p99: { value: 21, window: "24h" },
      ticksPerSec: { value: 1.93, window: "7d" },
      peakClients: { value: 3, window: "15d" },
    });
  });

  it("is 'no-viewers' when latency has no samples in any window, still reporting throughput", () => {
    const stats = toLatencyStats({ p50: NO_READING, p99: NO_READING, throughput: reading(1.9), peakClients: reading(0, "15d") });
    expect(stats).toMatchObject({ status: "no-viewers", p50: NO_READING, ticksPerSec: { value: 1.9 }, peakClients: { value: 0 } });
  });
});

describe("latencyQueries", () => {
  it("asks the renamed histogram over the given window", () => {
    const q = latencyQueries("7d");
    expect(q.p99).toBe("histogram_quantile(0.99, sum by (le) (rate(ticker_pipeline_fanout_seconds_bucket[7d])))");
    expect(q.throughput).toContain("[7d:1m]");
    expect(q.peakClients).toBe("max_over_time(ticker_sse_clients[7d])");
  });
});

describe("formatLatency", () => {
  it("shows a quantile past the last bucket as a bound", () => {
    expect(formatLatency(quantileReading(LATENCY_CEILING_SECONDS, "24h"))).toBe("> 10,000");
    expect(formatLatency(quantileReading(0.021, "24h"))).toBe("21");
    expect(formatLatency(NO_READING)).toBe("—");
  });
});

describe("windowSuffix", () => {
  it("names the window, or nothing", () => {
    expect(windowSuffix(reading(1, "7d"))).toBe(" · 7d");
    expect(windowSuffix(NO_READING)).toBe("");
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
