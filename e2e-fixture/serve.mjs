// Starts everything the fixture suite needs and keeps it running: three fixture
// tickers and three copies of the built site, one per ledger state. Playwright
// runs this as its web server (playwright.fixture.config.ts).
//
// The site is the production build (`output: "standalone"`), as the default
// suite runs it. It is built here only if it is missing; run `npm run build`
// first to pick up a code change.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITES = { tripped: [3010, 4010], quiet: [3011, 4011], empty: [3012, 4012] };
const children = [];

if (!existsSync(join(root, ".next/standalone/server.js"))) {
  const build = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
}
// The standalone output needs the static files and public/ beside it.
cpSync(join(root, "public"), join(root, ".next/standalone/public"), { recursive: true });
cpSync(join(root, ".next/static"), join(root, ".next/standalone/.next/static"), { recursive: true });

for (const [mode, [site, ticker]] of Object.entries(SITES)) {
  children.push(
    spawn("node", ["e2e-fixture/fixture-ticker.mjs", "--port", String(ticker), "--mode", mode], { cwd: root, stdio: "inherit" }),
    spawn("node", [".next/standalone/server.js"], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, PORT: String(site), HOSTNAME: "127.0.0.1", TICKER_API_URL: `http://127.0.0.1:${ticker}` },
    }),
  );
}

const stop = () => {
  for (const c of children) c.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const c of children) c.on("exit", (code) => code && stop());
