import { describe, expect, it } from "vitest";

import {
  closeLabel,
  openWindow,
  regularSession,
  seriesNote,
  sessionWindow,
  shapeClosed,
  shapeOpen,
  toPath,
} from "@/lib/band-series";

const bar = (time: string, close: number) => ({ time, close });
const daily = Array.from({ length: 30 }, (_, i) => bar(`2026-09-${String(i + 1).padStart(2, "0")}T00:00:00Z`, 100 + i));

describe("sessionWindow", () => {
  it("covers one session's regular hours, in summer and in winter", () => {
    // A daily bar's asOf is midnight UTC on the session date.
    const w = sessionWindow("2026-10-08T00:00:00Z");
    expect(w.from.toISOString()).toBe("2026-10-08T12:00:00.000Z");
    expect(w.to.toISOString()).toBe("2026-10-09T00:00:00.000Z");
    expect(sessionWindow("2026-12-04T00:00:00Z").from.toISOString()).toBe("2026-12-04T12:00:00.000Z");
  });

  it("puts a pre-market print in the session before it", () => {
    // 07:21 New York on Fri 16 Oct: the session that has closed is Thu 15 Oct's.
    expect(sessionWindow("2026-10-16T11:21:00Z").from.toISOString()).toBe("2026-10-15T12:00:00.000Z");
  });

  it("takes a live trade's New York date, not its UTC one", () => {
    // 23:30 New York on 8 Oct is 03:30 UTC on 9 Oct.
    expect(sessionWindow("2026-10-09T03:30:00Z").from.toISOString()).toBe("2026-10-08T12:00:00.000Z");
  });
});

describe("openWindow", () => {
  it("starts three hours back", () => {
    expect(openWindow(new Date("2026-10-15T15:00:00Z")).from.toISOString()).toBe("2026-10-15T12:00:00.000Z");
  });
});

describe("regularSession", () => {
  it("keeps 09:30 to 16:00 New York and drops extended hours", () => {
    const bars = [
      bar("2026-10-08T13:29:00Z", 1), // 09:29 EDT: pre-market
      bar("2026-10-08T13:30:00Z", 2), // 09:30
      bar("2026-10-08T19:59:00Z", 3), // 15:59
      bar("2026-10-08T20:00:00Z", 4), // 16:00: after the close
    ];
    expect(regularSession(bars)).toEqual([2, 3]);
  });

  it("holds in winter, when New York is an hour further from UTC", () => {
    const bars = [bar("2026-12-04T14:29:00Z", 1), bar("2026-12-04T14:30:00Z", 2), bar("2026-12-04T20:59:00Z", 3), bar("2026-12-04T21:00:00Z", 4)];
    expect(regularSession(bars)).toEqual([2, 3]);
  });
});

describe("shapeOpen", () => {
  it("takes the last twenty 1m closes", () => {
    const m = Array.from({ length: 50 }, (_, i) => bar(`2026-10-15T15:${String(i).padStart(2, "0")}:00Z`, i));
    const s = shapeOpen(m, daily)!;
    expect(s).toMatchObject({ mode: "open", source: "1m" });
    expect(s.points).toHaveLength(20);
    expect(s.points.at(-1)).toBe(49);
  });

  it("falls back to daily closes when there are too few intraday bars", () => {
    const s = shapeOpen([bar("2026-10-15T15:00:00Z", 1)], daily)!;
    expect(s.source).toBe("daily");
    expect(s.points).toHaveLength(20);
    expect(s.points.at(-1)).toBe(129);
  });

  it("is null when there is nothing to draw", () => {
    expect(shapeOpen([], [])).toBeNull();
  });
});

describe("shapeClosed", () => {
  const session = [bar("2026-10-08T13:30:00Z", 10), bar("2026-10-08T13:31:00Z", 11), bar("2026-10-08T20:30:00Z", 99)];

  it("draws the regular session's path", () => {
    expect(shapeClosed(session, daily)).toEqual({ mode: "closed", points: [10, 11], source: "1m" });
  });

  it("falls back to the daily closes, and says so", () => {
    const s = shapeClosed([], daily)!;
    expect(s.source).toBe("daily");
    expect(seriesNote(s)).toBe("last 20 sessions");
    expect(seriesNote({ mode: "closed", points: [1, 2], source: "1m" })).toBeNull();
  });
});

describe("closeLabel", () => {
  it("names the day of a close or a trade", () => {
    expect(closeLabel("2026-10-06T00:00:00Z")).toBe("6 Oct close");
    // A trade is not a close, and says when it was: 21:00 New York on the 7th.
    expect(closeLabel("2026-10-08T01:00:00Z")).toBe("last trade 21:00 ET");
    expect(closeLabel(null)).toBeNull();
  });
});

describe("toPath", () => {
  it("runs left to right across the width, low at the bottom and high at the top", () => {
    const p = toPath([1, 3, 2], 1440, 256);
    expect(p.line.startsWith("M0 ")).toBe(true);
    expect(p.last[0]).toBe(1440);
    expect(p.line).toBe("M0 232 L720 24 L1440 128");
    expect(p.area.endsWith("L1440 256 L0 256 Z")).toBe(true);
  });

  it("does not divide by zero on a flat line", () => {
    expect(() => toPath([5, 5, 5], 1440, 256)).not.toThrow();
  });
});
