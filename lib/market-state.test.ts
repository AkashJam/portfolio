import { describe, expect, it } from "vitest";

import { deriveMarketState, stateAriaLabel, stateLabel, toFeed } from "@/lib/market-state";

describe("deriveMarketState", () => {
  it("is quiet and live while ticks flow and nothing has tripped", () => {
    expect(deriveMarketState({ feed: "live", tripped: false })).toEqual({ state: "quiet", live: true });
  });

  it("is quiet and not live when the market is closed, not unreachable", () => {
    expect(deriveMarketState({ feed: "closed", tripped: false })).toEqual({ state: "quiet", live: false });
  });

  it("is tripped when a sensor tripped, live or not", () => {
    expect(deriveMarketState({ feed: "live", tripped: true })).toEqual({ state: "tripped", live: true });
    expect(deriveMarketState({ feed: "closed", tripped: true })).toEqual({ state: "tripped", live: false });
  });

  it("is unreachable for a stale or down feed, and for a probe that failed", () => {
    for (const feed of ["stale", "down", "unreachable"] as const) {
      expect(deriveMarketState({ feed, tripped: false })).toEqual({ state: "unreachable", live: false });
    }
  });

  it("lets unreachable outrank tripped: a feed that cannot be vouched for does not claim a trip", () => {
    expect(deriveMarketState({ feed: "stale", tripped: true })).toEqual({ state: "unreachable", live: false });
  });
});

describe("toFeed", () => {
  it("passes the ticker's values through and treats anything else as unreachable", () => {
    expect(toFeed("live")).toBe("live");
    expect(toFeed("closed")).toBe("closed");
    expect(toFeed("stale")).toBe("stale");
    expect(toFeed("down")).toBe("down");
    expect(toFeed("surprise")).toBe("unreachable");
    expect(toFeed(undefined)).toBe("unreachable");
    expect(toFeed(42)).toBe("unreachable");
  });
});

describe("stateLabel and stateAriaLabel", () => {
  it("says live only while ticks flow", () => {
    expect(stateLabel({ state: "quiet", live: true })).toBe("quiet · live");
    expect(stateLabel({ state: "quiet", live: false })).toBe("quiet");
  });
  it("names a trip as the mock does", () => {
    expect(stateLabel({ state: "tripped", live: false })).toBe("a sensor tripped");
    expect(stateLabel({ state: "tripped", live: true })).toBe("a sensor tripped · live");
  });
  it("says unreachable plainly", () => {
    expect(stateLabel({ state: "unreachable", live: false })).toBe("unreachable");
  });
  it("reads aloud as a phrase, not a middle dot", () => {
    expect(stateAriaLabel({ state: "quiet", live: true })).toBe("quiet, live");
  });
});
