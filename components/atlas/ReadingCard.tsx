import type { Reading } from "@/lib/atlas-readings";
import { cn } from "@/lib/utils";

/**
 * The worked reading under the Compare controls (mockups/atlas-v1 `.wex`):
 * an eyebrow naming the two countries, four computed figures, one sentence.
 * Everything in it comes from lib/atlas-readings.ts, which only asserts what it
 * has just checked.
 */
export function ReadingCard({
  reading,
  className,
}: {
  reading: Reading;
  className?: string;
}) {
  return (
    <aside
      aria-label="Reading this view"
      className={cn("border-l-2 border-brand/55 pl-4", className)}
    >
      <p className="mb-2 text-meta font-semibold uppercase tracking-[0.16em] text-text-muted">
        Reading this view {"·"}{" "}
        <b className="font-medium text-text">{reading.title}</b>
      </p>
      {reading.figs.length > 0 && (
        <dl className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
          {reading.figs.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <dt className="order-2 font-mono text-meta leading-snug text-text-muted">
                {f.label}
              </dt>
              <dd
                className={cn(
                  "order-1 font-mono text-lead font-semibold tabular-nums",
                  f.tone === "up" && "text-market-up",
                  f.tone === "down" && "text-market-down",
                )}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-small leading-relaxed text-read">
        {reading.sentence}
      </p>
    </aside>
  );
}
