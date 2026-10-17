"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isEuroArea, noRateLine, parseHash, rateLine, writeHash } from "@/lib/atlas-home";
import type { AtlasRow, DisplayRate } from "@/lib/market-schemas";

/**
 * The home city (Phase 16 step 6): one control with four effects, held in memory and
 * mirrored to the address hash (`/atlas#home=japan`, or `#italy&home=japan` with a row),
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
      const h = parseHash(window.location.hash).home;
      setSlug(h && rows.some((r) => r.slug === h) ? h : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [rows]);

  const setHome = useCallback((next: string | null) => {
    setSlug(next);
    const { target } = parseHash(window.location.hash);
    // replaceState, not an assignment: a home is a view setting, not a place to go back to.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${writeHash({ target, home: next })}`);
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

const SELECT =
  "rounded-lg border border-hairline bg-panel-2 px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** The picker: a native select over the rows, and the one dated rate line beneath it. */
export function HomePicker() {
  const { rows, home, setHome, note } = useAtlasHome();
  const sorted = [...rows].sort((a, b) => a.city.localeCompare(b.city));
  return (
    <div data-testid="home-picker" className="panel-elevated rounded-2xl px-5 py-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="atlas-home" className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Home city
          </label>
          <select id="atlas-home" value={home?.slug ?? ""} onChange={(e) => setHome(e.target.value || null)} className={SELECT}>
            <option value="">None</option>
            {sorted.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.city} · {r.country}
              </option>
            ))}
          </select>
        </div>
        <p className="max-w-[60ch] pb-2 text-[13px] leading-relaxed text-text-muted">
          sets the crosshairs, the pinned row, the comparison line and the display currency: one control, not four
        </p>
      </div>
      {note && (
        <p data-testid="home-rate" className="mt-3 max-w-[78ch] font-mono text-[12.5px] leading-relaxed text-brand-hover">
          {note}
        </p>
      )}
    </div>
  );
}
