import { costChain, dayLabel, euro, HOUSING_TAG_TEXT, money, sentence } from "@/lib/city-cost";
import type { CityResponse } from "@/lib/market-schemas";

const MUTED = "font-mono text-[12px] leading-relaxed text-text-muted";

/**
 * *Cost of living* (Phase 16 step 4; bearing.md #114): the survey's own total as the
 * headline, its housing assumption in plain words, a second line without housing
 * where the survey itemises it, and then the chain, each step a citation with its
 * year and source.
 */
export function CostChain({ city }: { city: CityResponse }) {
  const { survey, cost } = city;
  const h = survey.headline;
  const steps = costChain(city);
  return (
    <section aria-labelledby="cost" data-testid="cost">
      <h2 id="cost" className="font-mono text-[13px] font-semibold uppercase tracking-[0.16em] text-text">
        Cost of living
      </h2>
      <p className="mt-1 max-w-[70ch] text-[14.5px] text-text-muted">How the headline figure is built.</p>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p data-testid="headline" className="font-mono text-4xl tabular-nums text-text sm:text-5xl">
          {money(h.value, h.currency)}
          <span className="ml-2 text-base text-text-muted">a month · {h.year}</span>
        </p>
        {cost.eur.value !== null && cost.eur.reason !== "euro" && (
          <p data-testid="headline-eur" className="font-mono text-xl tabular-nums text-read">
            {euro(cost.eur.value)}
            <span className="ml-2 text-sm text-text-muted">{cost.eur.basis === "carried" ? `in ${cost.carried.year} prices` : "at the ECB's average"}</span>
          </p>
        )}
      </div>
      <p className="mt-2 max-w-[70ch] text-[14.5px] text-read">{sentence(h.label)}.</p>
      {survey.secondLines.map((l) => (
        <p key={l.label} data-testid="second-line" className="mt-1.5 font-mono text-[13.5px] tabular-nums text-read">
          {l.label} {money(l.value, h.currency)}
          {l.eur !== null && h.currency !== "EUR" && <span className="text-text-muted"> ({euro(l.eur)})</span>}
        </p>
      ))}
      <p data-testid="housing-tag" data-tag={survey.housing.tag} className="mt-2 max-w-[70ch] text-[13.5px] text-text-muted">
        <b className="font-medium text-read">{HOUSING_TAG_TEXT[survey.housing.tag]}</b> · {survey.housing.note}
      </p>

      <ol data-testid="chain" className="mt-6 space-y-3 border-l border-hairline pl-5">
        {steps.map((s) => (
          <li key={s.key} data-step={s.key}>
            <p className="text-[14px] font-medium text-text">{s.title}</p>
            <p className="max-w-[72ch] text-[14px] leading-relaxed text-read">{s.text}</p>
            <p className={MUTED}>{s.source}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 max-w-[72ch] text-[13.5px] leading-relaxed text-text-muted">
        {survey.instrument} is {city.country}&apos;s own method: {h.method} It is not interchangeable with another country&apos;s
        survey, which is why no other city&apos;s figure sits beside it.
      </p>

      <h3 className="mt-6 text-[13px] font-medium text-text">Sources</h3>
      <ul data-testid="sources" className="mt-1.5 space-y-1">
        {survey.sources.map((s) => (
          <li key={s.label} className={MUTED}>
            {s.url ? (
              <a href={s.url} className="underline underline-offset-2 hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
                {s.label}
              </a>
            ) : (
              s.label
            )}
            {s.detail ? ` · ${s.detail}` : ""} · retrieved {dayLabel(s.retrieved)}
          </li>
        ))}
        {survey.nextRelease && <li className={MUTED}>next release: {survey.nextRelease}</li>}
      </ul>
    </section>
  );
}
