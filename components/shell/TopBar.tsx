"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isActive, siteLinks, surfaceLinks, type NavItem } from "@/lib/nav";
import { IdentityMark } from "@/components/shell/IdentityMark";
import { Container } from "@/components/shell/Container";
import { MarketDot } from "@/components/shell/MarketDot";
import { useShortcutLabel } from "@/components/shell/useShortcutLabel";

function NavTab({ link, pathname }: { link: NavItem; pathname: string }) {
  const active = isActive(link.href, pathname);
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-small tracking-wide uppercase transition-colors ${
        // text-brand (#6366f1 on #0b0d0f) is 4.35:1 — fails WCAG
        // AA's 4.5:1 for this text size (caught by e2e/axe.spec.ts).
        // text-brand-hover (#818cf8) is 6.53:1, passes comfortably.
        active ? "text-brand-hover" : "text-text-muted hover:text-text"
      }`}
    >
      {link.label}
      {/* The Market tab carries the three-state indicator (bearing.md #104). */}
      {link.icon === "market" && <MarketDot className="ml-[7px]" />}
    </Link>
  );
}

export function TopBar({
  onOpenPalette,
  onOpenDrawer,
  drawerOpen,
  paletteOpen,
}: {
  onOpenPalette: () => void;
  onOpenDrawer: () => void;
  drawerOpen: boolean;
  paletteOpen: boolean;
}) {
  const pathname = usePathname();
  const shortcut = useShortcutLabel();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/80 backdrop-blur supports-backdrop-filter:bg-canvas/60">
      <Container className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={onOpenDrawer}
          >
            <Menu className="size-5" />
          </Button>

          <Link href="/" aria-label="Home" className="shrink-0">
            <IdentityMark />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {siteLinks.map((link) => (
              <NavTab key={link.href} link={link} pathname={pathname} />
            ))}
            {/* Market and Atlas are the two live surfaces: a hairline sets them apart (#104). */}
            <span aria-hidden="true" className="mx-2 h-4 w-px bg-hairline" />
            {surfaceLinks.map((link) => (
              <NavTab key={link.href} link={link} pathname={pathname} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-2 text-text-muted md:inline-flex"
            aria-label="Open command palette"
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
            aria-keyshortcuts="Control+K Meta+K"
            onClick={onOpenPalette}
          >
            <Search className="size-4" />
            {/* One control, icon and chip. The chip holds its width until the platform is known (I11). */}
            <kbd
              aria-hidden="true"
              className={`min-w-[2.75rem] rounded border border-hairline px-1.5 py-0.5 text-center font-mono text-meta ${shortcut ? "" : "invisible"}`}
            >
              {shortcut ?? "Ctrl K"}
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open command palette"
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
            onClick={onOpenPalette}
          >
            <Search className="size-4.5" />
          </Button>
        </div>
      </Container>
    </header>
  );
}
