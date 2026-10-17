// A fixture ticker for the ledger's e2e (portfolio.md §15 Phase 15 step 7,
// decision 6). It answers GET /market/events, /market/tape and /market/state from
// canned data (e2e/fixtures/*.json, made by e2e/fixtures/generate.mjs) and
// forwards every other request, including the SSE stream, to the real ticker, so
// the rest of the page is exactly what it is against the simulator.
//
//   node e2e-fixture/fixture-ticker.mjs --port 4010 --mode tripped|quiet|empty
//
// It also answers GET /market/sensors/{japan|MUFG} (Phase 16 step 2): Japan's record,
// built from the same events, with an invented series. Every other sensor's record
// is the real ticker's, which has no events, so NVDA is the zero-event page.
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

// Japan's record: weekday closes from 1 July to the last close, MUFG against IXG, and
// the ledger's own Japan events without their bands. The trigger's go-live is set to the
// last close, so the cadence line has one judged session to count.
function japanRecord() {
  const dates = [];
  for (let d = new Date("2026-07-01T00:00:00Z"); d <= new Date("2026-10-15T00:00:00Z"); d = new Date(d.getTime() + 86_400_000)) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) dates.push(d.toISOString().slice(0, 10));
  }
  const close = dates.map((_, i) => Math.round((20 + i * 0.02 + Math.sin(i / 5) * 0.8) * 100) / 100);
  const benchmarkClose = dates.map((_, i) => Math.round((126 + i * 0.05 + Math.cos(i / 7) * 1.5) * 100) / 100);
  const mine = ledger().events.filter((e) => e.symbol === "MUFG").map((e) => {
      const rest = { ...e };
      delete rest.band;
      return rest;
    });
  return {
    symbol: "MUFG",
    name: "Mitsubishi UFJ",
    country: { slug: "japan", name: "Japan", atlas: true },
    theme: null,
    benchmark: "IXG",
    benchmarkReason: null,
    thin: null,
    baseSession: dates[0],
    series: { dates, close, benchmarkClose },
    sessionsObserved: dates.length,
    latestSession: dates[dates.length - 1],
    judgedFrom: "2026-10-15",
    sessionsJudged: 1,
    eventCount: mine.length,
    events: mine,
  };
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
    if (req.method === "GET" && /^\/market\/sensors\/(japan|mufg)$/i.test(path)) return send(res, 200, japanRecord());
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
