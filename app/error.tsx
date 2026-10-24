"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shell/Container";
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
    <div className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-center overflow-clip pt-12 pb-[9svh] max-md:pt-8 max-md:pb-[8svh]">
      <Container className="w-full">
        <span
          aria-hidden="true"
          className="block font-mono text-[clamp(72px,11vw,128px)] leading-none font-light tracking-tight text-text tabular-nums"
        >
          500
        </span>
        <h1 className="mt-4.5 max-w-[22ch] text-[clamp(26px,3.4vw,40px)] leading-[1.15] font-light text-balance text-text">
          The feed cut out on our side.
        </h1>
        <p className="mt-3.5 max-w-[46ch] text-pretty text-body text-read">
          This one is logged and already on its way to me. Trying again usually works.
        </p>
      </Container>
      <div className="my-9 max-md:mt-7 max-md:mb-6">
        <ErrorTrace variant="broken" />
      </div>
      <Container className="w-full">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={reset} className="max-md:h-12 max-md:w-full">
            ↻ Try again
          </Button>
          <Button render={<Link href="/" />} nativeButton={false} variant="ghost" className="max-md:h-12 max-md:w-full">
            Back home
          </Button>
        </div>
      </Container>
    </div>
  );
}
