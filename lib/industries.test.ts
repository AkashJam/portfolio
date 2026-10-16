import { describe, expect, it } from "vitest";

import { isClipped, meterWidth, rankTiles, type SectorTile } from "@/lib/industries";
import type { PriceRow } from "@/lib/prices";

const tile = (symbol: string, changePercent: number, over: Partial<PriceRow> = {}): SectorTile => ({
  symbol,
  label: symbol,
  row: {
    symbol,
    price: 100,
    prevClose: 100,
    change: changePercent,
    changePercent,
    asOf: "2026-10-14T00:00:00Z",
    ...over,
  },
});

describe("rankTiles", () => {
  it("orders strongest to weakest, across zero", () => {
    const ranked = rankTiles([tile("IXJ", -0.64), tile("EXI", 1.22), tile("MXI", -0.28), tile("IXN", 0.44)]);
    expect(ranked.map((t) => t.symbol)).toEqual(["EXI", "IXN", "MXI", "IXJ"]);
  });

  it("breaks a tie by ticker, so the order is the same every render", () => {
    const ranked = rankTiles([tile("KXI", 0.5), tile("IXG", 0.5), tile("EXI", 0.5)]);
    expect(ranked.map((t) => t.symbol)).toEqual(["EXI", "IXG", "KXI"]);
  });

  it("puts a tile with no price, or nothing to compare it with, last", () => {
    const ranked = rankTiles([
      tile("IXC", -3, { asOf: null }),
      tile("IXN", -0.1),
      tile("RXI", 9, { prevClose: 0 }),
      tile("EXI", 0.2),
    ]);
    expect(ranked.map((t) => t.symbol)).toEqual(["EXI", "IXN", "IXC", "RXI"]);
  });

  it("does not modify its input", () => {
    const input = [tile("B", 1), tile("A", 2)];
    rankTiles(input);
    expect(input.map((t) => t.symbol)).toEqual(["B", "A"]);
  });
});

describe("meterWidth and isClipped", () => {
  it("follows the mock's scale: a -2.81% move fills 31% of the half-bar", () => {
    expect(Math.round(meterWidth(-2.81))).toBe(31);
    expect(Math.round(meterWidth(1.22))).toBe(14);
  });

  it("is the same length for a rise and a fall of the same size", () => {
    expect(meterWidth(1.5)).toBe(meterWidth(-1.5));
  });

  it("stops at the half-bar for a larger move, and says it was cut short", () => {
    expect(meterWidth(12)).toBe(50);
    expect(isClipped(12)).toBe(true);
    expect(isClipped(-4.6)).toBe(true);
    expect(isClipped(4.5)).toBe(false);
    expect(isClipped(0.3)).toBe(false);
  });

  it("is nothing for a flat day", () => {
    expect(meterWidth(0)).toBe(0);
  });
});
