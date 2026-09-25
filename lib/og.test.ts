import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { OG_TOKENS, formatOgDate } from "@/lib/og";

// lib/og.tsx has to copy colour tokens as literals (Satori can't read CSS
// variables). This keeps app/globals.css the single source: change a token
// there and this fails until the OG copy follows.
describe("OG_TOKENS", () => {
  const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

  for (const [name, value] of Object.entries(OG_TOKENS)) {
    it(`--${name} matches globals.css`, () => {
      const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
      expect(match, `--${name} not found in globals.css`).not.toBeNull();
      expect(value.toLowerCase()).toBe(match![1].toLowerCase());
    });
  }
});

describe("formatOgDate", () => {
  it("formats in UTC regardless of the build machine's zone", () => {
    expect(formatOgDate("2026-01-01")).toBe("Jan 1, 2026");
    expect(formatOgDate("2025-12-31")).toBe("Dec 31, 2025");
  });
});
