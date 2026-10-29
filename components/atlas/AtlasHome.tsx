"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isEuroArea, noRateLine, rateLine } from "@/lib/atlas-home";
import { homeAddress, readHome } from "@/lib/atlas-url";
import type { AtlasRow, DisplayRate } from "@/lib/market-schemas";

/**
 * The home city (Phase 16 step 6): one control with four effects, held in memory and
 * mirrored to the query (`/atlas?home=japan`; the old `#home=japan` is read once and moved there),
 * so a reload or a shared link keeps it and the page stays static. Setting a home
 * highlights its dot and draws the crosshairs, pins its row, adds the comparison line
 * under every other cited figure, and shows spending in its currency at one dated rate.
 * Read after hydration, like the row address: the server render has no home.
 */
interface AtlasHomeValue {
  rows: AtlasRow[];
  home: AtlasRow | null;
  setHome: (slug: string | null) => void;
  /** The one rate spending is shown at; null for a euro-area home, no home, or a currency with no average. */
  rate: DisplayRate | null;
  /** The dated line under the picker, or null when nothing is converted and nothing needs saying. */
  note: string | null;
}

const AtlasHomeContext = createContext<AtlasHomeValue | null>(null);

export function AtlasHomeProvider({
  rows,
  rates,
  children,
}: {
  rows: AtlasRow[];
  rates: Record<string, DisplayRate>;
  children: ReactNode;
}) {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const h = readHome(window.location.search, window.location.hash);
      const known = h && rows.some((r) => r.slug === h) ? h : null;
      setSlug(known);
      // An old `#home=japan` link is moved to `?home=japan`; an unknown slug is dropped.
      if (/home=/.test(window.location.hash) || (h && !known)) {
        const next = homeAddress(window.location.search, window.location.hash, known);
        window.history.replaceState(null, "", `${window.location.pathname}${next.search}${next.hash}`);
      }
    };
    read();
  }, [rows]);

  const setHome = useCallback((next: string | null) => {
    setSlug(next);
    // replaceState, not an assignment: a home is a view setting, not a place to go back to.
    const addr = homeAddress(window.location.search, window.location.hash, next);
    window.history.replaceState(null, "", `${window.location.pathname}${addr.search}${addr.hash}`);
  }, []);

  const value = useMemo<AtlasHomeValue>(() => {
    const home = rows.find((r) => r.slug === slug) ?? null;
    const rate = home && !isEuroArea(home) ? (rates[home.slug] ?? null) : null;
    const note = !home || isEuroArea(home) ? null : rate ? rateLine(rate) : noRateLine(home);
    return { rows, home, setHome, rate, note };
  }, [rows, rates, slug, setHome]);

  return <AtlasHomeContext value={value}>{children}</AtlasHomeContext>;
}

export function useAtlasHome(): AtlasHomeValue {
  const v = useContext(AtlasHomeContext);
  if (!v) throw new Error("useAtlasHome must be used inside AtlasHomeProvider");
  return v;
}

/**
 * The picker, in the end of the view row on every view (phase18.md I50; owner, 2026-10-24): a
 * native select over the rows, and under it the one dated rate line. Its two parts sit in the
 * row's own grid (`display: contents`), so the control is at the end of the tab row on a
 * desktop and on its own full-width line under the tabs on a phone.
 */
export function HomePicker() {
  const { rows, home, setHome, note } = useAtlasHome();
  const sorted = [...rows].sort((a, b) => a.city.localeCompare(b.city));
  return (
    <div className="contents">
      <div
        data-testid="home-picker"
        className="flex items-center gap-3 border-hairline pt-4 text-meta text-text-muted max-md:w-full md:items-end md:border-b md:pb-2 md:pt-0"
      >
        <label htmlFor="atlas-home">Home city</label>
        <select
          id="atlas-home"
          value={home?.slug ?? ""}
          onChange={(e) => setHome(e.target.value || null)}
          className="rounded-lg border border-brand bg-panel px-3 py-2 text-small text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand max-md:flex-1 max-md:py-2.5"
        >
          <option value="">None</option>
          {sorted.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.city} · {r.country}
            </option>
          ))}
        </select>
      </div>
      {note && (
        <p data-testid="home-rate" className="col-span-full max-w-measure pt-2.5 font-mono text-meta leading-relaxed text-brand-hover">
          {note}
        </p>
      )}
    </div>
  );
}
