"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import * as React from "react";

// The one error boundary app/error.tsx can't cover: a crash in the root
// layout.tsx itself. Next.js requires this file to render its own <html>/
// <body> (the real root layout is what's presumed broken), so it stays
// deliberately minimal rather than reusing site components/providers that
// might be implicated in the crash.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
