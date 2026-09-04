import { cn } from "@/lib/utils";

// Only the 4 intervals aggregate/candles.go's fixedIntervals always
// computes regardless of environment. The "finest" interval (--agg-window:
// 10s dev / 1m prod) is deliberately excluded — its label isn't a fixed
// constant the frontend can rely on, and offering a control whose value
// differs by environment would mislabel itself in dev.
const INTERVALS = ["5m", "15m", "1h", "1d"];

export function IntervalSwitcher({
  value,
  onChange,
}: {
  value: string;
  onChange: (interval: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-hairline bg-panel-2 shadow-[inset_0_1px_0_var(--hi)]">
      {INTERVALS.map((iv) => (
        <button
          key={iv}
          type="button"
          onClick={() => onChange(iv)}
          aria-pressed={value === iv}
          className={cn(
            "border-r border-hairline px-3 py-1.5 font-mono text-xs transition-colors last:border-r-0",
            value === iv ? "bg-brand/25 text-text" : "text-text-muted hover:text-read"
          )}
        >
          {iv}
        </button>
      ))}
    </div>
  );
}
