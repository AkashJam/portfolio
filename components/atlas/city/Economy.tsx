import type { CityResponse, Sourced } from "@/lib/market-schemas";

const MUTED = "text-meta leading-relaxed text-text-muted";

function figure(s: Sourced, digits = 1): string {
  return s.value === null ? "—" : s.value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/**
 * *The economy* (Phase 16 step 4): the five macro figures, each with its source
 * and as-of, and what the economy is made of as shares of GDP. The residual
 * (taxes less subsidies) is derived and says so. A value the World Bank does not
 * publish shows a dash and the reason, never a stand-in.
 */
export function Economy({ city }: { city: CityResponse }) {
  const m = city.macro;
  const rows: { key: string; label: string; s: Sourced; text: string }[] = [
    { key: "inflation", label: "Inflation, one year", s: m.inflation, text: `${figure(m.inflation)}%` },
    { key: "spending", label: "Everyday spending", s: m.everydaySpendingEur, text: `€${figure(m.everydaySpendingEur, 0)} a month per person` },
    { key: "gni", label: "Income per person, PPP", s: m.gniPpp, text: `$${figure(m.gniPpp, 0)}` },
    { key: "unemployment", label: "Unemployment", s: m.unemployment, text: `${figure(m.unemployment)}%` },
    { key: "life", label: "Life expectancy", s: m.lifeExpectancy, text: `${figure(m.lifeExpectancy)} years` },
  ];
  const c = city.composition;
  const bar: { key: string; label: string; s: Sourced; token: string }[] = [
    { key: "industry", label: "Industry", s: c.industry, token: "var(--brand)" },
    { key: "services", label: "Services", s: c.services, token: "var(--brand-hover)" },
    { key: "agriculture", label: "Agriculture", s: c.agriculture, token: "var(--market-up)" },
    { key: "residual", label: "Taxes less subsidies", s: c.residual, token: "var(--text-muted)" },
  ];
  const shown = bar.filter((b) => b.s.value !== null && b.s.value > 0);
  return (
    <section aria-labelledby="economy" data-testid="economy">
      <h2 id="economy" className="text-small font-semibold uppercase tracking-[0.16em] text-text">
        The economy
      </h2>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.key} data-testid={`macro-${r.key}`}>
            <dt className="text-small text-text-muted">{r.label}</dt>
            <dd className="font-mono text-lead tabular-nums text-text">{r.s.value === null ? "—" : r.text}</dd>
            <dd className={MUTED}>
              {r.s.value === null ? `${r.s.reason ?? "unpublished"} · ` : ""}
              {r.s.source} · {r.s.asOf}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-8 text-small font-medium text-text">What the economy is made of</h3>
      <p className="mt-1 max-w-measure text-small text-text-muted">
        Not which sectors move the share index, which needs country-sector indices nobody publishes free, but what the country
        produces, which is what most people there work in.
      </p>
      <div role="img" aria-label={`${city.country}'s economy by share of GDP: ${shown.map((b) => `${b.label} ${figure(b.s)}%`).join(", ")}.`} className="mt-3 flex h-5 overflow-hidden rounded-md border border-hairline">
        {shown.map((b) => (
          <span key={b.key} data-testid="composition-segment" className="block h-full" style={{ width: `${b.s.value}%`, background: b.token, opacity: 0.85 }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-meta text-read">
        {bar.map((b) => (
          <li key={b.key} data-testid={`composition-${b.key}`}>
            {b.label} {b.s.value === null ? "—" : `${figure(b.s)}%`}
            {b.key === "industry" && c.manufacturing.value !== null && <span className="text-text-muted"> (manufacturing {figure(c.manufacturing)}%)</span>}
          </li>
        ))}
      </ul>
      <p className={`${MUTED} mt-1`}>
        World Bank shares of GDP, {c.industry.asOf}. Taxes less subsidies is derived: 100 less the three sectors.
      </p>
    </section>
  );
}
