import { dayMonthYear } from "@/lib/dates";
import type { CityResponse, HousingTag } from "@/lib/market-schemas";

/**
 * The cost-of-living chain on a city page (Phase 16 step 4): every step from the
 * survey's own figure to the euro value is a citation with its year and source,
 * not an assumption. The server derives the numbers (step 3); this words them.
 * Pure, so the wording is testable.
 */

/** `¥130,920`, `€1,224.64`, `R$ 2,583.34`: the survey's own digits, cents only where it has them. */
export function money(value: number, currency: string): string {
  const whole = currency === "JPY" || currency === "KRW" || Number.isInteger(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2,
  }).format(value);
}

/** A phrase from the survey data as a sentence's body, without its own full stop: the page adds
 * one, and three of the survey notes already end in one ("households.." on Milan's page). */
export const sentence = (text: string): string => text.replace(/[\s.]+$/, "");

export const euro = (value: number): string => money(value, "EUR");

export interface ChainStep {
  key: "survey" | "derived" | "cpi" | "rate";
  title: string;
  text: string;
  source: string;
}

export const dayLabel = dayMonthYear;

export function costChain(c: CityResponse): ChainStep[] {
  const { headline } = c.survey;
  const { carried, eur } = c.cost;
  const steps: ChainStep[] = [
    {
      key: "survey",
      title: "The survey's figure",
      text: `${money(headline.value, headline.currency)} a month, ${headline.year}. ${sentence(headline.label)}.`,
      source: `${c.survey.publisher} · ${c.survey.instrument}`,
    },
  ];
  if (headline.derived) {
    steps.push({ key: "derived", title: "Derived", text: headline.derived, source: "arithmetic shown, not a published figure" });
  }

  if (carried.value !== null && carried.from && carried.to && carried.factor !== null) {
    steps.push({
      key: "cpi",
      title: `Carried to ${carried.to.year} prices`,
      text:
        `${c.country}'s consumer price index was ${carried.from.index} in ${carried.from.year} and ${carried.to.index} in ${carried.to.year}, ` +
        `so × ${carried.factor}: ${money(carried.value, headline.currency)} in ${carried.to.year} prices. ` +
        `The latest published CPI year is the furthest it is carried.`,
      source: carried.source,
    });
  } else {
    steps.push({
      key: "cpi",
      title: "No carry-forward",
      text:
        carried.to !== null
          ? `The survey (${headline.year}) is not older than ${c.country}'s latest CPI year (${carried.to.year}), so nothing is carried: a year of inflation not yet published is not guessed.`
          : `${c.country}'s consumer price index could not be read, so the figure stays in ${headline.year} prices.`,
      source: carried.source,
    });
  }

  if (eur.reason === "euro") {
    steps.push({ key: "rate", title: "In euros", text: `${c.country} uses the euro: no conversion.`, source: "the euro" });
  } else if (eur.value !== null && eur.rate !== null) {
    const shown = eur.basis === "carried" ? "carried figure" : "survey's figure";
    steps.push({
      key: "rate",
      title: "In euros",
      text: `At ${eur.rate} ${headline.currency} per euro, the ECB's ${eur.year} average, the ${shown} is ${euro(eur.value)}.`,
      source: eur.source,
    });
  } else {
    steps.push({
      key: "rate",
      title: "In euros",
      text: `Not converted: ${eur.reason ?? "no ECB rate"}.`,
      source: eur.source,
    });
  }
  return steps;
}

/** The housing assumption in plain words, under the figure (research/city-surveys.md, "Housing on the city page"). */
export const HOUSING_TAG_TEXT: Record<HousingTag, string> = {
  private_rent: "Housing: private rent",
  welfare_ceiling: "Housing: a welfare ceiling",
  imputed_rent: "Housing: includes imputed rent",
  imputed_rent_excluded: "Housing: excludes imputed rent",
  averaged_all_residents: "Housing: rent averaged across all residents",
  derived_rent: "Housing: a rent added to the survey",
  survey_component: "Housing: a component of the budget",
  included_not_separate: "Housing: inside the total, not shown on its own",
  not_in_survey: "Housing: not in the survey",
};
