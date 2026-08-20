import { Glow } from "@/components/site/Glow";
import { GlowBar } from "@/components/site/GlowBar";
import { TechMarquee } from "@/components/site/TechMarquee";
import { heroRole } from "@/data/profile";

export function Hero() {
  const words = heroRole.split(" ");
  const last = words.at(-1);
  const boldPart = words.slice(0, -1).join(" ");

  return (
    <section className="relative flex h-[78vh] min-h-130 items-center justify-center overflow-hidden">
      <Glow variant="orb" className="inset-0 m-auto size-85" />
      <TechMarquee />

      <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
        <h1 className="text-[clamp(46px,8vw,92px)] leading-none font-light text-text">
          Akash James
        </h1>
        <GlowBar className="w-24" />
        <p className="text-sm tracking-[0.3em] text-text-muted uppercase">
          <b className="font-semibold text-text">{boldPart}</b> {last}
        </p>
      </div>
    </section>
  );
}
