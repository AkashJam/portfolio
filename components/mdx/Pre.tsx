"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

/**
 * Overrides MDX's compiled `<pre>` output (rehype-pretty-code, wired in
 * content-collections.ts) with a copy button — rehype-pretty-code handles
 * syntax highlighting and the optional filename figcaption
 * (```ts title="x.ts"```) itself; this only adds the interactive layer on
 * top, reading the rendered code's text via a ref rather than needing the
 * raw source separately.
 */
export function Pre({ children, ...props }: React.ComponentProps<"pre">) {
  const ref = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    const text = ref.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="not-prose group/code relative">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute top-2 right-2 rounded-md border border-hairline bg-panel-2 p-1.5 text-text-muted opacity-0 transition-opacity group-hover/code:opacity-100 hover:text-text focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <pre
        ref={ref}
        {...props}
        className="overflow-x-auto rounded-xl border border-hairline bg-panel p-4 text-sm [&_[data-highlighted-line]]:border-l-2 [&_[data-highlighted-line]]:border-brand [&_[data-highlighted-line]]:bg-brand/10"
      >
        {children}
      </pre>
    </div>
  );
}
