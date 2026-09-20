import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorTrace } from "@/components/site/ErrorTrace";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[52vh] max-w-3xl flex-col items-center justify-center rounded-[18px] border border-hairline bg-panel px-6 py-14 text-center">
      <span className="font-mono text-[clamp(72px,11vw,118px)] leading-none font-light tracking-tight text-text tabular-nums">
        404
      </span>
      <div className="relative my-2 h-8.5 w-full flex-none" aria-hidden="true">
        <ErrorTrace variant="flat" />
      </div>
      <h2 className="text-balance text-[clamp(20px,2.6vw,27px)] font-normal tracking-tight text-text">
        This page drifted off the chart.
      </h2>
      <p className="mt-3 max-w-[46ch] text-pretty text-base text-text-muted">
        The link may be broken, or the page may have moved.
      </p>
      <div className="mt-6.5 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/" />} nativeButton={false}>
          ← Back home
        </Button>
        <span className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-hairline px-4 text-sm text-text-muted">
          Press{" "}
          <kbd className="rounded border border-hairline bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-text">
            ⌘K
          </kbd>{" "}
          to search
        </span>
      </div>
    </div>
  );
}
