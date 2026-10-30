import { moved, nm } from "@/lib/atlas-readings";
import { seriesDate } from "@/lib/city-path";
import type { ChangeBlock, LongSeries } from "@/lib/market-schemas";

/**
 * The one-line reading under each chart on a city page, and under the change block
 * (Phase 22 step 4; mockups/site-review/atlas-city.html, atlas-city-milan.html). Computed
 * from the series, in a closed vocabulary: the same rules for every city, so no line is a
 * judgement written for one of them. The thresholds are named below. Pure, so the wording
 * is testable.
 */

/** Within this share of the peak (or record) a series is "close to" it. */
export const CLOSE = 0.05;
/** Beyond this share below the peak it is "far below" it; between, "still under". */
export const FAR = 0.3;
/** A survey that rose within this many points of prices is "in step with" them. */
export const IN_STEP = 2;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** `2026-09` → `September 2026`; a quarter (`2025-Q4`) stays as it is. */
function when(date: string): string {
  const [y, m] = date.split("-");
  return /^\d+$/.test(m ?? "") ? `${MONTHS[Number(m) - 1]} ${y}` : date;
}

/** What a currency is called: plural for a quantity ("180 yen"), singular for the unit ("a weaker yen"). */
const CURRENCY: Record<string, [string, string]> = {
  AUD: ["Australian dollars", "Australian dollar"],
  BRL: ["reais", "real"],
  CAD: ["Canadian dollars", "Canadian dollar"],
  CNY: ["yuan", "yuan"],
  GBP: ["pounds", "pound"],
  ILS: ["shekels", "shekel"],
  INR: ["rupees", "rupee"],
  JPY: ["yen", "yen"],
  KRW: ["won", "won"],
  MXN: ["pesos", "peso"],
  NOK: ["kroner", "krone"],
  PLN: ["zloty", "zloty"],
  SGD: ["Singapore dollars", "Singapore dollar"],
  TRY: ["lira", "lira"],
  USD: ["US dollars", "US dollar"],
  ZAR: ["rand", "rand"],
};
export const currencyNouns = (code: string): [string, string] => CURRENCY[code] ?? [code, code];

const WORDS = ["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** How many times a base: "more than double", "more than two and a half times", "more than eleven times". */
function multiple(m: number): string {
  if (m < 2.5) return "more than double";
  if (m < 3) return "more than two and a half times";
  const n = Math.floor(m);
  return `more than ${WORDS[n] || n} times`;
}

/** A level against 100: "more than double", "27% above", "24% below", "level with". */
function against(index: number): string {
  if (index >= 200) return `${multiple(index / 100)}`;
  const pct = Math.round(index - 100);
  return pct === 0 ? "level with" : pct > 0 ? `${pct}% above` : `${Math.abs(pct)}% below`;
}

function figure(v: number): string {
  if (v >= 100) return Math.round(v).toLocaleString("en-US");
  if (v >= 10) return String(Math.round(v * 10) / 10);
  return String(Math.round(v * 100) / 100);
}

function extreme(s: LongSeries): { i: number; value: number } {
  let i = 0;
  s.values.forEach((v, j) => {
    if (v > s.values[i]) i = j;
  });
  return { i, value: s.values[i] };
}

/** The peak, relative to now: "close to", "still under" or "far below", with the date it was set. */
function versus(s: LongSeries, noun: string, mark: (date: string) => string): string {
  const last = s.values[s.values.length - 1];
  const { i, value } = extreme(s);
  const gap = (value - last) / value;
  if (i === s.values.length - 1 || gap <= 0) return `at its ${noun}`;
  const date = mark(seriesDate(s, i));
  return gap <= CLOSE ? `close to ${date} ${noun}` : gap <= FAR ? `still under ${date} ${noun}` : `far below ${date} ${noun}`;
}

/** The share price index (2015 = 100): "At 263 in September 2026, more than two and a half times its 2015 level, in yen and before inflation." */
export function shareReading(s: LongSeries, currency: string, euroArea: boolean): string {
  const last = s.values[s.values.length - 1];
  const [plural, singular] = currencyNouns(currency);
  const base = `At ${figure(last)} in ${when(seriesDate(s, s.values.length - 1))}, ${against(last)} its 2015 level, in ${euroArea ? "euros" : plural} and before inflation.`;
  return euroArea ? base : `${base} The chart below shows what the ${singular} was worth in euros.`;
}

/** The currency (units per euro): "180 yen to the euro in September 2026, close to April's record of 186. A rising line is a weaker yen." */
export function currencyReading(s: LongSeries, currency: string): string {
  const last = s.values[s.values.length - 1];
  const [plural, singular] = currencyNouns(currency);
  const lastDate = seriesDate(s, s.values.length - 1);
  const { i, value } = extreme(s);
  const head = `${figure(last)} ${plural} to the euro in ${when(lastDate)}`;
  const gap = (value - last) / value;
  const recordDate = seriesDate(s, i);
  // "April's record" when it is from the latest reading's year, "the April 2024 record" otherwise.
  const sameYear = recordDate.slice(0, 4) === lastDate.slice(0, 4);
  const ref = sameYear ? `${when(recordDate).split(" ")[0]}'s record` : `the ${when(recordDate)} record`;
  const tail =
    i === s.values.length - 1 || gap <= 0
      ? ", its weakest on record"
      : gap <= CLOSE
        ? `, close to ${ref} of ${figure(value)}`
        : gap <= FAR
          ? `, still under ${ref} of ${figure(value)}`
          : `, far below ${ref} of ${figure(value)}`;
  return `${head}${tail}. A rising line is a weaker ${singular}.`;
}

/** Real house prices (2010 = 100): "21% above 2010, and far below the 1991 peak. This series ends at 2025-Q4, a quarter behind the other countries." */
export function housingReading(s: LongSeries, asOf: string, behind: number): string {
  const last = s.values[s.values.length - 1];
  const rel = against(last);
  const first = rel === "level with" ? "level with 2010" : `${rel} 2010`;
  const peak = versus(s, "peak", (d) => `the ${d.slice(0, 4)}`);
  const lag = behind > 0 ? ` This series ends at ${asOf}, ${behind / 3 === 1 ? "a quarter" : `${behind / 3} quarters`} behind the other countries.` : "";
  return `${first}, and ${peak}.${lag}`;
}

/**
 * The change block. `city` is the place the figure is for (the survey's `area` where it has one, else the city).
 * "Milan's poverty line rose 23% from 2014 to 2025, in step with prices, while what a person in Italy spends on average rose 34%." */
export function changeReading(b: ChangeBlock, city: string, country: string, kindLabel: string, average = false): string {
  const gap = b.rises.survey - b.rises.prices;
  const rel = Math.abs(gap) <= IN_STEP ? "in step with prices" : gap > 0 ? "faster than prices" : "slower than prices";
  // "rose 23%", "fell 3%", or "was unchanged" for a figure that rounds to nothing.
  const change = (n: number) => (Math.round(n) === 0 ? moved(n) : `${moved(n)} ${Math.abs(Math.round(n))}%`);
  // Where the survey is itself average spending (Shanghai, urban Maharashtra), the other line is the country's
  // household spending from the national accounts, a wider group, so it is named as that and not as the same thing.
  const other = average ? "national household spending per person" : `what a person in ${nm({ country })} spends on average`;
  return (
    `${city}'s ${kindLabel.toLowerCase()} ${change(b.rises.survey)} from ${b.baseYear} to ${b.endYear}, ${rel}, ` +
    `while ${other} ${change(b.rises.spending)}.`
  );
}
