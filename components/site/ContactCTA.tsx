import { Mail } from "lucide-react";

import { CopyEmailButton } from "@/components/site/CopyEmailButton";
import { Container } from "@/components/shell/Container";
import { buttonVariants } from "@/components/ui/button";
import { CONTACT_EMAIL } from "@/lib/contact";
import { cn } from "@/lib/utils";

const halo = "[text-shadow:0_0_18px_var(--canvas),0_0_6px_var(--canvas)]";

// Latitudes and meridians of a plain graticule, drawn as gentle curves
// (`site-review/home.html`). It is decoration, not a map: only the label says where.
const PARALLELS = [
  "M0,110 Q600,60 1200,110",
  "M0,250 Q600,205 1200,250",
  "M0,390 Q600,352 1200,390",
  "M0,530 Q600,500 1200,530",
  "M0,660 Q600,640 1200,660",
];
const MERIDIANS = [
  "M180,0 Q130,350 180,700",
  "M400,0 Q370,350 400,700",
  "M620,0 Q610,350 620,700",
  "M840,0 Q852,350 840,700",
  "M1060,0 Q1094,350 1060,700",
];

const mask = "radial-gradient(ellipse 70% 75% at 60% 45%, #000 30%, transparent 78%)";

/**
 * Home's contact (phase18.md D5, I16; `site-review/home.html`, option B): the call, a
 * "looking for" line, "Email me" and the address with a copy action, over a graticule
 * with Milan marked, fading towards every edge. GitHub, LinkedIn and the résumé stay in
 * the footer. The "looking for" line is a draft for the content pass (Phase 23).
 */
export function ContactCTA() {
  return (
    <section aria-labelledby="contact-heading" className="relative overflow-clip pt-30 pb-42 md:py-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" className="block size-full">
          {[...PARALLELS, ...MERIDIANS].map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--color-text)" strokeOpacity={0.13} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      {/* Placed per width so the label is never clipped: beside the call on desktop, under it on phones. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-18 flex flex-row-reverse items-center gap-6 text-right md:top-[38%] md:right-auto md:bottom-auto md:left-[64%] md:flex-row md:gap-3 md:text-left"
      >
        <i className="relative block size-2.5 rounded-full bg-brand-hover shadow-[0_0_0_14px_color-mix(in_oklab,var(--brand)_14%,transparent)]" />
        <div>
          <b className="block font-mono text-meta leading-snug font-medium text-read">Milan</b>
          <span className="block font-mono text-meta leading-snug text-text-muted">45.46° N · 9.19° E</span>
        </div>
      </div>
      <Container className="relative">
        <p className="text-meta tracking-[0.2em] text-text-muted uppercase">Contact</p>
        <h2 id="contact-heading" className={cn("mt-3.5 text-[clamp(32px,5vw,56px)] leading-none font-light text-text", halo)}>
          Let&apos;s build something.
        </h2>
        <p className={cn("mt-5 max-w-[44ch] text-lead text-read", halo)}>
          Open to full-stack or backend roles · based in Milan, hybrid or remote · long-term work permit in Italy.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3.5">
          <a href={`mailto:${CONTACT_EMAIL}`} className={cn(buttonVariants({ size: "lg" }), "h-10 gap-2 px-4.5 text-small")}>
            <Mail aria-hidden="true" className="size-4" />
            Email me
          </a>
          <span className={cn("inline-flex items-center gap-2 font-mono text-small text-text-muted", halo)}>
            {CONTACT_EMAIL}
            <CopyEmailButton />
          </span>
        </div>
      </Container>
    </section>
  );
}
