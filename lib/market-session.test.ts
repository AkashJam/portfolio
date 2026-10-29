import { describe, expect, it } from "vitest";

import {
  countdown,
  lastSessionLabel,
  opensIn,
  seedFromResponse,
  stateLine,
} from "@/lib/market-session";
import { deriveMarketState } from "@/lib/market-state";

const NOW = new Date("2026-10-16T20:00:00Z");
const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

describe("countdown", () => {
  it("reads hours and minutes inside a day, as the mock draws it", () => {
    expect(countdown(at(4 * HOUR + 12 * MIN), NOW)).toBe("4h 12m");
    expect(countdown(at(1 * HOUR), NOW)).toBe("1h 0m");
  });
  it("reads days and hours across a weekend", () => {
    // Friday 22:00 CET to Monday 15:30 CET is 65h 30m.
    expect(countdown(at(65 * HOUR + 30 * MIN), NOW)).toBe("2d 17h");
  });
  it("reads minutes inside an hour, and says so under a minute", () => {
    expect(countdown(at(12 * MIN + 30_000), NOW)).toBe("12m");
    expect(countdown(at(59 * MIN + 59_000), NOW)).toBe("59m");
    expect(countdown(at(30_000), NOW)).toBe("under a minute");
  });
  it("is 'now' at and past the open, and for an unreadable time", () => {
    expect(countdown(at(0), NOW)).toBe("now");
    expect(countdown(at(-5 * MIN), NOW)).toBe("now");
    expect(countdown("not a time", NOW)).toBe("now");
  });
  it("floors, so it never promises an earlier open than there is", () => {
    expect(countdown(at(4 * HOUR + 12 * MIN + 59_000), NOW)).toBe("4h 12m");
  });
});

describe("opensIn", () => {
  it("phrases the countdown", () => {
    expect(opensIn(at(4 * HOUR + 12 * MIN), NOW)).toBe("opens in 4h 12m");
    expect(opensIn(at(30_000), NOW)).toBe("opens in under a minute");
    expect(opensIn(at(-1), NOW)).toBe("opening now");
  });
});

describe("lastSessionLabel", () => {
  it("is the session day of a close and the New York day of a trade", () => {
    expect(lastSessionLabel("2026-10-06T00:00:00Z")).toBe("6 Oct");
    // 02:30 UTC on the 16th is still the evening of the 15th in New York.
    expect(lastSessionLabel("2026-10-16T02:30:00Z")).toBe("15 Oct");
  });
  it("is null when there is no price", () => {
    expect(lastSessionLabel(null)).toBeNull();
    expect(lastSessionLabel("nonsense")).toBeNull();
  });
});

describe("stateLine", () => {
  const closed = deriveMarketState({ feed: "closed", tripped: false, session: "closed", opensAt: at(4 * HOUR + 12 * MIN) });

  it("says closed as the mock does: when it opens, then the last session, and no trip clause", () => {
    expect(stateLine(closed, NOW, "2026-10-06T00:00:00Z")).toEqual({
      tone: "closed",
      word: "Closed.",
      facts: "Opens in 4h 12m · last session 6 Oct",
    });
  });
  it("drops what it does not know rather than inventing it", () => {
    expect(stateLine(closed, NOW, null).facts).toBe("Opens in 4h 12m");
    const noOpen = deriveMarketState({ feed: "closed", tripped: false, session: "closed" });
    expect(stateLine(noOpen, NOW, "2026-10-06T00:00:00Z").facts).toBe("last session 6 Oct");
  });
  it("says open while the session is open", () => {
    const open = deriveMarketState({ feed: "live", tripped: false, session: "open" });
    expect(stateLine(open, NOW, null)).toEqual({ tone: "open", word: "Open.", facts: "Live while New York trades." });
  });
  it("says unreachable, never closed, when the feed cannot be vouched for", () => {
    const dead = deriveMarketState({ feed: "stale", tripped: false, session: "closed", opensAt: at(HOUR) });
    expect(stateLine(dead, NOW, null)).toEqual({ tone: "unreachable", word: "Unreachable.", facts: "The feed is not answering." });
  });
});

describe("seedFromResponse", () => {
  it("turns the server's answer into the first paint's state", () => {
    const s = seedFromResponse({ feed: "closed", session: "closed", opensAt: "2026-10-19T13:30:00Z" });
    expect(s).toMatchObject({ state: "quiet", live: false, session: "closed", opensAt: "2026-10-19T13:30:00Z" });
  });
  it("reads live and open as live", () => {
    expect(seedFromResponse({ feed: "live", session: "open", opensAt: null })).toMatchObject({ live: true, session: "open" });
  });
  it("does not freeze on extended-hours ticks: a live feed with a closed session is closed, not live", () => {
    expect(seedFromResponse({ feed: "live", session: "closed", opensAt: "2026-10-19T13:30:00Z" })).toMatchObject({
      live: false,
      session: "closed",
    });
  });
  it("reads a ticker that could not be asked as unreachable, not as closed", () => {
    expect(seedFromResponse(null)).toMatchObject({ state: "unreachable", session: "unknown", opensAt: null });
  });
  it("drops an opening time that is not a string", () => {
    expect(seedFromResponse({ feed: "closed", session: "closed", opensAt: null }).opensAt).toBeNull();
  });
});
