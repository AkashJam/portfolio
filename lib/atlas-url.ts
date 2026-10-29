// The /atlas address (Phase 22 step 3; phase18.md I51, I54). Every view setting
// lives in the query string and is written with replaceState, so a reload or a
// shared link keeps the view and Back leaves the page. The hash keeps only the
// scroll target: a section (`#map`) or a country row (`#italy`). Pure, so the
// rules are testable; the components read window.location and call these.

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
