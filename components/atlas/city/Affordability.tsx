import { affordView } from "@/lib/city-afford";
import type { CityResponse } from "@/lib/market-schemas";

const MUTED = "font-mono text-[12px] leading-relaxed text-text-muted";

/**
 * *Derived on this page · affordability* (Phase 16 step 5; mockups/atlas-v1/atlas-city.html):
 * the cost of living as a share of the country's everyday spending, as its own block
 * with both legs, their years and the gap between them in view. It never sits on
 * /atlas, because every column there is one instrument applied to all twenty-three
 * countries, and this ratio is a survey's own method divided by another source.
 */
export function Affordability({ city }: { city: CityResponse }) {
  const v = affordView(city.affordability, city.country, city.city);
  return (
    <section
      aria-labelledby="afford"
      data-testid="affordability"
      data-measure={city.affordability.measure}
      className="rounded-[14px] border border-dashed border-brand/35 bg-panel px-5 py-5 sm:px-7"
    >
      <p className={`${MUTED} uppercase tracking-[0.16em]`}>Derived on this page · affordability</p>
      <h2 id="afford" className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span data-testid="afford-ratio" className="font-mono text-4xl tabular-nums text-text">
          {v.ratio ?? "—"}
        </span>
        <span className="max-w-[60ch] text-[15px] font-normal text-read">{v.sentence}</span>
      </h2>

      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div data-testid="afford-cost">
          <dt className="text-[13px] text-text-muted">{v.costLabel}</dt>
          <dd className="font-mono text-[13.5px] leading-relaxed text-read">{v.costLine}</dd>
        </div>
        <div data-testid="afford-spending">
          <dt className="text-[13px] text-text-muted">{v.spendingLabel}</dt>
          <dd className="font-mono text-[13.5px] leading-relaxed text-read">{v.spendingLine}</dd>
        </div>
      </dl>

      {v.gap && (
        <p data-testid="afford-gap" className={`${MUTED} mt-3`}>
          {v.gap}
        </p>
      )}
      {v.caveat && (
        <p data-testid="afford-caveat" className="mt-2 max-w-[72ch] text-[13.5px] leading-relaxed text-read">
          {v.caveat}
        </p>
      )}
      {v.reason && (
        <p data-testid="afford-reason" className={`${MUTED} mt-2`}>
          {v.reason}.
        </p>
      )}
      <p className="mt-4 max-w-[72ch] text-[13.5px] leading-relaxed text-text-muted">
        A ratio of two sources, both dated. Neither publishes it, so it never sits on /atlas, where it would put two different survey methods into one
        comparable-looking column. Here it reads one city&apos;s figure against its own country&apos;s spending, with both legs and their years in view.
      </p>
    </section>
  );
}
