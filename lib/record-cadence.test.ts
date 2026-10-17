import { describe, expect, it } from "vitest";

import { TRIP_RATE, cadence } from "@/lib/record-cadence";

describe("cadence", () => {
  it("states the count, the judged sessions and the expectation with their date", () => {
    const c = cadence({ eventCount: 1, sessionsJudged: 50, judgedFrom: "2026-10-16" });
    expect(c.text).toBe(
      "1 event in 50 sessions judged since 16 Oct. A normal series passes 2.5σ on 1.24% of sessions, so about 0.62 would be expected.",
    );
    expect(c.expected).toBeCloseTo(50 * TRIP_RATE);
  });

  it("says plainly that nothing tripped", () => {
    expect(cadence({ eventCount: 0, sessionsJudged: 1, judgedFrom: "2026-10-16" }).text).toMatch(
      /^Nothing has tripped in the 1 session judged since 16 Oct\./,
    );
  });

  it("drops to one decimal from one expected event up", () => {
    expect(cadence({ eventCount: 3, sessionsJudged: 200, judgedFrom: "2026-10-16" }).text).toMatch(/about 2\.5 would/);
  });

  it("claims nothing before a session is judged", () => {
    const c = cadence({ eventCount: 0, sessionsJudged: 0, judgedFrom: "2026-10-16" });
    expect(c.expected).toBeNull();
    expect(c.text).toBe("The trigger has not judged a session yet; it starts from 16 Oct.");
  });
});
