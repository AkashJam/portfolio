import Link from "next/link";
import { Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Glow } from "@/components/site/Glow";
import { GlowBar } from "@/components/site/GlowBar";
import { LiveChip } from "@/components/site/LiveChip";
import { heroRole } from "@/data/profile";

export function Hero({ symbols }: { symbols: string[] | null }) {
  const words = heroRole.split(" ");
  const last = words.at(-1);
  const boldPart = words.slice(0, -1).join(" ");

  return (
    <section className="relative flex h-[78vh] min-h-130 items-center justify-center overflow-hidden">
      <Glow variant="orb" animate={false} className="inset-0 m-auto size-85" />

      <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
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
        {symbols && symbols.length > 0 && <LiveChip symbols={symbols} />}
        <div className="mt-1">
          <Button render={<Link href="/market" />} nativeButton={false} size="lg">
            <Activity className="size-4" />
            View the live system →
          </Button>
        </div>
      </div>
    </section>
  );
}
