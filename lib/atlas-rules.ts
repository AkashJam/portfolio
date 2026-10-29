import { columnValue } from "@/lib/atlas";
import { nm } from "@/lib/atlas-readings";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

// The worked example under "Compare changes, not amounts" (phase18.md I53;
// bearing #87): two countries whose house prices moved in opposite directions,
// computed from the rows so it can never go stale. Italy and the United States
// are the pair the mock draws; if either has no figure, the biggest fall and
// the biggest rise stand in, and with no fall and rise there is no example.

export interface RulesExample {
  fell: { country: string; pct: number };
  rose: { country: string; pct: number };
}

export function rulesExample(rows: AtlasRow[], window: WindowStart): RulesExample | null {
  const moves = rows
    .map((r) => ({ slug: r.slug, country: r.country, v: columnValue(r, "housing", window) }))
    .filter((m): m is { slug: string; country: string; v: number } => m.v !== null);
  const pick = (slug: string) => moves.find((m) => m.slug === slug);
  let fell = pick("italy");
  let rose = pick("united-states");
  if (!fell || !rose || fell.v >= 0 || rose.v <= 0) {
    fell = moves.filter((m) => m.v < 0).sort((a, b) => a.v - b.v)[0];
    rose = moves.filter((m) => m.v > 0).sort((a, b) => b.v - a.v)[0];
  }
  if (!fell || !rose) return null;
  return {
    fell: { country: fell.country, pct: Math.round(Math.abs(fell.v)) },
    rose: { country: rose.country, pct: Math.round(rose.v) },
  };
}

/** `Since 2010, house prices fell 26% in Italy and rose 59% in the United States.` */
export function rulesExampleSentence(ex: RulesExample, window: WindowStart): string {
  return `Since ${window}, house prices fell ${ex.fell.pct}% in ${nm(ex.fell)} and rose ${ex.rose.pct}% in ${nm(ex.rose)}. Compare those changes, not what a home costs in each.`;
}

