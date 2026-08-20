import { cn } from "@/lib/utils";

/**
 * Shared blurred radial-gradient primitive behind Hero's orb, About's
 * sphere, and both error pages' number-underline orbs (portfolio.md §17).
 * Purely decorative — size/position are the caller's job via `className`.
 */
export function Glow({
  variant,
  color = "brand",
  floatDistance,
  className,
}: {
  variant: "orb" | "sphere";
  color?: "brand" | "down";
  /** CSS length, e.g. "-20px" — overrides the shared keyframe's default amplitude. */
  floatDistance?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      style={floatDistance ? ({ "--float-distance": floatDistance } as React.CSSProperties) : undefined}
      className={cn(
        variant === "orb" ? "glow-orb" : "glow-sphere",
        variant === "orb" && color === "down" && "glow-orb--down",
        variant === "orb" ? "motion-safe:animate-float" : "motion-safe:animate-sphere",
        className
      )}
    />
  );
}
