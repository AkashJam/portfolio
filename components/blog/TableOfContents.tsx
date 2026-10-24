"use client";

import * as React from "react";

import { activeHeading } from "@/lib/toc-active";
import { cn } from "@/lib/utils";

/** Sticky right-rail ToC with scroll-spy (portfolio.md §17 reading layout). The active heading is
 * worked out from where the headings are on each scroll (lib/toc-active.ts), not from an
 * IntersectionObserver band, which missed fast jumps and the last section (phase18.md step 6, M9). */
export function TableOfContents({ headings }: { headings: { id: string; text: string }[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(headings[0]?.id ?? null);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = headings.map(({ id }) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity);
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const i = activeHeading(tops, atBottom);
      if (i >= 0) setActiveId(headings[i].id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="sticky top-22 hidden w-55 shrink-0 lg:block">
      <p className="mb-3 text-meta tracking-[0.15em] text-text-muted uppercase">On this page</p>
      <ul className="flex flex-col gap-2 border-l border-hairline">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={activeId === h.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l pl-3 text-small transition-colors",
                activeId === h.id
                  ? "border-brand text-text"
                  : "border-transparent text-text-muted hover:text-text"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
