// The /atlas address (Phase 22 step 3; phase18.md I51, I54). Every view setting
// lives in the query string and is written with replaceState, so a reload or a
// shared link keeps the view and Back leaves the page. The hash keeps only the
// scroll target: a section (`#map`) or a country row (`#italy`). Pure, so the
// rules are testable; the components read window.location and call these.

import type { ColumnKey, SortDir } from "@/lib/atlas";
import { MEASURES } from "@/lib/atlas-plot";
import type { MapState } from "@/lib/atlas-map";
import { CHIPS, type ChipId } from "@/lib/atlas-readings";
import type { WindowStart } from "@/lib/market-schemas";

export const VIEWS = ["compare", "map", "countries"] as const;
export type View = (typeof VIEWS)[number];

export const DEFAULT_VIEW: View = "compare";

const isView = (s: string | null): s is View => VIEWS.some((v) => v === s);

export interface HashParts {
  /** A section the hash names (`#map`), which opens that tab. */
  section: View | null;
  /** A country row (`#italy`), which opens Countries and highlights the row. */
  target: string | null;
  /** The pre-Phase-22 home city (`#home=japan`), read once and moved to `?home=`. */
  legacyHome: string | null;
}

/** `#map`, `#italy`, `#italy&home=japan` and `#home=japan` all read: parts joined by `&`. */
export function parseHashParts(hash: string): HashParts {
  let section: View | null = null;
  let target: string | null = null;
  let legacyHome: string | null = null;
  for (const part of hash.replace(/^#/, "").split("&")) {
    if (part.startsWith("home=")) legacyHome = decodeURIComponent(part.slice(5)) || null;
    else if (isView(part)) section ??= part;
    else if (part && target === null) target = decodeURIComponent(part);
  }
  return { section, target, legacyHome };
}

/** The tab an address opens: `?view=`, else the hash's section, else Countries for a row, else Compare. */
export function resolveView(search: string, hash: string): View {
  const asked = new URLSearchParams(search).get("view");
  if (isView(asked)) return asked;
  const { section, target } = parseHashParts(hash);
  return section ?? (target ? "countries" : DEFAULT_VIEW);
}

/** The query with one parameter set, or removed when `value` is null; the others are untouched. */
export function withParam(search: string, key: string, value: string | null): string {
  const q = new URLSearchParams(search);
  if (value === null) q.delete(key);
  else q.set(key, value);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * The address after switching tab. The default view is omitted, unless a row is
 * named in the hash: `#italy` alone would reopen Countries, so Compare must say so.
 */
export function viewAddress(search: string, hash: string, view: View): { search: string; hash: string } {
  const { target } = parseHashParts(hash);
  const keep = view === DEFAULT_VIEW && !target ? null : view;
  return { search: withParam(search, "view", keep), hash: target ? `#${encodeURIComponent(target)}` : "" };
}

/** The address with the home city set (or cleared), the legacy hash form dropped. */
export function homeAddress(search: string, hash: string, home: string | null): { search: string; hash: string } {
  const { section, target } = parseHashParts(hash);
  const keep = target ?? section;
  return { search: withParam(search, "home", home), hash: keep ? `#${encodeURIComponent(keep)}` : "" };
}

/** The home city an address names: `?home=`, else the legacy `#home=`. */
export function readHome(search: string, hash: string): string | null {
  return new URLSearchParams(search).get("home") || parseHashParts(hash).legacyHome;
}

// ---- Compare (phase18.md I51) -------------------------------------------------
// `?q=` names a question tab; `?x=&y=` a built comparison; `?window=` the shared
// window. Defaults are omitted, so a plain /atlas stays plain.

export interface CompareState {
  /** The question tab, or null for a built comparison. */
  chip: ChipId | null;
  x: ColumnKey;
  y: ColumnKey;
  /** The window the address names, or null for the default. */
  window: WindowStart | null;
}

const MEASURE_KEYS = MEASURES.map((m) => m.key);

/** Reads `?q=`, `?x=&y=` and `?window=`; anything unreadable falls back to the first question. */
export function parseCompare(search: string, windows: WindowStart[]): CompareState {
  const q = new URLSearchParams(search);
  const w = q.get("window");
  const window = windows.find((x) => x === w) ?? null;
  const asked = CHIPS.find((c) => c.id === q.get("q"));
  if (asked) return { chip: asked.id, x: asked.x, y: asked.y, window };
  const x = MEASURE_KEYS.find((k) => k === q.get("x"));
  const y = MEASURE_KEYS.find((k) => k === q.get("y"));
  if (x && y && x !== y) return { chip: null, x, y, window };
  return { chip: CHIPS[0].id, x: CHIPS[0].x, y: CHIPS[0].y, window };
}

/** The query after a Compare change; the other parameters (view, home, map) are untouched. */
export function compareSearch(search: string, state: CompareState, defaultWindow: WindowStart): string {
  let s = withParam(search, "q", state.chip && state.chip !== CHIPS[0].id ? state.chip : null);
  s = withParam(s, "x", state.chip ? null : state.x);
  s = withParam(s, "y", state.chip ? null : state.y);
  return withParam(s, "window", state.window && state.window !== defaultWindow ? state.window : null);
}

// ---- Countries (phase18.md I51, I56) --------------------------------------------
// `?cols=more` opens the five extra columns; `?sort=<column>` or `?sort=<column>.desc`
// orders the rows. The defaults (four columns, average spending ascending) are omitted.

export interface TableState {
  more: boolean;
  key: ColumnKey;
  dir: SortDir;
}

export const DEFAULT_SORT: { key: ColumnKey; dir: SortDir } = { key: "everydaySpendingEur", dir: "asc" };

const COLUMN_KEYS: ColumnKey[] = [
  "housing", "prices", "everydaySpendingEur", "shares", "currency", "gniPpp", "unemployment", "lifeExpectancy",
];

/** Reads `?cols=` and `?sort=`; anything unreadable falls back to the defaults. */
export function parseTable(search: string): TableState {
  const q = new URLSearchParams(search);
  const [name, suffix] = (q.get("sort") ?? "").split(".");
  const key = COLUMN_KEYS.find((k) => k === name);
  const dir: SortDir = suffix === "desc" ? "desc" : suffix === "asc" ? "asc" : DEFAULT_SORT.dir;
  return {
    more: q.get("cols") === "more",
    ...(key ? { key, dir } : DEFAULT_SORT),
  };
}

/** The query after a table change; the other parameters (view, home, compare) are untouched. */
export function tableSearch(search: string, state: TableState): string {
  const isDefault = state.key === DEFAULT_SORT.key && state.dir === DEFAULT_SORT.dir;
  const s = withParam(search, "cols", state.more ? "more" : null);
  return withParam(s, "sort", isDefault ? null : `${state.key}${state.dir === "desc" ? ".desc" : ""}`);
}

// ---- Map (phase18.md I51, I58) ---------------------------------------------------
// `?measure=` names the map's measure and `?year=` one year; housing over the whole
// window is the default and is omitted. `parseAddress` in lib/atlas-map.ts reads them.

/** The query after a map change; every other parameter (view, home, compare, table) is untouched. */
export function mapSearch(search: string, state: MapState): string {
  const s = withParam(search, "measure", state.measure === "housing" ? null : state.measure);
  return withParam(s, "year", state.period === "year" ? String(state.year) : null);
}
