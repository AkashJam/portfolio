/**
 * Local-currency ↔ EUR conversion for the Cost-of-Living series
 * (components/market/CostOfLivingChart.tsx) — extracted into pure
 * functions so it's unit-testable (§21) without mounting the chart.
 */
export function deriveFxRate(localValue: number, eurValue: number): number {
  return eurValue / localValue;
}

export function convertToEur(localAmount: number, rate: number): number {
  return localAmount * rate;
}
