import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared rail layout for /about's Experience and Education sections
 * (portfolio.md §15 Phase 6 step 4) — a 190px date column, a 32px rail
 * with a line and a dot, and a content column, collapsing to a 20px rail
 * beside stacked content below `lg` (1024px). Skills & Capabilities
 * reuses the same 190px column directly in its own markup so the two
 * sections share one spine, rather than through this component.
 */
export function Timeline({
  items,
}: {
  items: { when: ReactNode; content: ReactNode; current?: boolean }[];
}) {
  return (
    <div className="mt-8 grid grid-cols-[20px_minmax(0,1fr)] lg:grid-cols-[190px_32px_minmax(0,1fr)]">
      {items.map((item, i) => (
        <TimelineRow key={i} when={item.when} current={item.current}>
          {item.content}
        </TimelineRow>
      ))}
    </div>
  );
}

function TimelineRow({
  when,
  current,
  children,
}: {
  when: ReactNode;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div className="col-start-2 pb-2.5 pl-3.5 font-mono text-[13px] leading-relaxed text-text-muted lg:col-start-1 lg:pb-0 lg:pl-0 lg:pt-[26px] lg:text-right">
        {when}
      </div>
      <div className="relative row-span-2 lg:row-span-1">
        <i className="absolute top-0 -bottom-10 left-1/2 w-px -translate-x-1/2 bg-hairline" />
        <b
          className={cn(
            "absolute top-[30px] left-1/2 size-[9px] -translate-x-1/2 rounded-full shadow-[0_0_0_4px_var(--canvas)]",
            current ? "bg-brand" : "bg-hairline"
          )}
        />
      </div>
      <div>{children}</div>
    </>
  );
}
