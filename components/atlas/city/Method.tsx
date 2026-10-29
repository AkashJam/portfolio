import { costChain, dayLabel } from "@/lib/city-cost";
import type { CityResponse } from "@/lib/market-schemas";

/**
 * *How this is calculated* (Phase 22 step 4, I57): everything that makes a reader's eyes slide
 * on a city page, in one closed `<details>` that is still in the server HTML. The survey and its
 * method, the price adjustment, the conversion, the change block's method, each chart's source,
 * base and scale, and every dataset ID. The page above says what a figure is; this says how it
 * was made. Native `<details>`, so no script.
 */
export function Method({ city }: { city: CityResponse }) {
  const { survey, charts, macro, composition } = city;
  const h = survey.headline;
  const euroArea = city.cost.eur.reason === "euro";
  const steps = costChain(city);
  const prices = steps.find((s) => s.key === "cpi");
  const rate = steps.find((s) => s.key === "rate");
  const ids = [...new Set([...Object.values(macro), ...Object.values(composition)].map((s) => s.source))];
  const entries: { term: string; text: string }[] = [
    {
      term: survey.kindLabel,
      text: `${survey.instrument} is ${city.country}'s own method: ${h.method} It is not interchangeable with another country's survey, which is why no other city's figure sits beside it.`,
    },
    ...(steps.find((s) => s.key === "derived") ? [{ term: "Derived", text: steps.find((s) => s.key === "derived")!.text }] : []),
    ...(prices ? [{ term: "Prices", text: `${prices.title}. ${prices.text} ${prices.source}.` }] : []),
    ...(rate ? [{ term: "In euros", text: `${rate.text} ${rate.source}.` }] : []),
    ...(survey.change
      ? [
          {
            term: `Change since ${survey.change.baseYear}`,
            text: `Each series divided by its ${survey.change.baseYear} value. Prices: ${survey.change.pricesSource}. Spending: ${survey.change.spendingSource}, household final consumption divided by population, per month. ${survey.change.note}`,
          },
        ]
      : []),
    {
      term: "Stock market",
      text: `${charts.shares.source}, monthly, 2015 = 100, in ${euroArea ? "euros" : h.currency} and before inflation, on a logarithmic scale: equal distance is equal percentage change. Latest ${charts.shares.asOf}.`,
    },
    ...(euroArea
      ? []
      : [
          {
            term: `${h.currency} per euro`,
            text: `${charts.currency.source}, monthly average from 1999, on a logarithmic scale. A rising line is a weaker ${h.currency}. Latest ${charts.currency.asOf}.`,
          },
        ]),
    {
      term: "House prices, after inflation",
      text:
        `${charts.housing.source}, quarterly, 2010 = 100. Indexed to ${city.country}'s own 2010, so only the direction compares across countries, never the level.` +
        (charts.housing.behind > 0 ? " /atlas ends every change at the same year, so the lag never shows there." : "") +
        ` Latest ${charts.housing.asOf}.`,
    },
  ];
  return (
    <details data-testid="method" className="group rounded-xl border border-hairline bg-panel-2">
      <summary className="cursor-pointer list-none px-4 py-3 text-small text-text focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        How this is calculated <span aria-hidden="true" className="text-text-muted">▾</span>
      </summary>
      <dl className="grid gap-x-6 gap-y-3 px-4 pb-4 text-small sm:grid-cols-[11rem_1fr]">
        {entries.map((e) => (
          <div key={e.term} className="contents">
            <dt className="font-medium text-text">{e.term}</dt>
            <dd data-testid="method-entry" className="max-w-measure text-text-muted">
              {e.text}
            </dd>
          </div>
        ))}
        <dt className="font-medium text-text">Sources</dt>
        <dd data-testid="sources" className="max-w-measure space-y-1 text-text-muted">
          {survey.sources.map((s) => (
            <p key={s.label}>
              {s.url ? (
                <a href={s.url} className="underline underline-offset-2 hover:text-read focus-visible:outline-2 focus-visible:outline-brand">
                  {s.label}
                </a>
              ) : (
                s.label
              )}
              {s.detail ? ` · ${s.detail}` : ""} · retrieved {dayLabel(s.retrieved)}
            </p>
          ))}
          {survey.nextRelease && <p>Next release: {survey.nextRelease}</p>}
          <p>{ids.join(" · ")}. Taxes less subsidies is 100 less the three sectors.</p>
        </dd>
      </dl>
    </details>
  );
}
