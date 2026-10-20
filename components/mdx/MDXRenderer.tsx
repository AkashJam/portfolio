import { MDXContent } from "@content-collections/mdx/react";

import { ArchFlow } from "@/components/mdx/ArchFlow";
import { Callout } from "@/components/mdx/Callout";
import { DeeperLinks } from "@/components/mdx/DeeperLinks";
import { LatencyTrace } from "@/components/mdx/LatencyTrace";
import { Pre } from "@/components/mdx/Pre";
import type { LatencyStats } from "@/lib/latency";

const components = { ArchFlow, Callout, DeeperLinks, LatencyTrace, pre: Pre };

/**
 * Renders a Content Collections document's compiled `mdx` string, on the
 * server. `@content-collections/mdx/react` resolves to its server build under
 * the react-server condition, so the browser gets HTML: no MDX runtime, no
 * second copy of the content as a prop, and no `'unsafe-eval'` in the CSP
 * (phase17.md step 4, decision 9). `Pre` is the one interactive component and
 * is its own client island.
 *
 * `latencyStats` is how measured data reaches `<LatencyTrace>`: the page
 * fetches it and it's bound in here, which keeps `LatencyTrace` a plain
 * presentational component.
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
