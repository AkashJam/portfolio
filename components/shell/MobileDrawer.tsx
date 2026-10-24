"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavIcon } from "@/components/shell/NavIcon";
import { isActive, siteLinks, surfaceLinks, type NavItem } from "@/lib/nav";
import {
  CONTACT_EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  RESUME_HREF,
} from "@/lib/contact";
import { IdentityMark } from "@/components/shell/IdentityMark";
import { MarketDot } from "@/components/shell/MarketDot";
import { useMarketState } from "@/components/shell/MarketStateProvider";
import { tripsLabel } from "@/lib/market-state";
import { cn } from "@/lib/utils";
import { heroRole } from "@/data/profile";

const row =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-small text-text hover:bg-panel";
// The current section, as the desktop nav marks it (I7).
const rowOn = "bg-brand/10 text-brand-hover hover:bg-brand/10";

function Hint({ children }: { children: string }) {
  return (
    <span className="ml-auto font-mono text-meta text-text-muted">
      {children}
    </span>
  );
}

/**
 * The Market row's right-hand side (I12): "1 unusual move" with the tab's indigo dot
 * after a trip at the last close, and the row's route like every other row on a
 * quiet day, an unreachable feed included (/market says so itself). The words are
 * sans, as the mock draws them: this is a sentence, not a figure.
 */
function MarketStateHint({ href }: { href: string }) {
  const state = useMarketState();
  if (state?.state !== "tripped") return <Hint>{href}</Hint>;
  return (
    <span data-testid="drawer-market-state" className="ml-auto flex min-w-0 items-center gap-1.5 text-meta leading-none whitespace-nowrap text-brand-hover">
      <MarketDot decorative className="mt-0" />
      {tripsLabel(state.trips)}
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
  const pathname = usePathname();
  const item = (link: NavItem) => {
    const active = isActive(link.href, pathname);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        onClick={() => onOpenChange(false)}
        className={cn(row, active && rowOn)}
      >
        <NavIcon icon={link.icon} className={cn("size-[15px] shrink-0", active ? "text-brand-hover" : "text-text-muted")} />
        {link.label}
        {link.icon === "market" ? <MarketStateHint href={link.href} /> : <Hint>{link.href}</Hint>}
      </Link>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-3/4 max-w-xs">
        <SheetHeader className="gap-3 border-b border-hairline">
          <div className="flex items-start gap-2.5 pr-10">
            <IdentityMark className="size-7.5 shrink-0 rounded-[9px]" />
            {/* The role wraps rather than truncating in the narrow drawer (I7); sans, since it is words. */}
            <p className="min-w-0 pt-[5px] text-meta leading-snug font-medium tracking-[0.12em] text-text-muted uppercase">
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
            className="flex items-center gap-2 rounded-lg border border-hairline bg-panel px-3 py-2 text-small text-text-muted"
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
            </a>
          </nav>
          <div className="flex gap-4 border-t border-hairline px-3 pt-4 text-meta tracking-[0.2em] text-text-muted uppercase">
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
