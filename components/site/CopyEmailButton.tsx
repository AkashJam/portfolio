"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/contact";

const COPIED_MS = 1500;

/**
 * The contact section's copy action (phase18.md D5): copies the address and says so,
 * as the palette's "Copy email" does. A real button, so the keyboard reaches it; the
 * live region announces the copy once.
 */
export function CopyEmailButton() {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy email address"
        className="inline-flex size-[30px] items-center justify-center rounded-lg border border-hairline text-text-muted transition-colors hover:border-brand hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {copied ? <Check aria-hidden="true" className="size-3.5 text-market-up" /> : <Copy aria-hidden="true" className="size-3.5" />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Email address copied" : ""}
      </span>
    </>
  );
}
