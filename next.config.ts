import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  // Lean runtime image (infra/Dockerfile's `runtime` stage) — traces only
  // the deps actually needed at runtime into .next/standalone.
  output: "standalone",
};

export default withContentCollections(nextConfig);
