// Starts the two copies of the built site the fixture suite reads, one per ledger
// state, each against its own real ticker, and each from its own copy of the build
// directory: a prerendered page's route cache is on disk under .next/ and is keyed by
// route, not by the ticker it was fetched from, so two processes in one directory
// would serve each other's pages once a route has `revalidate` (the record page has,
// since phase18.md step 3, M21) and the tripped site would show the quiet site's
// Japan, with no event. Playwright runs this as its web server
// (playwright.fixture.config.ts).
//
// The tickers are not started here: they are the real ticker on the simulator, each
// with its own database (filled by `ticker fixture --state <state>`) and its own
// Redis (phase17.md step 5, decision 3). CI starts them from the ticker image
// (.github/workflows/ci.yml, "Fixture tickers"). Locally, from the ticker repo, with
// a database per state and a Redis on 6380 and 6381:
//
//   createdb fixture_tripped && go run ./cmd migrate --db-dsn <dsn>/fixture_tripped
//   go run ./cmd fixture --state tripped --db-dsn <dsn>/fixture_tripped
//   go run ./cmd serve --source sim --finnhub-api-key "" --addr :4010 --db-dsn <dsn>/fixture_tripped --redis-addr localhost:6380
//
// and the same for quiet on 4011 and 6381. The empty --finnhub-api-key matters when
// .env sets one: with a key, serve runs the daily sweep, whose start-up catch-up
// writes the last real session into the fixture database, and the ledger, the tape
// and `tripped` then no longer match CI, whose tickers have no key (2026-10-23).
//
// The site is the production build (`output: "standalone"`), as the default suite
// runs it. It is built here only if it is missing; run `npm run build` first to pick
// up a code change.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITES = { tripped: [3010, 4010], quiet: [3011, 4011] };
const children = [];

for (const [mode, [, ticker]] of Object.entries(SITES)) {
  const ready = await fetch(`http://127.0.0.1:${ticker}/ready`).then((r) => r.ok, () => false);
  if (!ready) {
    console.error(`fixture: no ${mode} ticker answers on ${ticker}; start it first (see the top of e2e-fixture/serve.mjs)`);
    process.exit(1);
  }
}

if (!existsSync(join(root, ".next/standalone/server.js"))) {
  const build = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
}
// The standalone output needs the static files and public/ beside it.
cpSync(join(root, "public"), join(root, ".next/standalone/public"), { recursive: true });
cpSync(join(root, ".next/static"), join(root, ".next/standalone/.next/static"), { recursive: true });

for (const [mode, [site, ticker]] of Object.entries(SITES)) {
  // server.js changes into its own directory, so the copy's .next/server and .next/cache
  // are this site's alone.
  const dir = join(root, `.next/standalone-${mode}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(join(root, ".next/standalone"), dir, { recursive: true });
  // The build reaches whatever ticker TICKER_API_URL names (CI's: the simulator, with no
  // events), so generateStaticParams prerendered every record from it, and a record page
  // is served as built for `revalidate`. Drop those pages and the build's fetch cache so
  // each site renders its records, on first request, from its own fixture ticker.
  const market = join(dir, ".next/server/app/market");
  for (const f of readdirSync(market)) {
    if (/\.(html|rsc|meta|segments)$/.test(f)) rmSync(join(market, f), { recursive: true, force: true });
  }
  rmSync(join(dir, ".next/cache"), { recursive: true, force: true });
  children.push(
    spawn("node", ["server.js"], {
      cwd: dir,
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
