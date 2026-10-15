import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The provenance flag every live data point carries (portfolio.md §22 risk
 * #8) — teal "LIVE" for real feed data, amber "SIMULATED" for the sim/COL
 * series. In v1 almost everything renders SIMULATED (sim is the only
 * source), which is the honest state, not a placeholder bug.
 */
export function LiveBadge({ simulated, className }: { simulated: boolean; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent font-mono uppercase",
        simulated ? "bg-stale/15 text-stale" : "bg-market-up/15 text-market-up",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          simulated ? "bg-stale" : "bg-market-up motion-safe:animate-pulse"
        )}
      />
      {simulated ? "Simulated" : "Live"}
    </Badge>
  );
}
