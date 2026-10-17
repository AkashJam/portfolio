export type NavIconKey =
  "home" | "projects" | "blog" | "about" | "market" | "atlas";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  /**
   * `site` is the four pages that are about me; `surface` is the two live
   * surfaces, drawn after a divider (bearing.md #104).
   */
  group: "site" | "surface";
}

/**
 * The one list: the top bar, the drawer, the footer and the command palette all
 * read it, so they cannot drift. The Market tab carries the three-state
 * indicator (components/shell/MarketDot), and the drawer's Market row says the
 * same state in words.
 */
export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "home", group: "site" },
  { href: "/projects", label: "Projects", icon: "projects", group: "site" },
  { href: "/blog", label: "Blog", icon: "blog", group: "site" },
  { href: "/about", label: "About", icon: "about", group: "site" },
  { href: "/market", label: "Market", icon: "market", group: "surface" },
  { href: "/atlas", label: "Atlas", icon: "atlas", group: "surface" },
];

export const siteLinks = navItems.filter((i) => i.group === "site");
export const surfaceLinks = navItems.filter((i) => i.group === "surface");

/** A palette-only entry: the map section of /atlas, which has its own address. */
export const atlasMapItem: NavItem = {
  href: "/atlas#map",
  label: "Atlas \u00b7 map",
  icon: "atlas",
  group: "surface",
};

/** The current-page rule: the home page only on `/`, every other item on its own prefix. */
export function isActive(href: string, pathname: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

// One shaped entry per ⌘K "Symbols" result (CommandPalette.tsx) — built
// server-side in app/layout.tsx from the Ticker API (portfolio.md §15
// Phase C) so the palette itself stays a dumb client component with no
// API-shape knowledge.
export interface PaletteSymbol {
  href: string;
  label: string;
  sublabel: string;
  /** Which ⌘K group the entry sits in; sensors unless it says otherwise. */
  group?: "sensors" | "cities";
}
