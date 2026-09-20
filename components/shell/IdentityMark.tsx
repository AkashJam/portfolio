import { cn } from "@/lib/utils";

/**
 * Shared glyph-only identity mark (portfolio.md §15 Phase 6 step 1) — the
 * same pulse-line motif as app/icon.svg, redrawn to fit a 16x16 viewBox,
 * reused across TopBar and MobileDrawer's header. Deliberately no name.
 */
export function IdentityMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 items-center justify-center rounded-md border border-brand/35 bg-brand/12 text-brand-hover",
        className
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1.5 9.5h2l1.5 3 2-7 1.5 4.5 1-2h5" />
      </svg>
    </span>
  );
}
