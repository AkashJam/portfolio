import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// §21 "Unit" tier only — pure logic, no jsdom/DOM needed. The contract
// test (needs a live ticker) is excluded here and run as its own step.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/*.contract.test.ts", "node_modules/**", ".next/**"],
  },
});
