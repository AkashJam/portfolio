import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/shell/Container";
import { buttonVariants } from "@/components/ui/button";
import { fullStackYears, proofFigures } from "@/data/experience";
import { heroHeadline, heroRole } from "@/data/profile";
import { cn } from "@/lib/utils";

// The text sits over the band's line on short screens, so it carries the canvas as
// a soft halo (site-review/home.html): readable without a panel behind it.
const halo = "[text-shadow:0_0_18px_var(--canvas),0_0_6px_var(--canvas),0_0_2px_var(--canvas)]";

/**
 * Home's hero (phase18.md D4, I14, I15; `site-review/home.html`): the text from the
 * top, then the band, full-bleed, filling what is left of the screen under the bar
 * and scrolling away with the section. `children` is the band.
 */
export function Hero({ hasLiveBand, children }: { hasLiveBand: boolean; children?: ReactNode }) {
  const stats = [{ value: `${fullStackYears()} yrs`, label: "full-stack" }, ...proofFigures.slice(0, 2)];
  return (
    <section className="relative flex min-h-[calc(100svh-56px)] flex-col border-b border-hairline">
      <Container className={cn("relative z-10 w-full pt-8 pb-6 md:pt-14 md:pb-8", halo)}>
        <p className="text-meta tracking-[0.2em] text-text-muted uppercase">
          Akash James · {heroRole} · Milan
        </p>
        <h1 className="mt-5 max-w-[16ch] text-h1 font-light text-text">{heroHeadline}</h1>
        {hasLiveBand && (
          <p className="mt-4.5 max-w-measure text-lead text-read">
            The chart <span className="md:hidden">under</span>
            <span className="hidden md:inline">behind</span> this page is one of them, live only while New
            York trades.
          </p>
        )}
        <div className="mt-7">
          <Link
            href="/market"
            className={cn(buttonVariants({ size: "lg" }), "h-12 w-full text-small [text-shadow:none] md:h-10 md:w-auto md:px-4.5")}
          >
            Open the dashboard
          </Link>
        </div>
        <ul aria-label="At a glance" className="mt-7 flex flex-wrap items-end gap-x-7 gap-y-4 md:mt-9 md:gap-x-11">
          {stats.map((stat) => (
            <li key={stat.label}>
              <b className="block font-mono text-[26px] leading-none font-medium text-text tabular-nums md:text-[32px]">
                {stat.value}
              </b>
              <span className="mt-2 block text-small text-text-muted">{stat.label}</span>
            </li>
          ))}
        </ul>
      </Container>
      {children}
    </section>
  );
}
