import type { CityPart, CityResponse } from "@/lib/market-schemas";
import { money } from "@/lib/city-cost";

/**
 * The basket split as one stacked bar (bearing.md #114; research/city-surveys.md,
 * "How the split is drawn"): the strip shows the whole budget as one shape, the
 * summary names the largest slice, and a native `<details>` lists every part. A
 * ceiling is hatched, a rent added to a survey that leaves housing out is outlined,
 * and a part that hides housing says so. Pure, so the arithmetic and wording are
 * testable.
 */
export interface Segment {
  label: string;
  amount: string;
  share: string;
  /** Percent of the bar's width. */
  width: number;
  /** Opacity steps down by rank, so neighbours differ without a legend of colours. */
  opacity: number;
  hatched: boolean;
  outlined: boolean;
  includesHousing: boolean;
  derived: string | null;
}

const pct = (v: number): string => `${v.toFixed(1)}%`;

export function segments(parts: CityPart[], currency: string, tag: CityResponse["survey"]["housing"]["tag"]): Segment[] {
  const total = parts.reduce((s, p) => s + p.share, 0) || 1;
  const rank = [...parts].sort((a, b) => b.share - a.share).map((p) => p.label);
  return parts.map((p) => ({
    label: p.label,
    amount: money(p.amount, currency),
    share: pct(p.share),
    width: Math.round((p.share / total) * 10000) / 100,
    opacity: Math.round((1 - (rank.indexOf(p.label) / Math.max(rank.length - 1, 1)) * 0.65) * 100) / 100,
    hatched: p.hatched === true,
    // Oslo-style: the survey omits housing, so a rent was added from another source.
    outlined: tag === "derived_rent" && p.derived !== undefined,
    includesHousing: p.includesHousing === true,
    derived: p.derived ?? null,
  }));
}

/** `Housing · ¥53,700 · 41.0%`: the largest slice, for the closed summary. */
export function largest(parts: CityPart[], currency: string): string {
  const top = [...parts].sort((a, b) => b.share - a.share)[0];
  return `${top.label} · ${money(top.amount, currency)} · ${pct(top.share)}`;
}

/** The bar's text alternative: every part with its amount and share. */
export function basketAlt(city: string, parts: CityPart[], currency: string): string {
  return `${city}'s budget by part: ${parts.map((p) => `${p.label} ${money(p.amount, currency)}, ${pct(p.share)}`).join("; ")}.`;
}
