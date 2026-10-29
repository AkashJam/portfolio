import { describe, expect, it } from "vitest";

import { TRIP_RATE, cadence } from "@/lib/record-cadence";

describe("cadence", () => {
  it("states the count, the checked sessions and the usual rate in words, with the date", () => {
    const c = cadence({ eventCount: 2, sessionsJudged: 4, judgedFrom: "2026-10-16" });
    expect(c.text).toBe("2 unusual moves in the 4 sessions checked since 16 Oct. A company moving normally makes one about once every 80 sessions.");
    expect(c.expected).toBeCloseTo(4 * TRIP_RATE);
    expect(cadence({ eventCount: 1, sessionsJudged: 1, judgedFrom: "2026-10-16" }).text).toMatch(/^1 unusual move in the 1 session checked/);
  });

  it("says plainly that nothing was unusual", () => {
    expect(cadence({ eventCount: 0, sessionsJudged: 1, judgedFrom: "2026-10-16" }).text).toMatch(
      /^Nothing unusual in the 1 session checked since 16 Oct\./,
    );
  });

  it("claims nothing before a session is checked", () => {
    const c = cadence({ eventCount: 0, sessionsJudged: 0, judgedFrom: "2026-10-16" });
    expect(c.expected).toBeNull();
    expect(c.text).toBe("No session has been checked yet; checking starts from 16 Oct.");
  });

  it("uses none of the review's jargon", () => {
    expect(cadence({ eventCount: 2, sessionsJudged: 4, judgedFrom: "2026-10-16" }).text).not.toMatch(/σ|tripped|judged|event|expected/i);
  });
});
