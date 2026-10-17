import { SPARK_HEIGHT, SPARK_WIDTH, sparkPoints } from "@/lib/band-path";
import { TAPE_WINDOW } from "@/lib/tape";
import { cn } from "@/lib/utils";

/**
 * A row's sixty sessions, in the tape (portfolio.md §15 Phase 15 step 7). It
 * needs the full sixty before it draws: a short history drawn as a line would be
 * a flat promise, so a young sensor shows a dash that says so. A tripped row's
 * line is heavier and in the colour of its direction.
 */
export function Sparkline({
  closes,
  label,
  tripped,
  direction,
}: {
  closes: number[];
  label: string;
  tripped?: boolean;
  direction?: "up" | "down";
}) {
  const points = closes.length >= TAPE_WINDOW ? sparkPoints(closes) : null;
  if (!points) {
    return (
      <span
        data-testid="sparkline-empty"
        title={`${closes.length} of ${TAPE_WINDOW} sessions so far`}
        className="block w-[104px] text-center font-mono text-[12px] text-text-muted"
      >
        <span aria-hidden="true">—</span>
        <span className="sr-only">fewer than sixty sessions of history so far</span>
      </span>
    );
  }
  return (
    <svg
      data-testid="sparkline"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      width={SPARK_WIDTH}
      height={SPARK_HEIGHT}
      role="img"
      aria-label={label}
      className="block"
    >
      <polyline
        points={points}
        className={cn(tripped && "hit")}
        style={{
          fill: "none",
          stroke: tripped ? (direction === "up" ? "var(--market-up)" : "var(--market-down)") : "var(--text-muted)",
          strokeWidth: tripped ? 1.9 : 1.3,
          strokeLinejoin: "round",
        }}
      />
    </svg>
  );
}
