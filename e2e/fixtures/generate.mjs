// Regenerates events.json and tape.json: the canned ledger the fixture ticker
// serves (portfolio.md §15 Phase 15 step 7, decision 6). Deterministic, so the
// files only change when this script does. Every figure is internally
// consistent (the band is built from the closes with the same arithmetic the
// ticker uses), but the prices and the headlines are invented: this is a fixture,
// not data. Run: node e2e/fixtures/generate.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// A small deterministic generator, so the fixtures never drift between runs.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function weekdaysEnding(end, n) {
  const out = [];
  const d = new Date(`${end}T00:00:00Z`);
  while (out.length < n) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) out.unshift(d.toISOString());
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out;
}

const round = (v, p = 4) => Math.round(v * 10 ** p) / 10 ** p;

/** Closes for n sessions ending on `end`, ordinary +-1% days, then the final moves given. */
function closesWith(seed, n, start, finals) {
  const rnd = lcg(seed);
  const out = [];
  let px = start;
  for (let i = 0; i < n; i++) {
    const move = i >= n - finals.length ? finals[i - (n - finals.length)] : (rnd() - 0.5) * 0.02;
    px *= 1 + move;
    out.push(round(px, 2));
  }
  return out;
}

function band(dates, close, sigma, threshold, seed) {
  const rnd = lcg(seed);
  const lower = [];
  const upper = [];
  for (let i = 0; i < close.length; i++) {
    const prev = i === 0 ? close[0] : close[i - 1];
    const b = (rnd() - 0.5) * 0.008;
    lower.push(round(prev * (1 + b - threshold * sigma), 3));
    upper.push(round(prev * (1 + b + threshold * sigma), 3));
  }
  return { dates, close, lower, upper };
}

const headline = (title, link, at, side) => ({ title, link, publishedAt: at, side });

function outlets(names, closedAt, day, nBefore, nAfter, topic) {
  const out = [];
  names.forEach((name, i) => {
    const after = i >= nBefore ? 1 : 0;
    const hour = after ? 21 + (i % 3) : 5 + (i % 12);
    const at = `${day}T${String(hour).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`;
    const items = [headline(`${topic} (${name})`, `https://news.google.com/rss/articles/${name.replace(/\W/g, "")}${i}`, at, after ? "after" : "before")];
    if (i % 5 === 0) {
      const next = `${day}T${String(hour + 1).padStart(2, "0")}:30:00Z`;
      items.push(headline(`${topic}, a second look (${name})`, `https://news.google.com/rss/articles/${name.replace(/\W/g, "")}${i}b`, next, after ? "after" : "before"));
    }
    out.push({ name, url: `https://www.${name.toLowerCase().replace(/\W/g, "")}.example`, items });
  });
  return out;
}

const SESSION = "2026-10-15";
const DATES = weekdaysEnding(SESSION, 60);

function src(status, extra = {}) {
  return { status, attempts: 2, fetchedAt: "2026-10-16T21:20:00Z", ...extra };
}

// 1. Japan: both parts passed, every source answered.
const jpClose = closesWith(11, 60, 22, [-0.012, -0.028, -0.0483]);
const japan = {
  id: "japan-2026-10-15",
  symbol: "MUFG",
  name: "Mitsubishi UFJ",
  sessionDate: SESSION,
  closedAt: "2026-10-15T20:00:00Z",
  sessionsAgo: 0,
  country: { slug: "japan", name: "Japan", atlas: true },
  theme: null,
  price: { close: jpClose[59], prevClose: jpClose[58], change: round(jpClose[59] - jpClose[58], 2), changePercent: round(((jpClose[59] / jpClose[58]) - 1) * 100, 2) },
  trigger: { symbolReturn: -0.0483, benchmark: "IXG", benchmarkReturn: -0.0043, benchmarkReason: null, residual: -0.044, sigma: 0.0142, z: -3.1, threshold: 2.5, window: 60 },
  band: band(DATES, jpClose, 0.0142, 2.5, 21),
  split: {
    status: "ok", label: "both", currency: "JPY", source: "daily", fixDate: SESSION, ratePrevious: 150.1, rateCurrent: 152.9,
    residual: -0.044, currencyPart: { value: -0.019, sigma: 0.0073, z: -2.6 }, stockPart: { value: -0.025, sigma: 0.0114, z: -2.2 },
    threshold: 2, window: 60, windowStart: "2026-07-21",
  },
  coverage: {
    stage: "followUp", complete: true, routing: "both", window: { from: "2026-10-14", to: "2026-10-17" }, closedAt: "2026-10-15T20:00:00Z",
    sources: {
      centralBank: src("ok", {
        query: "https://www.boj.or.jp/en/rss/whatsnew.xml",
        items: [{ title: "Bank of Japan: Summary of Opinions at the Monetary Policy Meeting", link: "https://www.boj.or.jp/en/mopo/example", publishedAt: "2026-10-15T08:00:00Z", side: "before", language: "en" }],
      }),
      economyNews: src("ok", {
        query: '"Bank of Japan" OR "Japanese yen" OR "Japan economy"',
        outlets: outlets(["Nikkei", "Reuters", "Bloomberg", "Japan Times", "Kyodo", "Financial Times", "Mainichi", "Nikkei Asia", "Japan Today", "MarketWatch", "Reuters Japan", "Jiji", "The Asahi Shimbun", "Barron's"], "2026-10-15T20:00:00Z", SESSION, 9, 5, "Yen slides as policy outlook shifts"),
        total: 71, excluded: 14, nonEnglish: 0,
      }),
      sectorNews: src("ok", {
        query: 'MUFG OR "Japanese banks"',
        outlets: outlets(["Nikkei", "Reuters", "Bloomberg", "Japan Times", "Kyodo", "Mainichi"], "2026-10-15T20:00:00Z", SESSION, 4, 2, "Japanese lenders fall on rate bets"),
        total: 44, excluded: 9, nonEnglish: 0,
      }),
      filings: src("empty", { query: "CIK 0000067088, form 6-K", absent: { reason: "no 6-K was filed in the window" }, categorised: false }),
    },
  },
  caveats: [],
  thin: null,
};

// 2. Korea: a thin listing, stock-led, up.
const krClose = closesWith(22, 60, 100, [0.004, 0.012, 0.0371]);
const korea = {
  id: "korea-2026-10-02",
  symbol: "KB",
  name: "KB Financial Group",
  sessionDate: "2026-10-02",
  closedAt: "2026-10-02T20:00:00Z",
  sessionsAgo: 9,
  country: { slug: "korea", name: "South Korea", atlas: true },
  theme: null,
  price: { close: krClose[59], prevClose: krClose[58], change: round(krClose[59] - krClose[58], 2), changePercent: round(((krClose[59] / krClose[58]) - 1) * 100, 2) },
  trigger: { symbolReturn: 0.0371, benchmark: "IXG", benchmarkReturn: 0.0021, benchmarkReason: null, residual: 0.035, sigma: 0.0129, z: 2.7, threshold: 2.5, window: 60 },
  band: band(weekdaysEnding("2026-10-02", 60), krClose, 0.0129, 2.5, 22),
  split: {
    status: "ok", label: "stock-led", currency: "KRW", source: "daily", fixDate: "2026-10-02", ratePrevious: 1390, rateCurrent: 1387,
    residual: 0.035, currencyPart: { value: 0.002, sigma: 0.0066, z: 0.3 }, stockPart: { value: 0.033, sigma: 0.0127, z: 2.6 },
    threshold: 2, window: 60, windowStart: "2026-07-10",
  },
  coverage: {
    stage: "followUp", complete: true, routing: "stock-led", window: { from: "2026-10-01", to: "2026-10-04" }, closedAt: "2026-10-02T20:00:00Z",
    sources: {
      sectorNews: src("ok", {
        query: '"KB Financial" OR "Korean banks"',
        outlets: outlets(["Yonhap", "Korea Herald", "JoongAng Daily", "Reuters", "Bloomberg", "Investing.com", "Nikkei Asia", "Chosun Ilbo", "Maeil Business", "Korea Times", "BusinessKorea"], "2026-10-02T20:00:00Z", "2026-10-02", 7, 4, "Korean banks rally on dividend hopes"),
        total: 28, excluded: 4, nonEnglish: 0,
      }),
      filings: src("empty", { query: "CIK 0001445930, form 6-K", absent: { reason: "no 6-K was filed in the window" }, categorised: false }),
    },
  },
  caveats: ["thin_listing"],
  thin: { usdM: 25, asOf: "2026-10-09", label: "thin listing" },
};

// 3. Brazil: currency-led, a Portuguese central bank item.
const brClose = closesWith(33, 60, 10, [0.002, -0.014, -0.0342]);
const brazil = {
  id: "brazil-2026-09-18",
  symbol: "ITUB",
  name: "Itaú Unibanco",
  sessionDate: "2026-09-18",
  closedAt: "2026-09-18T20:00:00Z",
  sessionsAgo: 19,
  country: { slug: "brazil", name: "Brazil", atlas: true },
  theme: null,
  price: { close: brClose[59], prevClose: brClose[58], change: round(brClose[59] - brClose[58], 2), changePercent: round(((brClose[59] / brClose[58]) - 1) * 100, 2) },
  trigger: { symbolReturn: -0.0342, benchmark: "IXG", benchmarkReturn: 0.001, benchmarkReason: null, residual: -0.0352, sigma: 0.0135, z: -2.6, threshold: 2.5, window: 60 },
  band: band(weekdaysEnding("2026-09-18", 60), brClose, 0.0135, 2.5, 33),
  split: {
    status: "ok", label: "currency-led", currency: "BRL", source: "daily", fixDate: "2026-09-18", ratePrevious: 5.42, rateCurrent: 5.58,
    residual: -0.0352, currencyPart: { value: -0.0295, sigma: 0.0098, z: -3 }, stockPart: { value: -0.0057, sigma: 0.0121, z: -0.5 },
    threshold: 2, window: 60, windowStart: "2026-06-30",
  },
  coverage: {
    stage: "followUp", complete: true, routing: "currency-led", window: { from: "2026-09-17", to: "2026-09-20" }, closedAt: "2026-09-18T20:00:00Z",
    sources: {
      centralBank: src("ok", {
        query: "https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/noticias",
        items: [{ title: "BC divulga nota sobre o mercado de câmbio", link: "https://www.bcb.gov.br/detalhenoticia/example", publishedAt: "2026-09-18T14:00:00Z", side: "before", language: "pt" }],
      }),
      economyNews: src("ok", {
        query: 'Brazil (economy OR "central bank" OR "Brazilian real")',
        outlets: outlets(["Reuters", "Bloomberg", "Americas Quarterly", "Brazil Reports", "Valor International"], "2026-09-18T20:00:00Z", "2026-09-18", 3, 2, "Real weakens on fiscal worries"),
        total: 27, excluded: 3, nonEnglish: 1,
      }),
    },
  },
  caveats: [],
  thin: null,
};

// 4. Caterpillar: a global name, no split, an 8-K with item codes.
const catClose = closesWith(44, 60, 700, [0.003, -0.02, -0.0797]);
const cat = {
  id: "cat-2026-09-10",
  symbol: "CAT",
  name: "Caterpillar",
  sessionDate: "2026-09-10",
  closedAt: "2026-09-10T20:00:00Z",
  sessionsAgo: 25,
  country: null,
  theme: "Industrial cycle",
  price: { close: catClose[59], prevClose: catClose[58], change: round(catClose[59] - catClose[58], 2), changePercent: round(((catClose[59] / catClose[58]) - 1) * 100, 2) },
  trigger: { symbolReturn: -0.0797, benchmark: "EXI", benchmarkReturn: -0.0054, benchmarkReason: null, residual: -0.0743, sigma: 0.0158, z: -4.7, threshold: 2.5, window: 60 },
  band: band(weekdaysEnding("2026-09-10", 60), catClose, 0.0158, 2.5, 44),
  split: { status: "none", reason: "no_home_currency" },
  coverage: {
    stage: "followUp", complete: true, routing: "global", window: { from: "2026-09-09", to: "2026-09-12" }, closedAt: "2026-09-10T20:00:00Z",
    sources: {
      filings: src("ok", {
        query: "CIK 0000018230, form 8-K",
        categorised: true,
        items: [{
          title: "FORM 8-K", link: "https://www.sec.gov/Archives/edgar/data/18230/000110465926116198/example_8k.htm", publishedAt: "2026-09-10T23:31:00Z", side: "after", form: "8-K",
          itemCodes: [
            { code: "5.02", title: "Departure of Directors or Certain Officers; Election of Directors; Appointment of Certain Officers" },
            { code: "9.01", title: "Financial Statements and Exhibits" },
          ],
        }],
      }),
      topicNews: src("ok", {
        query: '"mining equipment" OR "industrial stocks" OR "manufacturing PMI"',
        outlets: outlets(["TradingView", "Yahoo Finance", "Global Mining Review", "Reuters", "Barron's", "Industry Week"], "2026-09-10T20:00:00Z", "2026-09-10", 4, 2, "Industrial stocks slide"),
        total: 53, excluded: 28, nonEnglish: 0,
      }),
    },
  },
  caveats: ["self_weight"],
  thin: null,
};

// 5. Colombia: no atlas row, a central bank source that kept failing.
const coClose = closesWith(55, 60, 6, [0.01, -0.002, 0.0461]);
const colombia = {
  id: "colombia-2026-08-27",
  symbol: "CIB",
  name: "Grupo Cibest",
  sessionDate: "2026-08-27",
  closedAt: "2026-08-27T20:00:00Z",
  sessionsAgo: 33,
  country: { slug: "colombia", name: "Colombia", atlas: false },
  theme: null,
  price: { close: coClose[59], prevClose: coClose[58], change: round(coClose[59] - coClose[58], 2), changePercent: round(((coClose[59] / coClose[58]) - 1) * 100, 2) },
  trigger: { symbolReturn: 0.0461, benchmark: "IXG", benchmarkReturn: 0.0012, benchmarkReason: null, residual: 0.0449, sigma: 0.0118, z: 3.8, threshold: 2.5, window: 60 },
  band: band(weekdaysEnding("2026-08-27", 60), coClose, 0.0118, 2.5, 55),
  split: { status: "none", reason: "no_ecb_currency" },
  coverage: {
    stage: "followUp", complete: true, routing: "none", window: { from: "2026-08-26", to: "2026-08-29" }, closedAt: "2026-08-27T20:00:00Z",
    sources: {
      centralBank: src("error", { attempts: 3, error: "centralbank: HTTP 403", query: "https://www.banrep.gov.co/rss.xml" }),
      economyNews: src("ok", {
        query: 'Colombia (economy OR "central bank" OR "Colombian peso")',
        outlets: outlets(["Reuters", "Bloomberg", "Colombia One"], "2026-08-27T20:00:00Z", "2026-08-27", 2, 1, "Colombian assets rise"),
        total: 26, excluded: 2, nonEnglish: 0,
      }),
      filings: src("empty", { query: "CIK 0002058897, form 6-K", absent: { reason: "no 6-K was filed in the window" }, categorised: false }),
      sectorNews: src("empty", { query: 'Bancolombia OR "Colombian banks"', absent: { reason: "the query returned no headlines in the window" } }),
    },
  },
  caveats: [],
  thin: null,
};

// 6. Canada: recorded, with its split and its news still pending.
const caClose = closesWith(66, 60, 190, [0.001, 0.004, 0.0214]);
const canada = {
  id: "canada-2026-08-05",
  symbol: "RY",
  name: "Royal Bank of Canada",
  sessionDate: "2026-08-05",
  closedAt: "2026-08-05T20:00:00Z",
  sessionsAgo: 48,
  country: { slug: "canada", name: "Canada", atlas: true },
  theme: null,
  price: { close: caClose[59], prevClose: caClose[58], change: round(caClose[59] - caClose[58], 2), changePercent: round(((caClose[59] / caClose[58]) - 1) * 100, 2) },
  trigger: { symbolReturn: 0.0214, benchmark: "IXG", benchmarkReturn: 0.0006, benchmarkReason: null, residual: 0.0208, sigma: 0.0071, z: 2.9, threshold: 2.5, window: 60 },
  band: band(weekdaysEnding("2026-08-05", 60), caClose, 0.0071, 2.5, 66),
  split: null,
  coverage: null,
  caveats: [],
  thin: null,
};

const events = { events: [japan, korea, brazil, cat, colombia, canada], truncated: false, latestSession: SESSION };
writeFileSync(join(here, "events.json"), JSON.stringify(events, null, 2) + "\n");

// The tape: eighteen sensors, sixty closes each, and the trigger's z on the last.
const SENSORS = ["RY", "ITUB", "AMX", "BCH", "CIB", "BAP", "LYG", "MUFG", "KB", "HDB", "TLK", "TKC", "ING", "NVDA", "AAPL", "XOM", "JPM", "CAT"];
const ZS = { RY: 0.4, ITUB: -1.4, AMX: 1.2, BCH: -0.1, CIB: 0.9, BAP: 0.6, LYG: -0.3, MUFG: -3.1, KB: 0.5, HDB: 1.8, TLK: null, TKC: -0.7, ING: -0.8, NVDA: 0.2, AAPL: 0.2, XOM: 0.5, JPM: -0.2, CAT: -0.6 };
const tape = {
  asOf: SESSION,
  sensors: SENSORS.map((symbol, i) => {
    const short = symbol === "TLK"; // fewer than sixty returns: no z, and a stated reason
    const n = short ? 24 : 60;
    const closes = closesWith(100 + i, n, 20 + i * 7, symbol === "MUFG" ? [-0.012, -0.028, -0.0483] : []);
    const z = ZS[symbol];
    return {
      symbol,
      dates: DATES.slice(60 - n),
      closes,
      z: short ? null : z,
      sigma: short ? null : 0.014,
      ...(short ? { reason: "insufficient_history" } : {}),
    };
  }),
};
writeFileSync(join(here, "tape.json"), JSON.stringify(tape, null, 2) + "\n");
console.log("wrote events.json and tape.json");
