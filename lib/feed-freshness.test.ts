import { describe, expect, it } from "vitest";

import { FeedTracker, STALE_AFTER_MS, feedStatus, formatAge, newestTimestamp } from "@/lib/feed-freshness";

describe("feedStatus", () => {
  it("is fresh just under the threshold and stale at it", () => {
    expect(feedStatus(STALE_AFTER_MS - 1, 0, null).stale).toBe(false);
    expect(feedStatus(STALE_AFTER_MS, 0, null).stale).toBe(true);
  });

  it("reports time since the last quote, never negative", () => {
    expect(feedStatus(10_000, 10_000, 4_000).sinceQuoteMs).toBe(6_000);
    expect(feedStatus(1_000, 1_000, 5_000).sinceQuoteMs).toBe(0);
    expect(feedStatus(1_000, 1_000, null).sinceQuoteMs).toBeNull();
  });
});

describe("FeedTracker", () => {
  it("heartbeats keep a quiet feed fresh while the quote age keeps growing", () => {
    const t = new FeedTracker(null, 0);
    t.noteQuote(1_000);
    t.noteEvent(15_000);
    t.noteEvent(30_000);
    const s = t.status(45_000);
    expect(s.stale).toBe(false);
    expect(s.sinceQuoteMs).toBe(44_000);
  });

  it("goes stale when nothing arrives, and recovers on the next event", () => {
    const t = new FeedTracker(null, 0);
    t.noteQuote(1_000);
    expect(t.status(1_000 + STALE_AFTER_MS).stale).toBe(true);
    t.noteEvent(40_000);
    expect(t.status(40_000).stale).toBe(false);
  });

  it("seeds the quote clock from the snapshot, the event clock from construction", () => {
    const seed = "2026-09-24T12:00:00.000Z";
    const now = Date.parse(seed) + 300_000;
    const t = new FeedTracker(seed, now);
    expect(t.status(now).stale).toBe(false);
    expect(t.status(now).sinceQuoteMs).toBe(300_000);
  });

  it("ignores an unparseable seed", () => {
    expect(new FeedTracker("not a date", 0).lastQuoteAt).toBeNull();
  });
});

describe("formatAge", () => {
  it("floors into the largest whole unit", () => {
    expect(formatAge(0)).toBe("0s");
    expect(formatAge(59_999)).toBe("59s");
    expect(formatAge(60_000)).toBe("1m");
    expect(formatAge(3_599_999)).toBe("59m");
    expect(formatAge(3_600_000)).toBe("1h");
    expect(formatAge(86_400_000)).toBe("1d");
  });
});

describe("newestTimestamp", () => {
  it("picks the newest valid timestamp", () => {
    expect(newestTimestamp(["2026-01-01T00:00:00Z", "2026-03-01T00:00:00Z", null, "bad"])).toBe(
      "2026-03-01T00:00:00Z"
    );
    expect(newestTimestamp([])).toBeNull();
  });
});
