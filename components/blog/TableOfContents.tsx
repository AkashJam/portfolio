"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Sticky right-rail ToC with scroll-spy (portfolio.md §17 reading layout) — hand-rolled IntersectionObserver, matching Reveal.tsx's precedent of no new dependency for one effect. */
export function TableOfContents({ headings }: { headings: { id: string; text: string }[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(headings[0]?.id ?? null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-88px 0px -70% 0px" }
    );
    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="sticky top-22 hidden w-55 shrink-0 lg:block">
      <p className="mb-3 text-xs tracking-[0.15em] text-text-muted uppercase">On this page</p>
      <ul className="flex flex-col gap-2 border-l border-hairline">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "-ml-px block border-l pl-3 text-sm transition-colors",
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
