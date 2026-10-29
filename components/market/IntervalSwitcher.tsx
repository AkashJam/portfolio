import { INTERVALS } from "@/lib/price-interval";
import { cn } from "@/lib/utils";

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
            "border-r border-hairline px-3 py-1.5 font-mono text-meta transition-colors last:border-r-0",
            value === iv ? "bg-brand/25 text-text" : "text-text-muted hover:text-read"
          )}
        >
          {iv}
        </button>
      ))}
    </div>
  );
}
