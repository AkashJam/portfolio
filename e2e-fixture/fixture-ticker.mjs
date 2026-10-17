// A fixture ticker for the ledger's e2e (portfolio.md §15 Phase 15 step 7,
// decision 6). It answers GET /market/events, /market/tape and /market/state from
// canned data (e2e/fixtures/*.json, made by e2e/fixtures/generate.mjs) and
// forwards every other request, including the SSE stream, to the real ticker, so
// the rest of the page is exactly what it is against the simulator.
//
//   node e2e-fixture/fixture-ticker.mjs --port 4010 --mode tripped|quiet|empty
//
// Modes: tripped serves the fixture as is; quiet ages every entry by eleven
// sessions and says nothing tripped; empty serves no entries.
import { readFileSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const port = Number(arg("port", "4010"));
const mode = arg("mode", "tripped");
const upstream = new URL(process.env.TICKER_API_URL ?? "http://localhost:8080");

const events = JSON.parse(readFileSync(join(here, "../e2e/fixtures/events.json"), "utf8"));
const tape = JSON.parse(readFileSync(join(here, "../e2e/fixtures/tape.json"), "utf8"));

function ledger() {
  if (mode === "empty") return { events: [], truncated: false, latestSession: events.latestSession };
  if (mode === "quiet") {
    return { ...events, events: events.events.map((e) => ({ ...e, sessionsAgo: e.sessionsAgo + 11 })) };
  }
  return events;
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function forward(req, res) {
  const proxied = http.request(
    { hostname: upstream.hostname, port: upstream.port || 80, path: req.url, method: req.method, headers: { ...req.headers, host: upstream.host } },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  proxied.on("error", () => send(res, 502, { error: "the real ticker is not reachable" }));
  res.on("close", () => proxied.destroy());
  req.pipe(proxied);
}

http
  .createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    if (req.method === "GET" && path === "/market/events") return send(res, 200, ledger());
    if (req.method === "GET" && path === "/market/tape") return send(res, 200, tape);
    if (req.method === "GET" && path === "/market/state") {
      // The real feed and session, with the trip this fixture says there is.
      const real = http.get({ hostname: upstream.hostname, port: upstream.port || 80, path: "/market/state" }, (up) => {
        let body = "";
        up.on("data", (d) => (body += d));
        up.on("end", () => {
          let state;
          try {
            state = JSON.parse(body);
          } catch {
            state = { feed: "down", session: "open", opensAt: null };
          }
          send(res, 200, { ...state, tripped: mode === "tripped" });
        });
      });
      real.on("error", () => send(res, 200, { feed: "down", session: "open", opensAt: null, tripped: mode === "tripped" }));
      return;
    }
    return forward(req, res);
  })
  .listen(port, "127.0.0.1", () => console.log(`fixture ticker (${mode}) on ${port}, real ticker at ${upstream.origin}`));
