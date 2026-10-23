"use client";

import * as React from "react";

import { LoadingSweep } from "@/components/shell/LoadingSweep";
import { TopBar } from "@/components/shell/TopBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { Footer } from "@/components/shell/Footer";
import { MarketStateProvider } from "@/components/shell/MarketStateProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <MarketStateProvider>
      {/* First in the tab order: keyboard and screen-reader users jump past the bar (I5). */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-lg focus-visible:border focus-visible:border-hairline focus-visible:bg-panel focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-text focus-visible:outline-2 focus-visible:outline-brand"
      >
        Skip to content
      </a>
      <LoadingSweep />
      <TopBar
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenDrawer={() => setDrawerOpen(true)}
        drawerOpen={drawerOpen}
        paletteOpen={paletteOpen}
      />
      <MobileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {/* tabIndex -1 so the skip link moves focus here, not only the scroll position. */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </MarketStateProvider>
  );
}
