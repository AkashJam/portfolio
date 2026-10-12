import { type ColumnKey, windowLabel } from "@/lib/atlas";
import { nm } from "@/lib/atlas-readings";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

// Tier 2 of the three disclosure tiers (bearing.md): column provenance, behind
// an icon in the column header, once. Static facts are only ones that do not
// move (source names, series codes, cadence); anything that moves, the window
// and the vintage, is computed from the rows.

export interface ColumnFacts {
  source: string;
  /** The series, with `<CC>` standing for the country's ISO alpha-2 code where one series per country. */
  series: string;
  /** The exact term one tier down: the plain label's technical name and what it means. */
  note: string;
  cadence: string;
  /** Only the two indices have one. */
  base?: string;
}

const OWN_BASE =
  "each country's own base year: an index, so only change is comparable";

export const COLUMN_FACTS: Record<ColumnKey, ColumnFacts> = {
  shares: {
    source: "OECD, via FRED",
    series: "SPASTT01<CC>M661N",
    base: OWN_BASE,
    cadence: "monthly",
    note: "“Nominal” means before inflation, in local currency. OECD does not deflate it, and neither does this page: the prices column covers the same window, so it is what you deflate with.",
  },
  housing: {
    source: "BIS, via FRED",
    series: "Q<CC>R628BIS",
    base: OWN_BASE,
    cadence: "quarterly",
    note: "“Real” means after inflation: BIS deflates house prices by consumer prices before publishing, so a fall is a fall in what a home costs against everything else.",
  },
  prices: {
    source: "World Bank",
    series: "FP.CPI.TOTL",
    base: OWN_BASE,
    cadence: "annual, as an annual average",
    note: "A window is one annual average against another, about half a year off the month-end figures the shares, housing and currency columns use.",
  },
  currency: {
    source: "ECB euro foreign exchange reference rates",
    series: "euro foreign exchange reference rates",
    cadence: "daily rates, monthly averages",
    note: "The euro area has no rate against itself. Chile has no ECB rate, so its figure goes via the dollar: OECD pesos per dollar (FRED CCUSMA02CLM618N) times the ECB’s dollars per euro.",
  },
  everydaySpendingEur: {
    source: "World Bank, converted by the ECB",
    series: "NE.CON.PRVT.CD ÷ SP.POP.TOTL",
    cadence: "annual, latest published",
    note: "Household consumption per person in current US dollars, converted to euro at the ECB’s annual average rate for the same year, then divided by twelve. Its as-of is the consumption year.",
  },
  gniPpp: {
    source: "World Bank",
    series: "NY.GNP.PCAP.PP.CD",
    cadence: "annual, latest published",
    note: "“GNI” is gross national income and “PPP” is purchasing power parity: the dollars are international dollars that equalise price levels, which is what “price-adjusted” means here.",
  },
  unemployment: {
    source: "World Bank (modelled ILO estimate)",
    series: "SL.UEM.TOTL.ZS",
    cadence: "annual, latest published",
    note: "The share of the labour force without work.",
  },
  lifeExpectancy: {
    source: "World Bank",
    series: "SP.DYN.LE00.IN",
    cadence: "annual, latest published",
    note: "Life expectancy at birth, in years.",
  },
};

/** Does a row's `source` string carry this column's series? The test that keeps the static facts honest. */
export function seriesMatches(key: ColumnKey, source: string): boolean {
  const s = COLUMN_FACTS[key].series;
  if (s.includes("<CC>"))
    return new RegExp(s.replace("<CC>", "[A-Z]{2}")).test(source);
  if (key === "currency") return source.includes("ECB");
  return s.split(" ÷ ").every((code) => source.includes(code));
}

// ---- vintage ---------------------------------------------------------------

export interface Vintage {
  /** The as-of most countries share: the column's vintage. */
  modal: string;
  count: number;
  /** Countries whose figure is older than the column's: the amber dot. */
  older: { asOf: string; rows: AtlasRow[] }[];
}

const asOfOf = (r: AtlasRow, key: ColumnKey) => r[key].asOf;

/** As-of strings sort as text: `2024` < `2024-12`, `2024-Q4` < `2025`. Same format within a column. */
export function vintageOf(rows: AtlasRow[], key: ColumnKey): Vintage {
  const counts = new Map<string, number>();
  for (const r of rows)
    counts.set(asOfOf(r, key), (counts.get(asOfOf(r, key)) ?? 0) + 1);
  const [modal, count] = [...counts].sort(
    (a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1),
  )[0] ?? ["", 0];
  const older = [...counts.keys()]
    .filter((a) => a < modal)
    .sort()
    .map((asOf) => ({
      asOf,
      rows: rows.filter((r) => asOfOf(r, key) === asOf),
    }));
  return { modal, count, older };
}

/** The slugs that get the amber dot in this column. */
export function olderSlugs(rows: AtlasRow[], key: ColumnKey): Set<string> {
  return new Set(
    vintageOf(rows, key).older.flatMap((o) => o.rows.map((r) => r.slug)),
  );
}

const ONES = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty"];

/** 0 to 39 in words, "no" for 0; larger counts stay digits. */
export function count(n: number): string {
  if (n < 20) return ONES[n];
  if (n >= 40) return String(n);
  return n % 10 === 0
    ? TENS[n / 10]
    : `${TENS[Math.floor(n / 10)]}-${ONES[n % 10]}`;
}

function join(names: string[]): string {
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : names[0];
}

/** "2025 for nineteen countries; 2024 for China, Japan, New Zealand and the United States." */
export function vintageLine(v: Vintage, total: number): string {
  if (v.older.length === 0)
    return `${v.modal}, for all ${count(total)} countries`;
  const rest = v.older.map(
    (o) => `${o.asOf} for ${join(o.rows.map((r) => nm(r)))}`,
  );
  return `${v.modal} for ${count(v.count)} countries; ${rest.join("; ")}`;
}

// ---- the popover ------------------------------------------------------------

export interface ColumnInfo {
  rows: { label: string; value: string }[];
  note: string;
}

const CHANGE_WINDOW: Record<string, (start: string, end: string) => string> = {
  shares: (s, e) => `January ${s} to December ${e}`,
  housing: (s, e) => `Q1 ${s} to Q4 ${e}`,
  prices: (s, e) => `${s} to ${e}, annual averages`,
  currency: (s, e) => `January ${s} to December ${e}, monthly averages`,
};

export function columnInfo(
  key: ColumnKey,
  rows: AtlasRow[],
  win: WindowStart,
  end: string,
): ColumnInfo {
  const f = COLUMN_FACTS[key];
  const out: { label: string; value: string }[] = [
    { label: "Source", value: f.source },
    { label: "Series", value: f.series },
  ];
  if (f.base) out.push({ label: "Base", value: f.base });
  out.push({ label: "Cadence", value: f.cadence });
  const w = CHANGE_WINDOW[key];
  if (w)
    out.push({
      label: "Window",
      value: `${w(win, end)} (${windowLabel(win, end)}), the latest year every country has for all four`,
    });
  out.push({
    label: "Vintage",
    value: vintageLine(vintageOf(rows, key), rows.length),
  });
  return { rows: out, note: f.note };
}
