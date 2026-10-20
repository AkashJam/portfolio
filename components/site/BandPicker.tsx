"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import type { PriceEntry } from "@/components/market/PricesTable";
import { changeDirection, changeLabel, type PriceRow } from "@/lib/prices";
import { cn } from "@/lib/utils";

const DIRECTION = { up: "text-market-up", down: "text-market-down", flat: "text-text-muted" } as const;

const GROUPS = [
  { group: "country" as const, title: "Countries · Americas, Europe, Asia-Pacific" },
  { group: "global" as const, title: "Global" },
];

export const placeOf = (e: PriceEntry["sensor"]): string => e.country ?? e.theme ?? e.name;

/**
 * The band's one control (portfolio.md §15 Phase 14 step 9; mock `home-band.html`):
 * the eighteen sensors, grouped and ordered exactly as /market's Prices, never
 * sorted by movement, so the two lists read as one. A listbox in a popover at every
 * width: a four-chip row cannot hold eighteen. The trigger names the country and
 * the ticker; below 768 the country goes and the ticker stays.
 */
export function BandPicker({
  entries,
  rows,
  active,
  frozen,
  onSelect,
}: {
  entries: PriceEntry[];
  rows: Map<string, PriceRow>;
  active: string;
  frozen: boolean;
  onSelect: (symbol: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = entries.find((e) => e.sensor.symbol === active)?.sensor;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        data-testid="band-picker"
        aria-label={`Chart symbol: ${active}. Choose a different sensor`}
        className="hero-chip is-active flex flex-none items-center gap-1.5 rounded-[7px] border border-hairline bg-panel px-2.25 py-0.75 font-mono text-[11.5px] tracking-[0.04em] text-text"
      >
        <span>
          {current && <span className="hidden text-text-muted md:inline">{placeOf(current)} · </span>}
          {active}
        </span>
        <ChevronDown className="size-3" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        {/* The sticky header is 57px. Without top padding the list flips upward on a
            short viewport and its first rows (the Countries label, Canada) sit under it. */}
        <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={{ top: 64, right: 8, bottom: 8, left: 8 }}>
          <Popover.Popup className="max-h-(--available-height) w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-[10px] border border-hairline bg-panel p-1.5 font-mono text-xs shadow-lg">
            <div role="listbox" aria-label="Chart symbol">
              {GROUPS.map(({ group, title }) => (
                <div key={group} role="group" aria-label={title}>
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-[0.18em] text-text-muted uppercase">
                    {title}
                  </div>
                  {entries
                    .filter((e) => e.sensor.group === group)
                    .map(({ sensor }) => {
                      const row = rows.get(sensor.symbol);
                      const selected = sensor.symbol === active;
                      return (
                        <button
                          key={sensor.symbol}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            onSelect(sensor.symbol);
                            setOpen(false);
                          }}
                          className={cn(
                            "grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-3 rounded-md px-2.5 py-1.5 text-left",
                            selected ? "bg-brand/15 text-text" : "text-text-muted hover:bg-canvas hover:text-text",
                          )}
                        >
                          <span className={selected ? "text-text" : "text-read"}>{placeOf(sensor)}</span>
                          <span className="tracking-[0.04em] text-text-muted">{sensor.symbol}</span>
                          <span className={cn("tabular-nums", frozen || !row ? "text-text-muted" : DIRECTION[changeDirection(row)])}>
                            {row ? changeLabel(row) : "—"}
                          </span>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
