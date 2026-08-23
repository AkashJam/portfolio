import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Glow } from "@/components/site/Glow";
import { GlowBar } from "@/components/site/GlowBar";
import { heroRole } from "@/data/profile";
import { RESUME_HREF } from "@/lib/contact";

export function Hero({ symbolCount }: { symbolCount: number | null }) {
  const words = heroRole.split(" ");
  const last = words.at(-1);
  const boldPart = words.slice(0, -1).join(" ");

  return (
    <section className="relative flex h-[78vh] min-h-130 items-center justify-center overflow-hidden">
      <Glow variant="orb" animate={false} className="inset-0 m-auto size-85" />

      <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
        {symbolCount !== null && (
          <div className="flex items-center gap-2 rounded-full border border-hairline bg-panel-2 px-3 py-1.5 font-mono text-xs text-text-muted">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-market-up motion-safe:animate-pulse"
            />
            LIVE · {symbolCount} symbols streaming
          </div>
        )}
        <h1 className="text-[clamp(46px,8vw,92px)] leading-none font-light text-text">
          Akash James
        </h1>
        <GlowBar className="w-24" />
        <p className="max-w-[40ch] text-lg text-read">
          I build production-grade streaming systems on AWS — including the live one behind this
          page.
        </p>
        <p className="text-sm tracking-[0.3em] text-text-muted uppercase">
          <b className="font-semibold text-text">{boldPart}</b> {last}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/market" />} nativeButton={false}>
            View the live system →
          </Button>
          <Button render={<a href={RESUME_HREF} />} nativeButton={false} variant="ghost">
            Résumé ↓
          </Button>
        </div>
      </div>
    </section>
  );
}
