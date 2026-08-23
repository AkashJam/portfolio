import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LiveBadge } from "@/components/market/LiveBadge";
import { cn } from "@/lib/utils";
import type { CostOfLiving } from "@/lib/market-schemas";

/**
 * Cost-of-Living table (portfolio.md §18 `/market`) — SSR-only from
 * lib/ticker-client.ts's getCostOfLiving(); COL doesn't stream, so no SSE
 * subscription here (unlike MarketTable).
 */
export function CostOfLivingTable({ rows }: { rows: CostOfLiving[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>City</TableHead>
          <TableHead className="text-right">Local / month</TableHead>
          <TableHead className="text-right">≈ EUR</TableHead>
          <TableHead className="text-right">YoY</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.city}>
            <TableCell>
              <Link href={`/market/COL:${row.city}`} className="flex items-center gap-2 hover:text-brand">
                <span>{row.city}</span>
                <LiveBadge simulated={row.simulated} />
              </Link>
            </TableCell>
            <TableCell className="text-right font-mono">
              {row.localValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.localCurrency}
            </TableCell>
            <TableCell className="text-right font-mono text-text-muted">
              €{row.eurValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </TableCell>
            <TableCell
              className={cn("text-right font-mono", row.changeYoY >= 0 ? "text-simulated" : "text-market-down")}
            >
              {row.changeYoY >= 0 ? "+" : ""}
              {row.changeYoY.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
