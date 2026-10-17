import { euro } from "@/lib/city-cost";
import type { Affordability } from "@/lib/market-schemas";

/**
 * The words of the affordability block (Phase 16 step 5). The ticker derives the
 * ratio and returns both legs; this prints them. A survey that reports average
 * consumption (Shanghai, Mumbai) is worded as average against average, because
 * dividing one average by another says how a city spends against its country, not
 * what a floor costs a typical person. Pure, so the wording is testable.
 */
export interface AffordView {
  /** `56.1%`, or null where a leg is missing. */
  ratio: string | null;
  sentence: string;
  costLabel: string;
  costLine: string;
  spendingLabel: string;
  spendingLine: string;
  gap: string;
  caveat: string | null;
  reason: string | null;
}

const plural = (n: number, w: string): string => (n === 1 ? w : `${w}s`);

export function affordView(a: Affordability, country: string, city: string): AffordView {
  const average = a.measure === "average";
  const ratio = a.ratio === null ? null : `${a.ratio.toFixed(1)}%`;

  const sentence =
    ratio === null
      ? "No ratio can be drawn."
      : average
        ? `The average spend here is ${ratio} of the national average per person in ${country}.`
        : `The cost of living is ${ratio} of what a typical person in ${country} spends.`;

  const converted = a.cost.rateYear > 0 ? `, converted at the ECB's ${a.cost.rateYear} average` : "";
  const costLine =
    a.cost.eur === null
      ? "not converted to euros"
      : a.cost.basis === "carried"
        ? `${euro(a.cost.eur)} a month, the survey's figure carried to ${a.cost.priceYear} prices${converted}`
        : `${euro(a.cost.eur)} a month, the survey's own figure in ${a.cost.priceYear} prices${converted}`;

  const spendingLine =
    a.spending.value === null
      ? `unpublished${a.spending.reason ? `: ${a.spending.reason}` : ""}`
      : `${euro(a.spending.value)} a month per person · ${a.spending.source} · ${a.spending.asOf}`;

  const n = Math.abs(a.gapYears);
  const gap =
    a.ratio === null
      ? ""
      : n === 0
        ? `Both legs are in ${a.cost.priceYear}.`
        : `The legs are ${n} ${plural(n, "year")} apart: the cost is in ${a.cost.priceYear} prices, the spending is ${a.spending.asOf}'s.`;

  return {
    ratio,
    sentence,
    costLabel: average ? `Average spend, ${city}` : "Cost of living",
    costLine,
    spendingLabel: average ? `National average spend, ${country}` : `Everyday spending, ${country}`,
    spendingLine,
    gap,
    caveat: a.caveat ?? null,
    reason: a.reason ?? null,
  };
}
