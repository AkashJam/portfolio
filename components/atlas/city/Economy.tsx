import { LABEL } from "@/lib/atlas-labels";
import type { CityResponse, Sourced } from "@/lib/market-schemas";


function figure(s: Sourced, digits = 1): string {
  return s.value === null ? "—" : s.value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/**
 * *The economy* (Phase 16 step 4; Phase 22 step 4): the five macro figures as cards, each
 * with its year, and what the economy is made of as one bar of GDP shares. The sources
 * and the derived residual (taxes less subsidies) are behind "How this is calculated".
 * A value the World Bank does not publish shows a dash and the reason, never a stand-in.
 */
export function Economy({ city }: { city: CityResponse }) {
  const m = city.macro;
  const rows: { key: string; label: string; s: Sourced; text: string }[] = [
    { key: "inflation", label: `${LABEL.prices.name}, one year`, s: m.inflation, text: `${figure(m.inflation)}%` },
    { key: "spending", label: "Average spending per person", s: m.everydaySpendingEur, text: `€${figure(m.everydaySpendingEur, 0)} a month` },
    { key: "gni", label: LABEL.gniPpp.name, s: m.gniPpp, text: `$${figure(m.gniPpp, 0)}` },
    { key: "unemployment", label: "Unemployment", s: m.unemployment, text: `${figure(m.unemployment)}%` },
    { key: "life", label: "Life expectancy", s: m.lifeExpectancy, text: `${figure(m.lifeExpectancy)} years` },
  ];
  const c = city.composition;
  const bar: { key: string; label: string; s: Sourced; token: string }[] = [
    { key: "services", label: "Services", s: c.services, token: "var(--brand-hover)" },
    { key: "industry", label: "Industry", s: c.industry, token: "color-mix(in oklab, var(--brand) 55%, var(--panel))" },
    { key: "agriculture", label: "Agriculture", s: c.agriculture, token: "var(--text-muted)" },
    { key: "residual", label: "Taxes less subsidies", s: c.residual, token: "var(--hairline)" },
  ];
  const shown = bar.filter((b) => b.s.value !== null && b.s.value > 0);
  return (
    <section aria-labelledby="economy" data-testid="economy">
      <h2 id="economy" className="text-small font-semibold uppercase tracking-[0.16em] text-text">
        The economy
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.key} data-testid={`macro-${r.key}`} className="rounded-xl border border-hairline bg-panel px-4 py-3.5">
            <dt className="text-meta text-text-muted">{r.label}</dt>
            <dd className="mt-2.5 font-mono text-[22px] font-medium leading-tight tabular-nums text-text">{r.s.value === null ? "—" : r.text}</dd>
            <dd className="mt-1.5 font-mono text-meta text-text-muted">{r.s.value === null ? `${r.s.reason ?? "unpublished"} · ${r.s.asOf}` : r.s.asOf}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-8 text-body font-medium text-text">What the economy is made of</h3>
      <p className="mt-1 max-w-measure text-small text-text-muted">
        What the country produces, which is what most people there work in; not which companies move the stock market.
      </p>
      <div role="img" aria-label={`${city.country}'s economy by share of GDP: ${shown.map((b) => `${b.label} ${figure(b.s)}%`).join(", ")}.`} className="mt-3.5 flex h-3 gap-0.5 overflow-hidden rounded">
        {shown.map((b) => (
          <span key={b.key} data-testid="composition-segment" className="block h-full" style={{ width: `${b.s.value}%`, background: b.token }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-meta text-text-muted">
        {bar.map((b) => (
          <li key={b.key} data-testid={`composition-${b.key}`}>
            {/* A key to the bar above: with neutral marks the order alone is not enough. */}
            <i aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-[2px] align-[-1px]" style={{ background: b.token }} />
            {b.label} <b className="ml-1.5 font-mono font-medium text-text">{b.s.value === null ? "—" : `${figure(b.s)}%`}</b>
            {b.key === "industry" && c.manufacturing.value !== null && <span> (manufacturing {figure(c.manufacturing)}%)</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
