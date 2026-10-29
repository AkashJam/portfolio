"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { DEFAULT_VIEW, VIEWS, parseHashParts, resolveView, viewAddress, type View } from "@/lib/atlas-url";
import { cn } from "@/lib/utils";

/**
 * The Compare · Map · Countries tabs (phase18.md I54, I51). All three panels are
 * in the server HTML; the inactive ones carry `hidden`, so the page stays static
 * and a crawler or a reader without script still has every view. The tab is read
 * from the address (`?view=`, a section hash, or a country row) before first
 * paint, and written back with replaceState: Back leaves the page, not the tab.
 */

const LABELS: Record<View, string> = { compare: "Compare", map: "Map", countries: "Countries" };

// useLayoutEffect warns on the server; the tab must be right before paint on the client.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function AtlasViews({ panels, bar }: { panels: Record<View, ReactNode>; bar?: ReactNode }) {
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  // True once the address has been read: the specs wait for it, because a control driven before
  // hydration is reset by it.
  const [ready, setReady] = useState(false);
  const tabs = useRef<Record<View, HTMLButtonElement | null>>({ compare: null, map: null, countries: null });

  useIsoLayoutEffect(() => {
    const read = (changed: boolean) => {
      let next = resolveView(window.location.search, window.location.hash);
      // A link to a row (a map link, a palette entry) opens Countries even from another tab; on arrival ?view= wins.
      if (changed && parseHashParts(window.location.hash).target) {
        next = "countries";
        const a = viewAddress(window.location.search, window.location.hash, next);
        window.history.replaceState(null, "", `${window.location.pathname}${a.search}${window.location.hash}`);
      }
      setView(next);
      setReady(true);
      // A row or a section named in the hash was hidden when the browser tried to scroll to it.
      const id = decodeURIComponent(window.location.hash.replace(/^#/, "").split("&")[0] ?? "");
      if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    };
    const onChange = () => read(true);
    read(false);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const select = useCallback((next: View) => {
    setView(next);
    const a = viewAddress(window.location.search, window.location.hash, next);
    window.history.replaceState(null, "", `${window.location.pathname}${a.search}${a.hash}`);
  }, []);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, current: View) {
    const i = VIEWS.indexOf(current);
    const to =
      e.key === "ArrowRight" ? VIEWS[(i + 1) % VIEWS.length]
      : e.key === "ArrowLeft" ? VIEWS[(i + VIEWS.length - 1) % VIEWS.length]
      : e.key === "Home" ? VIEWS[0]
      : e.key === "End" ? VIEWS[VIEWS.length - 1]
      : null;
    if (!to) return;
    e.preventDefault();
    select(to);
    tabs.current[to]?.focus();
  }

  return (
    <div>
      <div className="grid grid-cols-1 items-end gap-x-4 md:grid-cols-[1fr_auto]">
        <div role="tablist" aria-label="Atlas views" data-ready={ready || undefined} className="flex gap-1 border-b border-hairline">
          {VIEWS.map((v) => (
            <button
              key={v}
              ref={(el) => {
                tabs.current[v] = el;
              }}
              type="button"
              role="tab"
              id={`atlas-tab-${v}`}
              aria-selected={view === v}
              aria-controls={v}
              tabIndex={view === v ? 0 : -1}
              onClick={() => select(v)}
              onKeyDown={(e) => onKey(e, v)}
              className={cn(
                "-mb-px border-b-2 px-4 py-3 text-body font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                view === v ? "border-brand-hover text-text" : "border-transparent text-text-muted hover:text-read",
              )}
            >
              {LABELS[v]}
            </button>
          ))}
        </div>
        {bar}
      </div>
      {VIEWS.map((v) => (
        <div key={v} id={v} role="tabpanel" aria-labelledby={`atlas-tab-${v}`} hidden={view !== v} className="pt-6">
          {panels[v]}
        </div>
      ))}
    </div>
  );
}
