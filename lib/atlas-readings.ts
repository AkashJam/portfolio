import {
  type ColumnKey,
  columnValue,
  formatChange,
  formatEur,
  formatYears,
  MINUS,
} from "@/lib/atlas";
import { measureOf } from "@/lib/atlas-plot";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

// The five Ask chips and their worked readings (Phase 11 step 4; bearing.md
// "Presets, and the line the worked example must not cross", #86, #87).
//
// A reading asserts only what this code has just checked: figures are computed
// from the rows, and every sentence is built from tests the page can run on
// those figures: rose, fell or unchanged from a sign; higher or lower from a
// comparison; above or below the line from shares against prices. No word of
// size (nearly, about, sharply): the figures carry the size. When a figure a
// claim rests on is missing, the reading falls back to the plain generated line.

export type ChipId =
  | "spend-housing"
  | "shares-housing"
  | "prices-shares"
  | "spend-life"
  | "shares-currency";

export interface Chip {
  id: ChipId;
  label: string;
  x: ColumnKey;
  y: ColumnKey;
  /** The two countries the reading is about (slugs), in reading order. */
  a: string;
  b: string;
}

/** Every chip opens on the mocks' window, 2010. */
export const CHIP_WINDOW: WindowStart = "2010";

export const CHIPS: Chip[] = [
  {
    id: "spend-housing",
    label: "What people spend · where housing is heading",
    x: "everydaySpendingEur",
    y: "housing",
    a: "italy",
    b: "united-states",
  },
  {
    id: "shares-housing",
    label: "Did savings and housing rise together?",
    x: "shares",
    y: "housing",
    a: "india",
    b: "italy",
  },
  {
    id: "prices-shares",
    label: "Did savings outrun prices?",
    x: "prices",
    y: "shares",
    a: "turkiye",
    b: "japan",
  },
  {
    id: "spend-life",
    label: "Do people live longer where they spend more?",
    x: "everydaySpendingEur",
    y: "lifeExpectancy",
    a: "japan",
    b: "united-states",
  },
  {
    id: "shares-currency",
    label: "What has currency done to savings?",
    x: "shares",
    y: "currency",
    a: "japan",
    b: "turkiye",
  },
];

export interface Fig {
  value: string;
  label: string;
  tone: "up" | "down" | "plain";
}

export interface Reading {
  /** "Milan against New York". */
  title: string;
  figs: Fig[];
  sentence: string;
}

const TAIL =
  " The page draws no conclusion from that; the two axes together are what let you draw one.";

// ---- small checked statements ---------------------------------------------

const rounded = (v: number) => Math.round(v);

/** A country as it reads in a sentence: "the United States", "Japan". */
function nm(r: AtlasRow, lead = false): string {
  const the = r.country === "United States" || r.country === "United Kingdom";
  return the ? `${lead ? "The" : "the"} ${r.country}` : r.country;
}

/** rose / fell / was unchanged, from the figure as it is displayed. */
function moved(v: number): string {
  const r = rounded(v);
  return r > 0 ? "rose" : r < 0 ? "fell" : "was unchanged";
}

/** "Shares rose in both" when both moved the same way, else one clause each. */
function pairMoved(
  noun: string,
  va: number,
  vb: number,
  a: string,
  b: string,
): string {
  const ra = rounded(va);
  const rb = rounded(vb);
  if (ra > 0 && rb > 0) return `${noun} rose in both`;
  if (ra < 0 && rb < 0) return `${noun} fell in both`;
  return `${noun} ${moved(va)} in ${a} and ${moved(vb)} in ${b}`;
}

/** A change set against another change: (1+p)/(1+q) - 1, in percent. */
const against = (p: number, q: number) =>
  ((1 + p / 100) / (1 + q / 100) - 1) * 100;
/** Two changes compounded: (1+p)(1+q) - 1, in percent. */
const compound = (p: number, q: number) =>
  ((1 + p / 100) * (1 + q / 100) - 1) * 100;

/** "up +38%", "down 86%", "unchanged": the word carries the direction, so a fall is not signed twice. */
function upDown(v: number): string {
  const r = rounded(v);
  if (r > 0) return `up ${formatChange(v)}`;
  if (r < 0) return `down ${formatChange(v).replace(MINUS, "")}`;
  return "unchanged";
}

const figLabel: Record<ColumnKey, string> = {
  everydaySpendingEur: "spend/mo",
  shares: "shares",
  housing: "housing, real",
  prices: "prices",
  currency: "currency vs EUR",
  gniPpp: "income",
  unemployment: "unemployment",
  lifeExpectancy: "years",
};

const shortName: Record<ColumnKey, string> = {
  everydaySpendingEur: "everyday spending",
  shares: "shares",
  housing: "housing",
  prices: "prices",
  currency: "currency",
  gniPpp: "income",
  unemployment: "unemployment",
  lifeExpectancy: "life expectancy",
};

function fig(row: AtlasRow, key: ColumnKey, v: number): Fig {
  const measure = measureOf(key);
  if (measure.kind === "change") {
    const r = rounded(v);
    return {
      value: formatChange(v),
      label: `${row.country}, ${figLabel[key]}`,
      tone: r > 0 ? "up" : r < 0 ? "down" : "plain",
    };
  }
  const value =
    key === "everydaySpendingEur"
      ? formatEur(v)
      : key === "lifeExpectancy"
        ? formatYears(v)
        : measure.tick(v);
  return { value, label: `${row.country}, ${figLabel[key]}`, tone: "plain" };
}

interface Ctx {
  rows: AtlasRow[];
  win: WindowStart;
}

const find = (c: Ctx, slug: string) => c.rows.find((r) => r.slug === slug);
const val = (c: Ctx, r: AtlasRow, key: ColumnKey) => columnValue(r, key, c.win);

// ---- the five chips -------------------------------------------------------

type Builder = (c: Ctx, a: AtlasRow, b: AtlasRow) => Reading | null;

const BUILDERS: Record<ChipId, Builder> = {
  "spend-housing": (c, a, b) => {
    const sa = val(c, a, "everydaySpendingEur");
    const sb = val(c, b, "everydaySpendingEur");
    const ha = val(c, a, "housing");
    const hb = val(c, b, "housing");
    if (sa === null || sb === null || ha === null || hb === null || sa === sb)
      return null;
    const [more, less] = sb > sa ? [b, a] : [a, b];
    return {
      title: `${a.city} against ${b.city}`,
      figs: [
        fig(a, "everydaySpendingEur", sa),
        fig(a, "housing", ha),
        fig(b, "everydaySpendingEur", sb),
        fig(b, "housing", hb),
      ],
      sentence: `${more.city} spends more than ${less.city}, and after inflation housing ${moved(ha)} in ${nm(a)} and ${moved(hb)} in ${nm(b)}.${TAIL}`,
    };
  },

  "shares-housing": (c, a, b) => {
    const sa = val(c, a, "shares");
    const sb = val(c, b, "shares");
    const ha = val(c, a, "housing");
    const hb = val(c, b, "housing");
    if (sa === null || sb === null || ha === null || hb === null) return null;
    return {
      title: `${a.city} against ${b.city}`,
      figs: [
        fig(a, "shares", sa),
        fig(a, "housing", ha),
        fig(b, "shares", sb),
        fig(b, "housing", hb),
      ],
      sentence: `${pairMoved("Shares", sa, sb, nm(a), nm(b))}; ${pairMoved("housing", ha, hb, nm(a), nm(b))}.${TAIL}`,
    };
  },

  "prices-shares": (c, a, b) => {
    const sa = val(c, a, "shares");
    const sb = val(c, b, "shares");
    const pa = val(c, a, "prices");
    const pb = val(c, b, "prices");
    if (sa === null || sb === null || pa === null || pb === null) return null;
    const aboveA = sa > pa;
    const aboveB = sb > pb;
    const line =
      aboveA && aboveB
        ? "Both sit above the line."
        : !aboveA && !aboveB
          ? "Both sit below the line."
          : `${nm(aboveA ? a : b, true)} sits above the line and ${nm(aboveA ? b : a)} below.`;
    const ra = against(sa, pa);
    const rb = against(sb, pb);
    const real = `Set against its own prices, ${nm(a)}'s index is ${upDown(ra)} and ${nm(b)}'s ${upDown(rb)}`;
    // The flip is claimed only when both rose and the order really reverses.
    const flips =
      rounded(sa) > 0 &&
      rounded(sb) > 0 &&
      rounded(ra) > 0 &&
      rounded(rb) > 0 &&
      sa !== sb &&
      sa > sb !== ra > rb;
    const flip = flips
      ? ": the larger rise on the page is the smaller one after inflation"
      : "";
    const below = c.rows
      .map((r) => ({ r, s: val(c, r, "shares"), p: val(c, r, "prices") }))
      .filter(
        (q): q is { r: AtlasRow; s: number; p: number } =>
          q.s !== null && q.p !== null && q.s < q.p,
      )
      .sort((x, y) => x.s - x.p - (y.s - y.p))
      .map((q) => q.r.city);
    const names =
      below.length > 1
        ? `${below.slice(0, -1).join(", ")} and ${below[below.length - 1]}`
        : below[0];
    return {
      title: `${a.city} against ${b.city}`,
      figs: [
        fig(a, "shares", sa),
        fig(a, "prices", pa),
        fig(b, "shares", sb),
        fig(b, "prices", pb),
      ],
      sentence: `${line} ${real}${flip}.${below.length ? ` Below the line: ${names}.` : ""}`,
    };
  },

  "spend-life": (c, a, b) => {
    const sa = val(c, a, "everydaySpendingEur");
    const sb = val(c, b, "everydaySpendingEur");
    const la = val(c, a, "lifeExpectancy");
    const lb = val(c, b, "lifeExpectancy");
    if (
      sa === null ||
      sb === null ||
      la === null ||
      lb === null ||
      sa === sb ||
      la === lb
    )
      return null;
    const spendsMore = sa > sb ? a : b;
    const livesLonger = la > lb ? a : b;
    const claim =
      spendsMore === livesLonger
        ? `Both spending and life expectancy are higher in ${nm(spendsMore)}.`
        : `Spending is higher in ${nm(spendsMore)} and life expectancy is higher in ${nm(livesLonger)}.`;
    return {
      title: `${a.city} against ${b.city}`,
      figs: [
        fig(a, "everydaySpendingEur", sa),
        fig(a, "lifeExpectancy", la),
        fig(b, "everydaySpendingEur", sb),
        fig(b, "lifeExpectancy", lb),
      ],
      sentence: `${claim}${TAIL}`,
    };
  },

  "shares-currency": (c, a, b) => {
    const sa = val(c, a, "shares");
    const sb = val(c, b, "shares");
    const ca = val(c, a, "currency");
    const cb = val(c, b, "currency");
    if (sa === null || sb === null || ca === null || cb === null) return null;
    const ea = compound(sa, ca);
    const eb = compound(sb, cb);
    const flips =
      rounded(sa) > 0 && rounded(sb) > 0 && sa !== sb && sa > sb !== ea > eb;
    const flip = flips
      ? ", so the larger local rise became the smaller one in euro"
      : "";
    return {
      title: `${a.city} against ${b.city}`,
      figs: [
        fig(a, "shares", sa),
        fig(a, "currency", ca),
        fig(b, "shares", sb),
        fig(b, "currency", cb),
      ],
      sentence: `Combined, the two are what a euro holder kept: ${formatChange(ea)} in ${nm(a)} and ${formatChange(eb)} in ${nm(b)}${flip}. Shown as a sum to repeat, never as a column.`,
    };
  },
};

// ---- the generated line ----------------------------------------------------

/**
 * What a cleared chip, or a chip whose claim cannot be checked, shows: the
 * countries highest and lowest on the horizontal axis, with both their figures.
 * Plain facts by construction.
 */
export function generatedReading(
  rows: AtlasRow[],
  x: ColumnKey,
  y: ColumnKey,
  win: WindowStart,
): Reading {
  const pts = rows
    .map((r) => ({ r, vx: columnValue(r, x, win), vy: columnValue(r, y, win) }))
    .filter(
      (p): p is { r: AtlasRow; vx: number; vy: number } =>
        p.vx !== null && p.vy !== null,
    )
    .sort((p, q) => q.vx - p.vx);
  if (pts.length < 2) {
    return {
      title: "Reading this view",
      figs: [],
      sentence: "Too few countries have figures for this pair to read.",
    };
  }
  const hi = pts[0];
  const lo = pts[pts.length - 1];
  const ty = measureOf(y).tick;
  return {
    title: `${hi.r.city} against ${lo.r.city}`,
    figs: [
      fig(hi.r, x, hi.vx),
      fig(hi.r, y, hi.vy),
      fig(lo.r, x, lo.vx),
      fig(lo.r, y, lo.vy),
    ],
    sentence: `${hi.r.city} is highest on ${shortName[x]} and ${lo.r.city} lowest; on ${shortName[y]} they stand at ${ty(hi.vy)} and ${ty(lo.vy)}.`,
  };
}

export function buildReading(
  chipId: ChipId | null,
  rows: AtlasRow[],
  x: ColumnKey,
  y: ColumnKey,
  win: WindowStart,
): Reading {
  const chip = CHIPS.find((c) => c.id === chipId);
  if (chip) {
    const ctx: Ctx = { rows, win };
    const a = find(ctx, chip.a);
    const b = find(ctx, chip.b);
    const reading = a && b ? BUILDERS[chip.id](ctx, a, b) : null;
    if (reading) return reading;
  }
  return generatedReading(rows, x, y, win);
}
