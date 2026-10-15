import { isClipped, meterWidth, rankTiles, type SectorTile } from "@/lib/industries";
import { changeDirection, changeLabel, newestVintage, pricesVintage, rowVintage } from "@/lib/prices";
import { cn } from "@/lib/utils";

const DIRECTION = { up: "text-market-up", down: "text-market-down", flat: "text-text-muted" } as const;

/**
 * The Industries strip (portfolio.md §15 Phase 14 step 5): ten global sector
 * baskets, each the close against the previous session's. They do not stream, so
 * this renders on the server with no client JS, and it is complete from the first
 * day: two sessions, not sixty. A close is the only honest print for a global
 * basket, whose intraday price is market-makers re-pricing markets that are shut.
 */
export function IndustriesStrip({ tiles, renderedAt }: { tiles: SectorTile[]; renderedAt: string }) {
  const ranked = rankTiles(tiles);
  const asOfs = tiles.map((t) => t.row.asOf);
  const stripAsOf = newestVintage(asOfs);

  return (
    <div data-testid="industries">
      <p data-testid="industries-vintage" className="mb-3 font-mono text-[12.5px] text-text-muted">
        {pricesVintage(asOfs, new Date(renderedAt), false)}
      </p>
      <ul
        aria-label="Industries, strongest to weakest"
        className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
      >
        {ranked.map(({ symbol, label, row }) => {
          const direction = changeDirection(row);
          const own = rowVintage(row.asOf, stripAsOf);
          const hasMove = row.asOf !== null && row.prevClose !== 0;
          return (
            <li key={symbol} data-testid={`industry-${symbol}`} className="flex flex-col gap-[7px] bg-panel px-3.5 py-[15px]">
              <span className="font-mono text-xs font-semibold tracking-[0.1em] text-text-muted">{symbol}</span>
              <span className="text-[11.5px] leading-tight text-text-muted">{label}</span>
              <span
                data-testid="industry-change"
                className={cn("font-mono text-[15px] font-semibold tabular-nums", DIRECTION[direction])}
              >
                {changeLabel(row)}
              </span>
              {own && <span className="text-[11px] text-text-muted">{own}</span>}
              {/* Decorative: the printed figure is the information. */}
              <span aria-hidden="true" className="relative block h-[3px] overflow-hidden rounded-sm bg-panel-2">
                {hasMove && direction !== "flat" && (
                  <i
                    data-clipped={isClipped(row.changePercent) ? "true" : undefined}
                    className={cn(
                      "absolute inset-y-0 block",
                      direction === "up" ? "left-1/2 bg-market-up" : "right-1/2 bg-market-down",
                    )}
                    style={{ width: `${meterWidth(row.changePercent)}%` }}
                  />
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3.5 max-w-[76ch] text-[13px] leading-relaxed text-text-muted">
        Each tile is an iShares Global sector fund, and the figure is its close against the previous session&rsquo;s.
      </p>
    </div>
  );
}
