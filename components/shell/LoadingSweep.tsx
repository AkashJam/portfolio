"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/** A click on a link to another page, in the capture phase: Next's `<Link>`
 * calls `preventDefault` for a client navigation, so this has to run first. */
function isPageNavigation(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return false;
  const url = new URL(a.href, window.location.href);
  return url.origin === window.location.origin && url.pathname !== window.location.pathname;
}

// Shown only while a navigation is pending (D1): a fast one never shows it, a slow one
// shows it until the new page is there. The ceiling stops a navigation that never lands
// (a link the router did not handle) from leaving it running.
const SHOW_AFTER_MS = 120;
const CEILING_MS = 10_000;

type Navigation = { from: string; late: boolean };

export function LoadingSweep() {
  const pathname = usePathname();
  const [nav, setNav] = React.useState<Navigation | null>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isPageNavigation(e)) setNav({ from: window.location.pathname, late: false });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  React.useEffect(() => {
    if (!nav) return;
    const show = window.setTimeout(() => setNav((n) => (n === nav ? { ...nav, late: true } : n)), SHOW_AFTER_MS);
    const stop = window.setTimeout(() => setNav((n) => (n && n.from === nav.from ? null : n)), CEILING_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(stop);
    };
  }, [nav]);

  // The navigation has landed once the pathname is no longer the one it left.
  if (!nav || !nav.late || pathname !== nav.from) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5 overflow-hidden bg-hairline">
      <div className="h-full w-1/3 bg-linear-to-r from-transparent via-brand to-transparent motion-safe:animate-loading-sweep" />
    </div>
  );
}
