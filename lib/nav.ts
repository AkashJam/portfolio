export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

// One shaped entry per ⌘K "Symbols" result (CommandPalette.tsx) — built
// server-side in app/layout.tsx from the Ticker API (portfolio.md §15
// Phase C) so the palette itself stays a dumb client component with no
// API-shape knowledge.
export interface PaletteSymbol {
  href: string;
  label: string;
  sublabel: string;
}
