import Link from "next/link";

import { Glow } from "@/components/site/Glow";
import { GlowBar } from "@/components/site/GlowBar";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-4 overflow-hidden px-4 py-24 text-center">
      <Glow variant="orb" floatDistance="-20px" className="inset-0 m-auto size-85" />
      <span className="relative z-10 font-mono text-[118px] leading-none font-light text-text">
        404
      </span>
      <GlowBar className="relative z-10 w-26" />
      <p className="relative z-10 text-text-muted">Page not found.</p>
      <Link
        href="/"
        className="relative z-10 font-mono text-sm text-text-faint transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none"
      >
        ← Back home
      </Link>
    </div>
  );
}
