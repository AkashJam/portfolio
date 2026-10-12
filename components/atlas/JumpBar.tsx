"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The /atlas section bar (Compare · Map · Countries), sticky under the top bar
 * (mockups/atlas-v1/atlas-map.html .jump; bearing.md #89, #105). The section in
 * view is marked. Below 768px it slides away while the reader scrolls down and
 * returns on any scroll up, so a phone is not left with two sticky bars; with
 * reduced motion it appears and disappears without sliding.
 */

const SECTIONS = [
  { id: "compare", label: "Compare" },
  { id: "map", label: "Map" },
  { id: "countries", label: "Countries" },
] as const;

/**
 * Just under both bars: the top bar (56px) and the jump bar (44px), plus the
 * 16px of air the root scroll-padding leaves, plus margin. A section an anchor
 * has just scrolled to sits at about 116px and must count as reached.
 */
const LINE = 140;
const PHONE = "(max-width: 767px)";

export function JumpBar() {
  const [active, setActive] = useState<string>("compare");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      let current: string = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= LINE) current = s.id;
      }
      setActive(current);
      if (window.matchMedia(PHONE).matches) {
        const d = y - last;
        if (d > 6 && y > 120) setHidden(true);
        else if (d < -2) setHidden(false);
      } else {
        setHidden(false);
      }
      last = y;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // The global scroll-padding adds this, so anchors land clear of whichever bars are showing.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--atlas-jump",
      hidden ? "0px" : "2.75rem",
    );
    return () => {
      document.documentElement.style.removeProperty("--atlas-jump");
    };
  }, [hidden]);

  return (
    <nav
      aria-label="On this page"
      data-atlas-jump=""
      inert={hidden}
      className={cn(
        "sticky top-14 z-20 -mt-4 flex gap-6 border-b border-hairline bg-canvas py-3 motion-safe:transition-[transform,opacity] motion-safe:duration-200",
        // Slid up under the top bar, which is translucent: without the opacity the hidden
        // bar's labels ghost through it.
        hidden && "-translate-y-full opacity-0",
      )}
    >
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={active === s.id ? "location" : undefined}
          className={cn(
            "border-b-2 pb-1 font-mono text-[11.5px] font-semibold uppercase tracking-[0.14em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
            active === s.id
              ? "border-brand text-brand-hover"
              : "border-transparent text-text-muted hover:text-read",
          )}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
