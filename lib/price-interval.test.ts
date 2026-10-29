import { describe, expect, it } from "vitest";

import { INTERVAL_TITLE, INTERVALS, chooseInterval, isInterval } from "@/lib/price-interval";
import { RSI_MIN_BARS } from "@/lib/rsi-path";

describe("chooseInterval", () => {
  it("opens a closed market on the daily view, however many hourly bars there are", () => {
    expect(chooseInterval({ requested: undefined, closed: true, intradayBars: 200 })).toBe("1d");
  });

  it("opens an open market on the hour", () => {
    expect(chooseInterval({ requested: undefined, closed: false, intradayBars: RSI_MIN_BARS })).toBe("1h");
  });

  it("falls back to daily when the hour has too few bars for RSI", () => {
    expect(chooseInterval({ requested: undefined, closed: false, intradayBars: RSI_MIN_BARS - 1 })).toBe("1d");
    expect(chooseInterval({ requested: undefined, closed: false, intradayBars: 0 })).toBe("1d");
  });

  it("lets ?interval= override the session, either way", () => {
    expect(chooseInterval({ requested: "1h", closed: true, intradayBars: 200 })).toBe("1h");
    expect(chooseInterval({ requested: "5m", closed: true, intradayBars: 0 })).toBe("5m");
    expect(chooseInterval({ requested: "1d", closed: false, intradayBars: 200 })).toBe("1d");
  });

  it("ignores a value that is not one of the four", () => {
    expect(chooseInterval({ requested: "10s", closed: true, intradayBars: 0 })).toBe("1d");
    expect(chooseInterval({ requested: "", closed: false, intradayBars: 200 })).toBe("1h");
    expect(isInterval("1M")).toBe(false);
  });

  it("titles every interval", () => {
    for (const iv of INTERVALS) expect(INTERVAL_TITLE[iv]).toMatch(/candles$/);
  });
});
