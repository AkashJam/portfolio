"use client";

import Link from "next/link";
import { Download, Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { navLinks } from "@/lib/nav";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_HREF } from "@/lib/contact";

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
              className="flex items-center rounded-lg bg-brand/10 px-3 py-2 text-sm tracking-wide text-text uppercase"
            >
              Market
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] tracking-normal text-market-up normal-case">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-market-up motion-safe:animate-pulse"
                />
                live
              </span>
            </Link>
          </nav>
          <a
            href={RESUME_HREF}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text"
          >
            <Download className="size-4" />
            Résumé (PDF)
          </a>
          <div className="flex gap-4 px-3 text-xs tracking-[0.2em] text-text-muted uppercase">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-text">
              GitHub
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="hover:text-text">
              LinkedIn
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-text">
              Email
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
