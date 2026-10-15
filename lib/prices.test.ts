import { describe, expect, it } from "vitest";

import {
  applyQuote,
  changeDirection,
  changeLabel,
  dayKey,
  isClose,
  newestVintage,
  pricesVintage,
  rowVintage,
  thinListing,
  type PriceRow,
} from "@/lib/prices";

const row = (over: Partial<PriceRow> = {}): PriceRow => ({
  symbol: "MUFG",
  price: 22.48,
  prevClose: 22.65,
  change: -0.17,
  changePercent: -0.75,
  asOf: "2026-10-08T00:00:00Z",
  ...over,
});

const CLOSE = "2026-10-08T00:00:00Z";
const TRADE = "2026-10-15T19:42:07Z"; // 15:42:07 in New York (EDT)

describe("isClose and dayKey", () => {
  it("tells a daily bar from a trade by its midnight-UTC stamp", () => {
    expect(isClose(CLOSE)).toBe(true);
    expect(isClose(TRADE)).toBe(false);
  });
  it("dates a close by its session and a trade by its New York day", () => {
    expect(dayKey(CLOSE)).toBe("2026-10-08");
    expect(dayKey(TRADE)).toBe("2026-10-15");
    // 02:30 UTC on the 16th is still the evening of the 15th in New York.
    expect(dayKey("2026-10-16T02:30:00Z")).toBe("2026-10-15");
  });
});

describe("applyQuote", () => {
  it("sets the price, the change against yesterday's close, and the new vintage", () => {
    const r = applyQuote(row({ prevClose: 20 }), { price: 21, time: TRADE });
    expect(r.price).toBe(21);
    expect(r.change).toBe(1);
    expect(r.changePercent).toBeCloseTo(5);
    expect(r.asOf).toBe(TRADE);
  });
  it("leaves the change at zero when there is no previous close, rather than dividing by it", () => {
    const r = applyQuote(row({ prevClose: 0, change: 0, changePercent: 0 }), { price: 21, time: TRADE });
    expect(r.changePercent).toBe(0);
    expect(r.change).toBe(21);
  });
});

describe("changeLabel and changeDirection", () => {
  it("signs the figure, with a real minus", () => {
    expect(changeLabel(row({ changePercent: 0.484 }))).toBe("+0.48%");
    expect(changeLabel(row({ changePercent: -4.83 }))).toBe("−4.83%");
  });
  it("shows 0.00% for a flat move and a dash when there is nothing to compare", () => {
    expect(changeLabel(row({ changePercent: 0.001 }))).toBe("0.00%");
    expect(changeLabel(row({ prevClose: 0 }))).toBe("—");
    expect(changeLabel(row({ asOf: null }))).toBe("—");
  });
  it("gives the direction the colour is chosen from", () => {
    expect(changeDirection(row({ changePercent: 1 }))).toBe("up");
    expect(changeDirection(row({ changePercent: -1 }))).toBe("down");
    expect(changeDirection(row({ changePercent: 0 }))).toBe("flat");
    expect(changeDirection(row({ prevClose: 0 }))).toBe("flat");
  });
});

describe("pricesVintage", () => {
  const now = new Date("2026-10-15T20:00:00Z");

  it("says 'Last close' with the session date when every row is a daily bar", () => {
    expect(pricesVintage([CLOSE, CLOSE], now, false)).toBe("Last close, 8 Oct 2026");
  });
  it("uses the newest vintage, not the oldest", () => {
    expect(pricesVintage([CLOSE, "2026-10-09T00:00:00Z", null], now, false)).toBe("Last close, 9 Oct 2026");
  });
  it("says 'Live' once a quote has arrived in this session, with the time in New York", () => {
    expect(pricesVintage([CLOSE, TRADE], now, true)).toBe("Live · last trade 15:42 ET");
  });
  it("says 'Latest trade' for a trade from today and dates one from an earlier day", () => {
    expect(pricesVintage([TRADE], now, false)).toBe("Latest trade 15:42 ET");
    expect(pricesVintage([TRADE], new Date("2026-10-17T12:00:00Z"), false)).toBe("Last trade 15 Oct, 15:42 ET");
  });
  it("says so when there is no price at all", () => {
    expect(pricesVintage([null, null], now, false)).toBe("No prices yet");
    expect(pricesVintage([], now, false)).toBe("No prices yet");
  });
});

describe("rowVintage and newestVintage", () => {
  it("shows nothing for a row on the table's date", () => {
    expect(rowVintage(CLOSE, CLOSE)).toBeNull();
    expect(rowVintage("2026-10-15T14:00:00Z", TRADE)).toBeNull();
  });
  it("shows the row's own date when it is older than the table's", () => {
    expect(rowVintage("2026-10-06T00:00:00Z", CLOSE)).toBe("6 Oct");
    expect(rowVintage("2026-10-14T19:00:00Z", TRADE)).toBe("14 Oct");
  });
  it("shows nothing for a row with no price or a table with none", () => {
    expect(rowVintage(null, CLOSE)).toBeNull();
    expect(rowVintage(CLOSE, null)).toBeNull();
  });
  it("finds the newest vintage, ignoring nulls", () => {
    expect(newestVintage([CLOSE, null, TRADE])).toBe(TRADE);
    expect(newestVintage([null])).toBeNull();
  });
});

describe("thinListing", () => {
  it("states the measured figure and its date", () => {
    expect(thinListing(13, "2026-10-09")).toBe("thin listing, $13M a day (9 Oct 2026)");
  });
});
