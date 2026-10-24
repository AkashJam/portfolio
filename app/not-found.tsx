import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shell/Container";
import { ErrorTrace } from "@/components/site/ErrorTrace";
import { SITE_NAME } from "@/lib/metadata";

// Every real route replaces the layout's metadata through pageMetadata; the 404 has
// no route of its own, so it names itself (M24).
export const metadata: Metadata = { title: `Not found — ${SITE_NAME}` };

// One group in one screen under the 56px bar (mockups/site-review/errors.html): the
// message, the trace in its own band, then the button, so nothing overlaps.
export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-center overflow-clip pt-12 pb-[9svh] max-md:pt-8 max-md:pb-[8svh]">
      <Container className="w-full">
        <span
          aria-hidden="true"
          className="block font-mono text-[clamp(72px,11vw,128px)] leading-none font-light tracking-tight text-text tabular-nums"
        >
          404
        </span>
        <h1 className="mt-4.5 max-w-[22ch] text-[clamp(26px,3.4vw,40px)] leading-[1.15] font-light text-balance text-text">
          This page drifted off the chart.
        </h1>
        <p className="mt-3.5 max-w-[46ch] text-pretty text-body text-read">
          The link may be broken, or the page may have moved.
        </p>
      </Container>
      <div className="my-9 max-md:mt-7 max-md:mb-6">
        <ErrorTrace variant="flat" />
      </div>
      <Container className="w-full">
        <div className="flex flex-wrap items-center gap-3">
          <Button render={<Link href="/" />} nativeButton={false} className="max-md:h-12 max-md:w-full">
            ← Back home
          </Button>
        </div>
      </Container>
    </div>
  );
}
