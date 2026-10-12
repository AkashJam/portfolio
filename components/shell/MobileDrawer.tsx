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
import { NavIcon } from "@/components/shell/NavIcon";
import { siteLinks, surfaceLinks, type NavItem } from "@/lib/nav";
import {
  CONTACT_EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  RESUME_HREF,
} from "@/lib/contact";
import { IdentityMark } from "@/components/shell/IdentityMark";
import { heroRole } from "@/data/profile";

const row =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text hover:bg-panel";

function Hint({ children }: { children: string }) {
  return (
    <span className="ml-auto font-mono text-[11px] text-text-muted">
      {children}
    </span>
  );
}

function Separator() {
  return <div aria-hidden="true" className="my-1 h-px bg-hairline" />;
}

/**
 * The drawer as drawn in shell-v2/command-palette-drawer.html: icons and route
 * hints, Market and Atlas grouped between dividers, Résumé as a row with its PDF
 * hint, the social links under a rule. It reads the same list as the top bar,
 * footer and palette (lib/nav.ts).
 */
export function MobileDrawer({
  open,
  onOpenChange,
  onOpenPalette,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPalette: () => void;
}) {
  const item = (link: NavItem) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={() => onOpenChange(false)}
      className={row}
    >
      <NavIcon icon={link.icon} className="size-[15px] text-text-muted" />
      {link.label}
      <Hint>{link.href}</Hint>
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-3/4 max-w-xs">
        <SheetHeader className="gap-3 border-b border-hairline">
          <div className="flex items-center gap-2.5 pr-10">
            <IdentityMark className="size-7.5 rounded-[9px]" />
            <p className="min-w-0 truncate font-mono text-[11px] tracking-widest text-text-muted">
              {heroRole} · Milan
            </p>
          </div>
          <SheetTitle className="sr-only">Menu</SheetTitle>
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
          <nav aria-label="Menu" className="flex flex-col gap-0.5">
            {siteLinks.map(item)}
            <Separator />
            {surfaceLinks.map(item)}
            <Separator />
            <a
              href={RESUME_HREF}
              onClick={() => onOpenChange(false)}
              className={row}
            >
              <Download
                aria-hidden="true"
                className="size-[15px] text-text-muted"
              />
              Résumé
              <Hint>PDF</Hint>
            </a>
          </nav>
          <div className="flex gap-4 border-t border-hairline px-3 pt-4 text-xs tracking-[0.2em] text-text-muted uppercase">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-text"
            >
              GitHub
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-text"
            >
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
