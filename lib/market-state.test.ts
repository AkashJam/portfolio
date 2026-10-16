import { describe, expect, it } from "vitest";

import { deriveMarketState, stateAriaLabel, stateLabel, toFeed, toSession } from "@/lib/market-state";

describe("deriveMarketState", () => {
  it("is quiet and live while ticks flow and nothing has tripped", () => {
    expect(deriveMarketState({ feed: "live", tripped: false })).toEqual({ state: "quiet", live: true, session: "open", opensAt: null });
  });

  it("is quiet and not live when the market is closed, not unreachable", () => {
    expect(deriveMarketState({ feed: "closed", tripped: false })).toEqual({ state: "quiet", live: false, session: "open", opensAt: null });
  });

  it("is tripped when a sensor tripped, live or not", () => {
    expect(deriveMarketState({ feed: "live", tripped: true })).toEqual({ state: "tripped", live: true, session: "open", opensAt: null });
    expect(deriveMarketState({ feed: "closed", tripped: true })).toEqual({ state: "tripped", live: false, session: "open", opensAt: null });
  });

  it("is unreachable for a stale or down feed, and for a probe that failed", () => {
    for (const feed of ["stale", "down", "unreachable"] as const) {
      expect(deriveMarketState({ feed, tripped: false })).toEqual({ state: "unreachable", live: false, session: "unknown", opensAt: null });
    }
  });

  it("lets unreachable outrank tripped: a feed that cannot be vouched for does not claim a trip", () => {
    expect(deriveMarketState({ feed: "stale", tripped: true })).toEqual({ state: "unreachable", live: false, session: "unknown", opensAt: null });
  });
});

describe("the session", () => {
  const opensAt = "2026-10-19T13:30:00Z";

  it("is open by default, and has no opening time", () => {
    expect(deriveMarketState({ feed: "live", tripped: false })).toMatchObject({ session: "open", opensAt: null });
  });

  it("carries the next open while closed, and drops it while open", () => {
    expect(deriveMarketState({ feed: "closed", tripped: false, session: "closed", opensAt })).toMatchObject({ session: "closed", opensAt });
    expect(deriveMarketState({ feed: "live", tripped: false, session: "open", opensAt })).toMatchObject({ session: "open", opensAt: null });
  });

  it("is not live after the close even if extended-hours ticks flow", () => {
    expect(deriveMarketState({ feed: "live", tripped: false, session: "closed", opensAt }).live).toBe(false);
  });

  it("is unknown, and never closed, when the feed cannot be vouched for", () => {
    expect(deriveMarketState({ feed: "stale", tripped: false, session: "closed", opensAt })).toMatchObject({
      state: "unreachable",
      session: "unknown",
      opensAt: null,
    });
  });

  it("keeps a closed session's trip, since closing does not undo it", () => {
    expect(deriveMarketState({ feed: "closed", tripped: true, session: "closed", opensAt }).state).toBe("tripped");
  });
});

describe("toSession", () => {
  it("passes open and closed through and treats anything else as unknown", () => {
    expect(toSession("open")).toBe("open");
    expect(toSession("closed")).toBe("closed");
    expect(toSession("pre-market")).toBe("unknown");
    expect(toSession(undefined)).toBe("unknown");
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
