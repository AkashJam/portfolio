"use client";

import * as React from "react";

import { LoadingSweep } from "@/components/shell/LoadingSweep";
import { TopBar } from "@/components/shell/TopBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { Footer } from "@/components/shell/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <>
      <LoadingSweep />
      <TopBar
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenDrawer={() => setDrawerOpen(true)}
      />
      <MobileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
