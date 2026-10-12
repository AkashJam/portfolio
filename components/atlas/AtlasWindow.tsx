"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { Segmented } from "@/components/atlas/Segmented";
import { windowLabel } from "@/lib/atlas";
import type { WindowStart } from "@/lib/market-schemas";

/**
 * The one window the change measures are read over (Phase 11 step 3). Scatter
 * and table share it, because a table on one window beside a scatter on another
 * would mislead (bearing.md, "The window is uniform"). In memory only: step 6
 * decides whether it joins the map's address state.
 */

interface AtlasWindowValue {
  window: WindowStart;
  setWindow: (w: WindowStart) => void;
  windows: WindowStart[];
  end: string;
}

const AtlasWindowContext = createContext<AtlasWindowValue | null>(null);

export function AtlasWindowProvider({
  windows,
  end,
  children,
}: {
  windows: WindowStart[];
  end: string;
  children: ReactNode;
}) {
  // The longest window is the default; the API serves them in that order's reverse
  // today, so pick by value, not position.
  const [window, setWindow] = useState<WindowStart>(
    windows.includes("2010") ? "2010" : (windows[windows.length - 1] ?? "2010"),
  );
  return (
    <AtlasWindowContext value={{ window, setWindow, windows, end }}>
      {children}
    </AtlasWindowContext>
  );
}

export function useAtlasWindow(): AtlasWindowValue {
  const v = useContext(AtlasWindowContext);
  if (!v)
    throw new Error("useAtlasWindow must be used inside AtlasWindowProvider");
  return v;
}

/** The mock's `.wsel` group: one window at a time, longest on the right. */
export function WindowSelect() {
  const { window, setWindow, windows, end } = useAtlasWindow();
  const ordered = [...windows].sort((a, b) => Number(b) - Number(a));
  return (
    <Segmented
      id="atlas-window-label"
      label="Window · the four change measures"
      options={ordered.map((w) => ({ value: w, label: windowLabel(w, end) }))}
      value={window}
      onChange={setWindow}
    />
  );
}

/** The Countries heading's hint, which has to follow the window. */
export function WindowHint() {
  const { window, end } = useAtlasWindow();
  return (
    <span className="text-sm text-text-muted">
      labelled by a city {"·"} change {windowLabel(window, end)} {"·"} click a
      header to sort
    </span>
  );
}
