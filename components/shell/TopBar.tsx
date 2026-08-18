"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/nav";
import { MarketButton } from "@/components/shell/MarketButton";

export function TopBar({
  onOpenPalette,
  onOpenDrawer,
}: {
  onOpenPalette: () => void;
  onOpenDrawer: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/80 backdrop-blur supports-backdrop-filter:bg-canvas/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm tracking-wide uppercase transition-colors ${
                  active ? "text-brand" : "text-text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={onOpenDrawer}
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-2 text-text-muted md:inline-flex"
            aria-label="Open command palette"
            onClick={onOpenPalette}
          >
            <Search className="size-4" />
            <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-xs">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open command palette"
            onClick={onOpenPalette}
          >
            <Search className="size-4.5" />
          </Button>
          <MarketButton />
        </div>
      </div>
    </header>
  );
}
