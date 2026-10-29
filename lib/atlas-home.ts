import { inSentence } from "@/lib/atlas-labels";
import { MINUS, columnValue, formatChange, formatYears, windowLabel, type ColumnKey } from "@/lib/atlas";
import type { Fig, Reading } from "@/lib/atlas-readings";
import type { AtlasRow, DisplayRate, WindowStart } from "@/lib/market-schemas";

// The home city (Phase 16 step 6; mockups/atlas-v1/atlas-home.html). One control
// with four effects: the crosshairs, the pinned row, the comparison line under each
// cited figure, and the display currency. Every comparison is arithmetic over values
// already on the page, drawn in the accent colour so it never impersonates a source.
// Pure, so the arithmetic and the wording are testable.

// ---- display currency -------------------------------------------------------

const wholeCurrency = (code: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });

/** A euro amount shown in the home currency at the one rate. */
export function homeMoney(eur: number, rate: DisplayRate): string {
  return wholeCurrency(rate.currency).format(eur * rate.perEur).replace("-", MINUS);
}

/** The rows with everyday spending re-expressed at the one rate; every other value is untouched. */
export function convertRows(rows: AtlasRow[], rate: DisplayRate | null): AtlasRow[] {
  if (!rate) return rows;
  return rows.map((r) =>
    r.everydaySpendingEur.value === null
      ? r
      : { ...r, everydaySpendingEur: { ...r.everydaySpendingEur, value: r.everydaySpendingEur.value * rate.perEur, unit: rate.currency } },
  );
}

function symbolOf(code: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
}

const currencyName = (code: string): string => new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;

/** The one dated line under the picker: `Shown in Japanese yen at ¥169.04 per € — ECB reference rate, 2025 average.` */
export function rateLine(rate: DisplayRate): string {
  return `Shown in ${currencyName(rate.currency)} at ${symbolOf(rate.currency)}${rate.perEur.toFixed(2)} per € — ECB reference rate, ${rate.year} average. Every € figure in the table and on the axis uses this one rate.`;
}

/** What a non-euro home with no rate says instead: the figures stay in euros, and why. */
export function noRateLine(home: AtlasRow): string {
  return `Shown in euros: the ECB publishes no annual average for ${home.country}'s currency (${home.currency.derived ?? "none"}), so there is no rate to convert at.`;
}

export const isEuroArea = (r: AtlasRow): boolean => r.currency.reason === "euro";

// ---- the comparison line ----------------------------------------------------

type Kind = "points" | "ratio" | "years" | "none";
const KIND: Record<ColumnKey, Kind> = {
  shares: "points",
  housing: "points",
  prices: "points",
  currency: "none",
  everydaySpendingEur: "ratio",
  gniPpp: "ratio",
  unemployment: "points",
  lifeExpectancy: "years",
};

/** What a column's header says its comparison line is. */
export function deltaUnit(key: ColumnKey): string {
  switch (KIND[key]) {
    case "points":
      return "Δ in points";
    case "ratio":
      return "Δ as ×";
    case "years":
      return "Δ in years";
    default:
      return "no Δ";
  }
}

const signed = (v: number, digits: number): string => {
  const r = Number(v.toFixed(digits));
  if (r === 0) return digits ? (0).toFixed(digits) : "0";
  return `${r > 0 ? "+" : MINUS}${Math.abs(r).toFixed(digits)}`;
};

/**
 * The line under a cited figure: this row against the home, same window. Null for
 * the home row itself, for the currency column (it stays against the euro), and
 * wherever either figure is missing.
 */
export function homeDelta(row: AtlasRow, home: AtlasRow, key: ColumnKey, window: WindowStart): string | null {
  if (row.slug === home.slug || KIND[key] === "none") return null;
  const a = columnValue(row, key, window);
  const b = columnValue(home, key, window);
  if (a === null || b === null) return null;
  switch (KIND[key]) {
    case "points":
      return `${signed(key === "unemployment" ? a - b : Math.round(a) - Math.round(b), key === "unemployment" ? 1 : 0)}`;
    case "ratio":
      return b === 0 ? null : `×${(a / b).toFixed(2)}`;
    case "years":
      return signed(a - b, 1);
    default:
      return null;
  }
}

/** The computed row of a column's provenance popover, naming both legs. */
export function computedLine(key: ColumnKey, home: AtlasRow, window: WindowStart, end: string, rate: DisplayRate | null): string {
  switch (KIND[key]) {
    case "none":
      return `No Δ: the column stays against the euro, the ECB's own published rates, so ${home.city}'s row is not turned into a cross rate.`;
    case "ratio":
      return `× = this row ÷ ${home.city}'s, both from the column's source and as-of${
        key === "everydaySpendingEur" && rate
          ? `. The figures are shown in ${rate.currency}: euros × ${rate.perEur.toFixed(2)}, the ECB's ${rate.year} average`
          : ""
      }.`;
    case "years":
      return `Δ = this row − ${home.city}'s, in years; both legs from the column's source and as-of.`;
    default:
      return `Δ = this row − ${home.city}'s, in percentage points over the same window (${windowLabel(window, end)}); both legs from the column's source.`;
  }
}

// ---- the reading against home -------------------------------------------------

/**
 * A compact reading of one country against the home city: its published figures,
 * each with the comparison, and the home's own for reference. Null when the two are
 * the same row. `spend` formats the spending figure in the display currency.
 */
export function homeReading(target: AtlasRow, home: AtlasRow, window: WindowStart, spend: (v: number) => string): Reading | null {
  if (target.slug === home.slug) return null;
  const figs: Fig[] = [];
  const put = (key: ColumnKey, text: (v: number) => string, noun: string) => {
    const v = columnValue(target, key, window);
    if (v === null) return;
    const d = homeDelta(target, home, key, window);
    figs.push({ value: text(v), label: `${target.country}, ${noun}${d ? ` · ${d} ${home.city}` : ""}`, tone: "plain" });
  };
  put("everydaySpendingEur", spend, "spend/mo");
  put("housing", formatChange, inSentence("housing"));
  put("unemployment", (v) => `${v.toFixed(1)}%`, "unemployment");
  put("lifeExpectancy", (v) => `${formatYears(v)} yrs`, "life exp.");
  const hs = columnValue(home, "everydaySpendingEur", window);
  const hh = columnValue(home, "housing", window);
  const hl = columnValue(home, "lifeExpectancy", window);
  const stands = [hs !== null ? spend(hs) : null, hh !== null ? `${formatChange(hh)} housing` : null, hl !== null ? `${formatYears(hl)} years` : null].filter(Boolean);
  return {
    title: `${target.city} against ${home.city}`,
    figs,
    sentence: `The published figures lead; the comparison with ${home.city} follows each. ${home.city} stands at ${stands.join(", ")}.`,
  };
}
