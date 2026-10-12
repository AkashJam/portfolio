"use client";

import { useEffect, useState } from "react";

/**
 * Which edges of a sideways scroller have more to show. The responsive cue
 * (bearing.md #107) fades exactly those edges, in CSS, off two data attributes.
 * It reads the scroller's own position, so it works the same in every browser;
 * the earlier background-only trick painted a dark shadow behind the text on a
 * near-black panel, which could not be seen.
 */
export function useScrollEdges() {
  // A callback ref held in state, so the effect re-attaches if the element is replaced.
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 };
      setEdges((e) =>
        e.left === next.left && e.right === next.right ? e : next,
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [el]);

  return {
    attach: setEl,
    attrs: {
      "data-more-left": edges.left ? "true" : "false",
      "data-more-right": edges.right ? "true" : "false",
    },
  };
}
