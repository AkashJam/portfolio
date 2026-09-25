"use client";

import { MDXContent } from "@content-collections/mdx/react";

import { ArchFlow } from "@/components/mdx/ArchFlow";
import { Callout } from "@/components/mdx/Callout";
import { DeeperLinks } from "@/components/mdx/DeeperLinks";
import { LatencyTrace } from "@/components/mdx/LatencyTrace";
import { Pre } from "@/components/mdx/Pre";
import type { LatencyStats } from "@/lib/latency";

const components = { ArchFlow, Callout, DeeperLinks, LatencyTrace, pre: Pre };

/**
 * Renders a Content Collections document's compiled `mdx` string. Client-only — `useMDXComponent`'s runtime eval can't run server-side.
 *
 * `latencyStats` is how measured data reaches `<LatencyTrace>`: this is a
 * client component, so the MDX component can't query Prometheus itself.
 * The page (a server component) fetches it and it's bound in here.
 */
export function MDXRenderer({ code, latencyStats }: { code: string; latencyStats?: LatencyStats }) {
  const bound = latencyStats
    ? { ...components, LatencyTrace: (props: Parameters<typeof LatencyTrace>[0]) => <LatencyTrace {...props} stats={latencyStats} /> }
    : components;
  return (
    <div className="prose max-w-none prose-headings:font-light">
      <MDXContent code={code} components={bound} />
    </div>
  );
}
