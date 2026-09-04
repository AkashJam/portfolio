import { cn } from "@/lib/utils";

/** Day-range indicator — a marker at `price`'s position between `low` and
 * `high` (both real snapshot fields). Shared by SymbolCard and
 * LiveSnapshot so the position math and markup live in one place. */
export function DayRangeBar({
  low,
  high,
  price,
  size = "sm",
}: {
  low: number;
  high: number;
  price: number;
  size?: "sm" | "lg";
}) {
  const range = high - low;
  const pos = range > 0 ? Math.min(100, Math.max(0, ((price - low) / range) * 100)) : 50;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "relative rounded-full bg-gradient-to-r from-market-down/50 via-hairline to-market-up/50",
          size === "lg" ? "h-1" : "h-[3px]"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-text ring-1 ring-hairline",
            size === "lg" ? "size-3" : "size-2"
          )}
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-text-faint">
        <span>L {low.toFixed(2)}</span>
        <span>H {high.toFixed(2)}</span>
      </div>
    </div>
  );
}
