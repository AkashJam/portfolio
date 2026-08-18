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
import { navLinks } from "@/lib/nav";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

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
        {/* Symbols group (SIM: tickers, Cost-of-Living cities) arrives with
            the Ticker backend — Days 5-9, portfolio.md §15 */}
      </CommandList>
    </CommandDialog>
  );
}
