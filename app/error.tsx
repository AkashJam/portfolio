"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ErrorTrace } from "@/components/site/ErrorTrace";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[52vh] max-w-3xl flex-col items-center justify-center rounded-[18px] border border-hairline bg-panel px-6 py-14 text-center">
      <span className="font-mono text-[clamp(72px,11vw,118px)] leading-none font-light tracking-tight text-text tabular-nums">
        500
      </span>
      <div className="relative my-2 h-8.5 w-full flex-none" aria-hidden="true">
        <ErrorTrace variant="broken" />
      </div>
      <h2 className="text-balance text-[clamp(20px,2.6vw,27px)] font-normal tracking-tight text-text">
        The feed cut out on our side.
      </h2>
      <p className="mt-3 max-w-[46ch] text-pretty text-base text-text-muted">
        This one is logged and already on its way to me. Trying again usually works.
      </p>
      <div className="mt-6.5 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>↻ Try again</Button>
        <Button render={<Link href="/" />} nativeButton={false} variant="ghost">
          Back home
        </Button>
      </div>
    </div>
  );
}
