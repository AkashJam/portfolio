import { cn } from "@/lib/utils";

const VARIANTS = {
  // portfolio.md §17: "callouts (note = indigo / tip = green / warn =
  // amber)" — three variants, not the single amber-only style
  // mockups/v2/blog-post.html collapsed to (flagged during this session's
  // mockup audit as a v2 regression, not a decision to propagate).
  note: "border-brand bg-brand/10 text-text",
  tip: "border-market-up bg-market-up/10 text-text",
  warn: "border-simulated bg-simulated/10 text-text",
} as const;

export function Callout({
  variant = "note",
  label,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("not-prose my-6 rounded-lg border-l-4 p-4 text-sm", VARIANTS[variant])}>
      {label && <p className="mb-1 font-medium">{label}</p>}
      <div className="text-text-muted [&>p]:m-0">{children}</div>
    </div>
  );
}
