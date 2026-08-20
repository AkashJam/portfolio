import { Glow } from "@/components/site/Glow";

/** About page's background sphere — large, top-right, partially off-screen (portfolio.md §18). */
export function ParallaxSphere() {
  return (
    <Glow variant="sphere" className="top-30 -right-35 size-130" />
  );
}
