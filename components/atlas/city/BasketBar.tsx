import { basketAlt, largest, segments } from "@/lib/city-basket";
import { sentence } from "@/lib/city-cost";
import type { CityResponse } from "@/lib/market-schemas";

const MUTED = "text-meta leading-relaxed text-text-muted";

/**
 * The basket split (bearing.md #114, #115): one stacked bar, a closed summary that
 * names the largest slice, and a native `<details>` that lists every part. No script.
 * A ceiling is hatched, an added rent outlined, a derived amount says how it was
 * reached. Where the survey publishes a total and not a split there is no bar: the
 * footnote says so.
 */
export function BasketBar({ city }: { city: CityResponse }) {
  const { parts, splitNote, housing, headline } = city.survey;
  if (!parts || parts.length === 0) {
    return (
      <p data-testid="no-split" className={`${MUTED} mt-6 max-w-measure`}>
        No basket split: {sentence(splitNote ?? "the survey publishes a total, with housing included in it")}.
      </p>
    );
  }
  const segs = segments(parts, headline.currency, housing.tag);
  return (
    <div data-testid="basket" className="mt-6">
      <h3 className="text-small font-medium text-text">What the figure is made of</h3>
      <div
        role="img"
        aria-label={basketAlt(city.city, parts, headline.currency)}
        className="mt-2 flex h-5 overflow-hidden rounded-md border border-hairline"
      >
        {segs.map((s) => (
          <span
            key={s.label}
            data-testid="segment"
            data-hatched={s.hatched || undefined}
            data-outlined={s.outlined || undefined}
            className="block h-full min-w-[2px] border-r border-canvas last:border-r-0"
            style={{
              width: `${s.width}%`,
              background: s.hatched
                ? "repeating-linear-gradient(135deg, var(--brand) 0 4px, transparent 4px 8px)"
                : s.outlined
                  ? "transparent"
                  : "var(--brand)",
              opacity: s.outlined || s.hatched ? 1 : s.opacity,
              outline: s.outlined ? "1.5px solid var(--brand-hover)" : undefined,
              outlineOffset: s.outlined ? "-1.5px" : undefined,
            }}
          />
        ))}
      </div>
      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2 font-mono text-small text-read focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
          <span data-testid="basket-largest">{largest(parts, headline.currency)}</span>
          <span className="text-text-muted">
            All {parts.length} {parts.length === 1 ? "part" : "parts"} <span aria-hidden="true">▾</span>
          </span>
        </summary>
        <ul className="mt-3 divide-y divide-hairline rounded-[12px] border border-hairline bg-panel">
          {segs.map((s) => (
            <li key={s.label} data-testid="part" className="px-4 py-2.5">
              <div className="flex items-baseline justify-between gap-4 font-mono text-small tabular-nums">
                <span className="text-read">
                  {s.label}
                  {s.includesHousing && <span className="text-text-muted"> · including housing</span>}
                  {s.hatched && <span className="text-text-muted"> · a ceiling, not a spend</span>}
                  {s.outlined && <span className="text-text-muted"> · added, not in the survey</span>}
                </span>
                <span className="text-text">
                  {s.amount} <span className="text-text-muted">{s.share}</span>
                </span>
              </div>
              {s.derived && <p className={`${MUTED} mt-0.5`}>{s.derived}</p>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
