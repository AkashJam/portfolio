import { describe, expect, it } from "vitest";

import { nextReconnectDelay } from "@/lib/sse";

describe("nextReconnectDelay", () => {
  it("doubles the delay each step", () => {
    expect(nextReconnectDelay(1000)).toBe(2000);
    expect(nextReconnectDelay(2000)).toBe(4000);
    expect(nextReconnectDelay(4000)).toBe(8000);
  });

  it("caps at 30s", () => {
    expect(nextReconnectDelay(20_000)).toBe(30_000);
    expect(nextReconnectDelay(30_000)).toBe(30_000);
    expect(nextReconnectDelay(100_000)).toBe(30_000);
  });
});
