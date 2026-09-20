import Link from "next/link";

import { Button } from "@/components/ui/button";
import { heroRole } from "@/data/profile";

export function Hero() {
  return (
    <section className="pt-14">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-mono text-xs tracking-[0.2em] text-text-muted uppercase">
          Akash James · {heroRole} · Milan
        </p>
        <h1 className="mt-5 max-w-[20ch] text-[clamp(34px,5.5vw,64px)] leading-[1.05] font-light text-text">
          I build production-grade streaming systems on AWS.
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg text-text-muted">
          The chart below is one of them — ingesting, storing and pushing to your browser right
          now.
        </p>
        <div className="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <Button render={<Link href="/market" />} nativeButton={false} size="lg">
            Open the dashboard
          </Button>
          <Link
            href="/projects/market-ticker"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
          >
            How it was built →
          </Link>
        </div>
      </div>
    </section>
  );
}
