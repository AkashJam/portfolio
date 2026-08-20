"use client";

import * as React from "react";

import { Glow } from "@/components/site/Glow";
import { GlowBar } from "@/components/site/GlowBar";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // TODO(days 13-14): Sentry.captureException(error) once error tracking lands.
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-4 overflow-hidden px-4 py-24 text-center">
      <Glow
        variant="orb"
        color="down"
        floatDistance="-20px"
        className="inset-0 m-auto size-85"
      />
      <span className="relative z-10 font-mono text-[118px] leading-none font-light text-text">
        500
      </span>
      <GlowBar color="down" className="relative z-10 w-26" />
      <p className="relative z-10 text-text-muted">Something went wrong.</p>
      <button
        type="button"
        onClick={reset}
        className="relative z-10 font-mono text-sm text-text-faint transition-colors hover:text-market-down focus-visible:text-market-down focus-visible:outline-none"
      >
        ↻ Try again
      </button>
    </div>
  );
}
