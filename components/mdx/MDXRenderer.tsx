"use client";

import { MDXContent } from "@content-collections/mdx/react";

import { ArchFlow } from "@/components/mdx/ArchFlow";
import { Callout } from "@/components/mdx/Callout";
import { DeeperLinks } from "@/components/mdx/DeeperLinks";
import { LatencyTrace } from "@/components/mdx/LatencyTrace";
import { Pre } from "@/components/mdx/Pre";

const components = { ArchFlow, Callout, DeeperLinks, LatencyTrace, pre: Pre };

/** Renders a Content Collections document's compiled `mdx` string. Client-only — `useMDXComponent`'s runtime eval can't run server-side. */
export function MDXRenderer({ code }: { code: string }) {
  return (
    <div className="prose max-w-none prose-headings:font-light">
      <MDXContent code={code} components={components} />
    </div>
  );
}
