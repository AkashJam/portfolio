import Link from "next/link";

import { ProofStrip } from "@/components/site/ProofStrip";
import { Button } from "@/components/ui/button";
import { heroHeadline, heroRole } from "@/data/profile";

export function Hero({ hasLiveBand }: { hasLiveBand: boolean }) {
  return (
    <section className="pt-14">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-meta tracking-[0.2em] text-text-muted uppercase">
          Akash James · {heroRole} · Milan
        </p>
        <h1 className="mt-5 max-w-[20ch] text-h1 leading-[1.05] font-light text-text">
          {heroHeadline}
        </h1>
        {hasLiveBand && (
          <p className="mt-5 max-w-[52ch] text-lead text-read">
            The chart below is one of them — eighteen real instruments, ingested, stored, and
            pushed to your browser while New York trades.
          </p>
        )}
        <div className="mt-7 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <Button render={<Link href="/market" />} nativeButton={false} size="lg">
            Open the dashboard
          </Button>
          <Link
            href="/projects/market-ticker"
            className="inline-flex items-center gap-1.5 text-small text-text-muted hover:text-text"
          >
            How it was built →
          </Link>
        </div>
        <ProofStrip />
      </div>
    </section>
  );
}
