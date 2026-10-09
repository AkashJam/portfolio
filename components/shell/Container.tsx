import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared page-shell width (phase6.md Step 2) — the single
 * source for the 1152px/16px shell measure previously copy-pasted as
 * `mx-auto max-w-6xl px-4` across TopBar and Footer.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto max-w-6xl px-4", className)}>{children}</div>;
}
