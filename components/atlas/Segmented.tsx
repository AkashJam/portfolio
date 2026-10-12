import { cn } from "@/lib/utils";

/**
 * A labelled group of mutually exclusive buttons (the mock's `.wsel`): the
 * window selector, the map's measure and its period toggle. Radio semantics on
 * buttons, so Tab reaches the group and Enter or Space chooses.
 */
export function Segmented<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span
        id={id}
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted"
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="flex overflow-hidden rounded-lg border border-hairline"
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn(
                "border-r border-hairline px-3 py-2 font-mono text-[12.5px] last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                on
                  ? "bg-brand/25 text-text"
                  : "bg-panel-2 text-text-muted hover:text-read",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
