"use client";

import * as React from "react";

/**
 * Opens the ledger entry the URL's fragment names, so one event can be linked
 * before a detail route exists (`/market#japan-2026-10-15`; portfolio.md §15
 * Phase 15 step 7). It acts on load and on a later hash change, and scrolls the
 * entry into view. Without script the entry is simply collapsed and reachable:
 * nothing is hidden that a click does not show.
 */
export function HashOpen() {
  React.useEffect(() => {
    function open() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      // A linked entry shows its details too; a plain click on a row does not.
      el.querySelectorAll<HTMLDetailsElement>("details[data-open-on-hash]").forEach((d) => (d.open = true));
      el.scrollIntoView({ block: "start" });
    }
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
