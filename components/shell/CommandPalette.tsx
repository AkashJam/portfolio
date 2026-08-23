"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChartCandlestick } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { navLinks, type PaletteSymbol } from "@/lib/nav";
import { RESUME_HREF } from "@/lib/contact";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [symbols, setSymbols] = React.useState<PaletteSymbol[]>([]);

  React.useEffect(() => {
    // Fetched once per page load (this component lives in the root layout,
    // which persists across client-side navigations) rather than from a
    // server component — see app/api/palette-symbols/route.ts for why.
    fetch("/api/palette-symbols")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSymbols)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function go(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {navLinks.map((link) => (
            <CommandItem key={link.href} onSelect={() => go(link.href)}>
              {link.label}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => go("/market")}>
            <ChartCandlestick />
            Market
          </CommandItem>
        </CommandGroup>
        {symbols.length > 0 && (
          <CommandGroup heading="Symbols">
            {symbols.map((s) => (
              <CommandItem key={s.href} onSelect={() => go(s.href)}>
                <span>{s.label}</span>
                <span className="text-text-muted">{s.sublabel}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              window.open(RESUME_HREF, "_blank");
              onOpenChange(false);
            }}
          >
            Download résumé
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
