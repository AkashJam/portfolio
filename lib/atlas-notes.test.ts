import { describe, expect, it } from "vitest";

import { cellNote } from "@/lib/atlas-notes";
import type { ColumnKey } from "@/lib/atlas";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

const ch = (
  v: number | null,
  extra: Partial<WindowChange> = {},
): WindowChange => ({
  change:
    v === null && extra.reason ? null : { "2021": v, "2016": v, "2010": v },
  years: null,
  source: "test",
  asOf: "2024",
  ...extra,
});
const lv = (value: number | null = 1) => ({
  value,
  source: "test",
  asOf: "2025",
});
const row = (
  slug: string,
  country: string,
  o: Partial<AtlasRow> = {},
): AtlasRow => ({
  slug,
  country,
  city: country,
  code: "XX",
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: ch(10),
  housing: ch(10),
  prices: ch(10),
  currency: ch(0),
  everydaySpendingEur: lv(),
  gniPpp: lv(),
  unemployment: lv(),
  lifeExpectancy: lv(),
  ...o,
});

const TURKIYE = row("turkiye", "Türkiye", {
  shares: ch(1725, { change: { "2021": 300, "2016": 800, "2010": 1725 } }),
  prices: ch(1223, { change: { "2021": 200, "2016": 500, "2010": 1223 } }),
  currency: ch(-94, { change: { "2021": -50, "2016": -80, "2010": -94 } }),
});
const IRELAND = row("ireland", "Ireland");
const CHILE = row("chile", "Chile", {
  currency: ch(-30, {
    derived: "via USD",
    source: "OECD via FRED CCUSMA02CLM618N × ECB USD per EUR",
  }),
});
const ROWS = [
  TURKIYE,
  IRELAND,
  CHILE,
  row("japan", "Japan"),
  row("italy", "Italy", { currency: ch(null, { reason: "euro" }) }),
];

const KEYS: ColumnKey[] = [
  "shares",
  "housing",
  "prices",
  "currency",
  "everydaySpendingEur",
  "gniPpp",
  "unemployment",
  "lifeExpectancy",
];

describe("cellNote", () => {
  it("marks Ireland's income, and only that cell of Ireland", () => {
    expect(cellNote(IRELAND, "gniPpp", ROWS, "2010")?.body).toContain(
      "multinational profit-shifting",
    );
    for (const k of KEYS.filter((k) => k !== "gniPpp"))
      expect(cellNote(IRELAND, k, ROWS, "2010"), k).toBeNull();
  });

  it("computes Türkiye's note from the rows: prices, shares against prices, the lira", () => {
    const n = cellNote(TURKIYE, "shares", ROWS, "2010")!;
    expect(n.body).toContain("prices rose +1,223% over the same years");
    expect(n.body).toContain("leaves +38% after inflation");
    expect(n.body).toContain("the lira moved −94% against the euro");
    expect(n.foot).toContain("never deflated");
  });

  it("recomputes Türkiye's note for the window", () => {
    const n = cellNote(TURKIYE, "shares", ROWS, "2016")!;
    expect(n.body).toContain("prices rose +500%");
    expect(n.body).toContain("leaves +50% after inflation");
    expect(n.body).toContain("−80%");
  });

  it("states no lira clause when the currency has no figure, and no note when prices have none", () => {
    expect(
      cellNote(
        { ...TURKIYE, currency: ch(null, { reason: "stale" }) },
        "shares",
        ROWS,
        "2010",
      )?.body,
    ).not.toContain("lira");
    expect(
      cellNote(
        { ...TURKIYE, prices: ch(null, { reason: "stale" }) },
        "shares",
        ROWS,
        "2010",
      ),
    ).toBeNull();
  });

  it("marks a derived currency from the data, quoting its source, wherever one exists", () => {
    const n = cellNote(CHILE, "currency", ROWS, "2010")!;
    expect(n.body).toContain("via the dollar");
    expect(n.body).toContain("CCUSMA02CLM618N");
    expect(
      cellNote(
        {
          ...row("peru", "Peru"),
          currency: ch(-5, { derived: "via USD", source: "x" }),
        },
        "currency",
        ROWS,
        "2010",
      )?.title,
    ).toBe("Peru’s currency");
  });

  it("marks nothing else: three cells in the whole table", () => {
    let marked = 0;
    for (const r of ROWS)
      for (const k of KEYS) if (cellNote(r, k, ROWS, "2010")) marked++;
    expect(marked).toBe(3);
  });
});
