import { cn } from "@/lib/utils";

/** The small glowing gradient underline (Hero's name underline, error pages' number underline). */
export function GlowBar({
  color = "brand",
  className,
}: {
  color?: "brand" | "down";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("glow-bar", color === "down" && "glow-bar--down", className)}
    />
  );
}
