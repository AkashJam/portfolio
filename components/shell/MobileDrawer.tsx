"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navLinks } from "@/lib/nav";

export function MobileDrawer({
  open,
  onOpenChange,
  onOpenPalette,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPalette: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-3/4 max-w-xs">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation and search
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onOpenPalette();
            }}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-panel px-3 py-2 text-sm text-text-muted"
          >
            <Search className="size-4" />
            Search...
          </button>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onOpenChange(false)}
                className="rounded-lg px-3 py-2 text-sm tracking-wide uppercase text-text hover:bg-panel"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/market"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-3 py-2 text-sm tracking-wide uppercase text-text hover:bg-panel"
            >
              Market
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
