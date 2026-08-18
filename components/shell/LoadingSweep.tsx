import { cn } from "@/lib/utils";

export function LoadingSweep({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none h-px w-full overflow-hidden bg-hairline",
        className
      )}
    >
      <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand to-transparent motion-safe:animate-loading-sweep" />
    </div>
  );
}
