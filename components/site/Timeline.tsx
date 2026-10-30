import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared rail layout for /about's Experience and Education sections
 * (phase6.md Step 4) — a 190px date column, a 32px rail
 * with a line and a dot, and a content column, collapsing to a 20px rail
 * beside stacked content below `lg` (1024px). The dots are neutral, and only the current role's is green (D9: indigo marks actions). Skills & Capabilities
 * reuses the same 190px column directly in its own markup so the two
 * sections share one spine, rather than through this component.
 */
export function Timeline({
  items,
  mobileRail = true,
}: {
  items: { when: ReactNode; content: ReactNode; current?: boolean }[];
  /** False drops the rail below `lg`: the date line then sits above its card, spaced equally from the card above. */
  mobileRail?: boolean;
}) {
  return (
    <div className={cn("grid lg:mt-8 lg:grid-cols-[190px_32px_minmax(0,1fr)]", mobileRail ? "mt-8 grid-cols-[20px_minmax(0,1fr)]" : "mt-3 grid-cols-1")}>
      {items.map((item, i) => (
        <TimelineRow key={i} when={item.when} current={item.current} mobileRail={mobileRail}>
          {item.content}
        </TimelineRow>
      ))}
    </div>
  );
}

function TimelineRow({
  when,
  current,
  mobileRail,
  children,
}: {
  when: ReactNode;
  current?: boolean;
  mobileRail: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div
        className={cn(
          "font-mono text-small leading-relaxed text-text-muted lg:col-start-1 lg:py-0 lg:pb-0 lg:pl-0 lg:pt-[26px] lg:text-right",
          mobileRail ? "col-start-2 pb-2.5 pl-3.5" : "col-start-1 py-5"
        )}
      >
        {when}
      </div>
      <div className={cn("relative row-span-2 lg:row-span-1", !mobileRail && "hidden lg:block")}>
        <i className="absolute top-0 -bottom-10 left-1/2 w-px -translate-x-1/2 bg-hairline" />
        <b
          className={cn(
            "absolute top-[30px] left-1/2 size-[9px] -translate-x-1/2 rounded-full shadow-[0_0_0_4px_var(--canvas)]",
            current ? "bg-market-up" : "bg-hairline"
          )}
        />
      </div>
      <div>{children}</div>
    </>
  );
}
