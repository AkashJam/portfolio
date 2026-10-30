import { MINUS } from "@/lib/atlas";
import { linearTicks } from "@/lib/city-path";
import type { ChangeBlock } from "@/lib/market-schemas";

/**
 * The change block as SVG (Phase 22 step 4; mockups/site-review/atlas-city-milan.html .chg):
 * a survey's own figure, the country's consumer prices and its average spending per person,
 * each 100 in the base year. Built on the server like the other city charts, so it is in the
 * HTML before any script runs. Pure, so the geometry is testable.
 */
export const CHG_W = 800;
export const CHG_H = 280;
const LEFT = 44;
const RIGHT = 700;
const TOP = 14;
const BOTTOM = 250;
/** Two end labels (a name and a figure) need this much height between them. */
const LABEL_GAP = 32;

/** What the survey line is called on the chart: the kind, short. The ticker's label can be a whole phrase. */
const KIND_SHORT: Record<string, string> = {
  poverty_line: "Poverty line",
  minimum_income_standard: "Minimum income",
  living_wage: "Living wage",
  benefit_or_reference_budget: "Benefit standard",
  average_spending: "Average spending",
};
export const kindShort = (kind: string, label: string): string => KIND_SHORT[kind] ?? label;

export type LineKey = "survey" | "prices" | "spending";

export interface ChangeGeometry {
  lines: Record<LineKey, string>;
  yTicks: { y: number; label: string; base: boolean }[];
  xTicks: { x: number; label: string }[];
  /** The end of each line: its dot, and where its label sits once labels are kept apart. */
  ends: { key: LineKey; name: string; x: number; y: number; labelY: number; rise: string }[];
  alt: string;
}

const r1 = (v: number): number => Math.round(v * 10) / 10;

/** "+23%", "−4%": the rise to the nearest point. */
const signed = (v: number): string => {
  const n = Math.round(v);
  return n < 0 ? `${MINUS}${Math.abs(n)}%` : `+${n}%`;
};

export function changeGeometry(b: ChangeBlock, surveyName: string, city: string, country: string, average = false): ChangeGeometry {
  const all = [...b.survey, ...b.prices, ...b.spending].map((p) => p.index);
  const lo = Math.min(...all, 100);
  const hi = Math.max(...all, 100);
  const ticks = linearTicks(lo, hi, 5);
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 10;
  // The axis runs a whole step either side of the data, so no line touches its edge.
  const d0 = Math.floor(lo / step) * step;
  const d1 = Math.ceil(hi / step) * step;
  const y = (v: number): number => r1(TOP + (1 - (v - d0) / (d1 - d0)) * (BOTTOM - TOP));
  const n = b.survey.length;
  const x = (i: number): number => r1(LEFT + (i / (n - 1)) * (RIGHT - LEFT));
  const path = (pts: { index: number }[]): string => pts.map((p, i) => `${x(i)},${y(p.index)}`).join(" ");

  const yTicks: ChangeGeometry["yTicks"] = [];
  for (let v = d0; v <= d1 + 1e-9; v += step) yTicks.push({ y: y(v), label: String(Math.round(v)), base: Math.round(v) === 100 });

  // A label every two years from the base, and always the last year; the one before it goes if it would crowd it.
  const years = b.survey.map((p) => p.year);
  const marks = years.filter((yr) => (yr - b.baseYear) % 2 === 0);
  const end = years[years.length - 1];
  if (marks[marks.length - 1] !== end) {
    if (end - marks[marks.length - 1] < 2) marks.pop();
    marks.push(end);
  }
  const xTicks = marks.map((yr) => ({ x: x(years.indexOf(yr)), label: String(yr) }));

  const last = (pts: { index: number }[]) => pts[pts.length - 1].index;
  const ends: ChangeGeometry["ends"] = [
    { key: "survey" as const, name: surveyName, v: last(b.survey), rise: b.rises.survey },
    { key: "prices" as const, name: "Prices", v: last(b.prices), rise: b.rises.prices },
    { key: "spending" as const, name: average ? "National" : "Spending", v: last(b.spending), rise: b.rises.spending },
  ]
    .map((e) => ({ key: e.key, name: e.name, x: RIGHT, y: y(e.v), labelY: y(e.v), rise: signed(e.rise) }))
    .sort((a, c) => a.y - c.y);
  // Keep the labels apart: each sits below the one above if they would touch.
  for (let i = 1; i < ends.length; i++) ends[i].labelY = Math.max(ends[i].labelY, ends[i - 1].labelY + LABEL_GAP);

  const spent = average ? "national household spending per person" : "average spending per person";
  const alt =
    `${city}'s ${surveyName.toLowerCase()}, ${country}'s prices and ${spent}, each 100 in ${b.baseYear}, to ${b.endYear}: ` +
    `the ${surveyName.toLowerCase()} ends at ${Math.round(last(b.survey))}, prices at ${Math.round(last(b.prices))}, spending at ${Math.round(last(b.spending))}`;

  return { lines: { survey: path(b.survey), prices: path(b.prices), spending: path(b.spending) }, yTicks, xTicks, ends, alt };
}

export const CHANGE_LEFT = LEFT;
export const CHANGE_RIGHT = RIGHT;
