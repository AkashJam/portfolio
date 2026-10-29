import type { ReactNode } from "react";

import { HOUSING_TAG_TEXT, euro, money, sentence } from "@/lib/city-cost";
import type { CityResponse } from "@/lib/market-schemas";

/** `€774`: the euro beside the local figure is whole euros, as in the mock. */
const wholeEuro = (v: number): string => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

/**
 * The survey's own figure, named by its kind (Phase 22 step 4, M22; bearing.md #114;
 * mockups/site-review/atlas-city.html): "Poverty line", "Benefit standard", with the kind's
 * one-line gloss, the local figure first and the euro beside it, the second lines under it,
 * what the figure is and the few facts that qualify it. The basket split and the change block
 * follow as children. The chain of steps that led to the euro figure, and the survey's sources,
 * are behind "How this is calculated" (I57).
 */
export function CostChain({ city, children }: { city: CityResponse; children?: ReactNode }) {
  const { survey, cost } = city;
  const h = survey.headline;
  const euroArea = cost.eur.reason === "euro";
  const facts = [
    `${HOUSING_TAG_TEXT[survey.housing.tag]}${survey.housing.note ? `: ${sentence(survey.housing.note)}` : ""}`,
    ...(euroArea ? ["In euros, no conversion"] : []),
    `${survey.publisher}, ${h.year}`,
  ];
  return (
    <section aria-labelledby="cost" data-testid="cost">
      <p id="cost" data-testid="kind" data-kind={survey.kind} className="inline-block text-meta font-medium uppercase tracking-[0.12em] text-text-muted">
        {survey.kindLabel}
      </p>
      <p data-testid="kind-gloss" className="mt-2 max-w-measure text-small text-text-muted">
        {survey.kindGloss}
      </p>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p data-testid="headline" className="font-mono text-4xl font-semibold tabular-nums text-text sm:text-[44px]">
          {money(h.value, h.currency)}
          <span className="ml-3 font-sans text-small font-normal text-text-muted">a month · {h.year}</span>
        </p>
        {cost.eur.value !== null && !euroArea && (
          <span data-testid="headline-eur" className="font-mono text-body font-medium tabular-nums text-read">
            {wholeEuro(cost.eur.value)}
            <span className="ml-2 font-sans text-small font-normal text-text-muted">
              {cost.eur.basis === "carried" ? `in ${cost.carried.year} prices, at the ECB's ${cost.eur.year} average` : `at the ECB's ${cost.eur.year} average`}
            </span>
          </span>
        )}
      </div>
      {survey.secondLines.map((l) => (
        <p key={l.label} data-testid="second-line" className="mt-2 text-small text-text-muted">
          <span>{l.label}</span>{" "}
          <span className="font-mono tabular-nums text-read">
            {money(l.value, h.currency)}
            {l.eur !== null && h.currency !== "EUR" && <span className="text-text-muted"> ({euro(l.eur)})</span>}
          </span>
        </p>
      ))}
      <p className="mt-3 max-w-measure text-read">{sentence(h.label)}.</p>
      <ul data-testid="facts" className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2 text-meta text-text-muted">
        {facts.map((f) => (
          <li key={f} data-testid={f.startsWith("Housing") ? "housing-tag" : undefined} data-tag={f.startsWith("Housing") ? survey.housing.tag : undefined} className="flex items-baseline">
            <span aria-hidden="true" className="mr-2 inline-block size-[5px] shrink-0 rounded-full bg-text-faint align-[2px]" />
            {f}
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}
