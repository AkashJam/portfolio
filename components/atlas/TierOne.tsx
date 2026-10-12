/**
 * Tier 1 of the three disclosure tiers (bearing.md): the reading rules. Missing
 * one produces a wrong conclusion, not an under-informed one, so this is plain
 * prose that never collapses and never sits behind an icon. Shown above the
 * table; the longer guide beside the reading says the same with the window.
 */
export function TierOne() {
  return (
    <div className="mb-4 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3.5">
      <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-hover">
        Reading rules
      </p>
      <p className="max-w-[80ch] text-[13.5px] leading-[1.68] text-read">
        <b className="font-semibold text-text">
          Shares, housing, prices and currency are change, not levels
        </b>
        , each measured from its own country{"’"}s baseline, so compare the
        rates and never the numbers.{" "}
        <b className="font-semibold text-text">Every figure here is national</b>
        ; the city names the country it stands for.{" "}
        <b className="font-semibold text-text">
          Nothing is ranked and nothing is scored.
        </b>{" "}
        Miss any of these three and you draw a wrong conclusion rather than an
        under-informed one, which is why they stay in plain sight.
      </p>
    </div>
  );
}
