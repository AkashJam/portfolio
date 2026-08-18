import Link from "next/link";
import { ChartCandlestick } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MarketButton() {
  return (
    <Button
      render={<Link href="/market" aria-label="Live markets" className="relative" />}
      nativeButton={false}
      variant="ghost"
      size="icon"
    >
      <ChartCandlestick className="size-4.5" />
      <span
        aria-hidden="true"
        className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-market-up motion-safe:animate-pulse"
      />
    </Button>
  );
}
