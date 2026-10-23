import { describe, expect, it } from "vitest";

import { dayMonth, dayMonthYear } from "@/lib/dates";

describe("dates", () => {
  it("writes a day with the year, or without where it is implied", () => {
    expect(dayMonthYear("2026-09-01")).toBe("1 Sep 2026");
    expect(dayMonth("2026-10-21")).toBe("21 Oct");
  });

  it("spells September 'Sep', not the 'Sept' some Intl runtimes give", () => {
    expect(dayMonthYear("2026-09-12")).toBe("12 Sep 2026");
  });

  it("does not pad a single-digit day or shift a calendar day", () => {
    expect(dayMonthYear("2026-01-05")).toBe("5 Jan 2026");
    expect(dayMonthYear("2025-12-31")).toBe("31 Dec 2025");
  });

  it("reads an instant in UTC, so the machine's zone cannot move the date", () => {
    expect(dayMonthYear("2026-03-01T23:59:59Z")).toBe("1 Mar 2026");
    expect(dayMonthYear("2026-03-02T00:00:00Z")).toBe("2 Mar 2026");
  });

  it("refuses what is not a date rather than printing 'NaN'", () => {
    expect(() => dayMonth("soon")).toThrow(/not a date/);
  });
});
