import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Separate from vitest.config.ts on purpose (§21) — this tier needs a live
// `ticker` (+ Redis + Timescale) actually running, unlike every other unit
// test, so it's never run as part of the fast `npm run test` step.
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // lib/ticker-client.ts imports "server-only", which throws unless
      // the bundler sets Next's `react-server` export condition — Vitest
      // doesn't, so alias straight to the package's own no-op export
      // (what that condition resolves to inside Next itself).
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.contract.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
