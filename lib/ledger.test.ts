import { describe, expect, it } from "vitest";

import eventsFixture from "@/lib/fixtures/ledger-events.json";
import {
  badgeWord,
  bandCaption,
  breakoutDirection,
  dividendLine,
  entryHeading,
  entryThrough,
  etClock,
  headLine,
  ledgerSentence,
  leftOut,
  methodLines,
  moreLabel,
  newsItems,
  noSplitText,
  outletCount,
  sentence,
  sessionShort,
  sessionsAgoLabel,
  sigmaLabel,
  signedChange,
  signedPercent,
  sigmaLine,
  sourcesOf,
  topNews,
  splitVerdict,
} from "@/lib/ledger";
import { eventsResponseSchema, type LedgerEvent } from "@/lib/market-schemas";

// Hand-made cases, chosen for variety: every split label, moves both ways, each
// dividend state. Never regenerated; the API's populated shapes are tested against
// the real ticker instead (phase17.md step 5). Parsing them here still catches a
// schema change.
const { events } = eventsResponseSchema.parse(eventsFixture);
const byId = (id: string): LedgerEvent => {
  const e = events.find((x) => x.id === id);
  if (!e) throw new Error(`no fixture ${id}`);
  return e;
};

describe("the fixtures are the contract", () => {
  it("parse against the schema the page uses", () => {
    expect(events).toHaveLength(6);
    expect(events[0].id).toBe("japan-2026-10-15");
  });
});

describe("formatting", () => {
  it("writes a true minus and two places", () => {
    expect(signedPercent(-4.83)).toBe("−4.83%");
    expect(signedPercent(3.7123)).toBe("+3.71%");
    expect(signedPercent(0)).toBe("0.00%");
    expect(signedPercent(-0.001)).toBe("0.00%"); // never "−0.00%"
    expect(signedChange(-0.58)).toBe("−0.58");
    expect(signedChange(2.8)).toBe("+2.80");
  });

  it("writes sigma with one decimal and a sign", () => {
    expect(sigmaLabel(-3.14)).toBe("−3.1σ");
    expect(sigmaLabel(2.7)).toBe("+2.7σ");
    expect(sigmaLabel(0.04)).toBe("0.0σ");
  });

  it("reads the close in New York time", () => {
    expect(etClock("2026-10-15T14:30:00Z")).toBe("10:30"); // EDT in October
    expect(etClock("2026-12-15T14:30:00Z")).toBe("09:30"); // EST in December
  });

  it("names a session date as a calendar day, not an instant", () => {
    expect(sessionShort("2026-10-06")).toBe("6 Oct");
    expect(sessionShort("2026-12-01")).toBe("1 Dec");
  });

  it("counts sessions ago in words", () => {
    expect(sessionsAgoLabel(0)).toBe("at the last close");
    expect(sessionsAgoLabel(1)).toBe("one session ago");
    expect(sessionsAgoLabel(11)).toBe("11 sessions ago");
  });
});

describe("an entry", () => {
  it("is headed by its country, or by a global name's theme", () => {
    expect(entryHeading(byId("japan-2026-10-15"))).toBe("Japan");
    expect(entryHeading(byId("cat-2026-09-10"))).toBe("Industrial cycle");
    expect(entryThrough(byId("japan-2026-10-15"))).toBe("through Mitsubishi UFJ (MUFG) · 15 Oct, at the close");
    expect(entryThrough(byId("cat-2026-09-10"))).toBe("through Caterpillar (CAT) · 10 Sep, at the close");
  });

  it("says which side the line left on, in words with no sigma", () => {
    expect(breakoutDirection(byId("japan-2026-10-15"))).toBe("down");
    expect(breakoutDirection(byId("korea-2026-10-02"))).toBe("up");
    expect(bandCaption(byId("japan-2026-10-15"))).toBe(
      "The shaded area is the normal range given what its sector did each day; the line left it below on Thursday.",
    );
    expect(bandCaption(byId("korea-2026-10-02"))).toContain("left it above");
  });

  it("badges the move in words from 2.5σ and 5σ", () => {
    expect(badgeWord(2.6)).toBe("Unusual move");
    expect(badgeWord(-4.9)).toBe("Unusual move");
    expect(badgeWord(-5)).toBe("Extremely unusual move");
    expect(badgeWord(8.2)).toBe("Extremely unusual move");
  });
});

describe("the sentence", () => {
  it("states the move, the sector's and the size to one decimal, and nothing it did not compute", () => {
    expect(ledgerSentence(byId("japan-2026-10-15"))).toBe(
      "Mitsubishi UFJ fell 4.9% on 15 Oct while global banks and financial companies fell 0.4%, about 3.1 times further than it usually moves against them, so the news from that day was fetched.",
    );
    expect(ledgerSentence(byId("korea-2026-10-02"))).toContain("KB Financial Group rose 3.7% on 2 Oct while global banks and financial companies rose 0.2%, about 2.7 times");
  });

  it("drops the sector clause when there is no benchmark, and is absent with no price", () => {
    const e = byId("japan-2026-10-15");
    const none = ledgerSentence({ ...e, trigger: { ...e.trigger, benchmark: null, benchmarkReturn: null } });
    expect(none).toBe("Mitsubishi UFJ fell 4.9% on 15 Oct, about 3.1 times further than it usually moves, so the news from that day was fetched.");
    expect(ledgerSentence({ ...e, price: null })).toBeNull();
  });

  it("uses none of the review's jargon", () => {
    for (const e of events) expect(ledgerSentence(e) ?? "").not.toMatch(/sensor|tripped|σ|band|threshold/i);
  });
});

describe("the split", () => {
  it("says what moved in words", () => {
    expect(splitVerdict(byId("japan-2026-10-15"))).toBe("Both moved: the stock and the currency each passed on their own (the yen fell 1.9%).");
    expect(splitVerdict(byId("korea-2026-10-02"))).toBe("The stock moved; the currency was quiet (the won rose 0.2%).");
    expect(splitVerdict(byId("brazil-2026-09-18"))).toBe("Mostly the currency (the real fell 2.9%).");
  });

  it("is absent, with a reason, where no split could be made", () => {
    expect(splitVerdict(byId("cat-2026-09-10"))).toBeNull();
    expect(noSplitText(byId("cat-2026-09-10").split?.reason)).toContain("global name has no home currency");
    expect(noSplitText(byId("colombia-2026-08-27").split?.reason)).toContain("publishes no daily rate");
    expect(noSplitText("something_new")).toBe("The move is not split by currency.");
    expect(splitVerdict(byId("canada-2026-08-05"))).toBeNull(); // pending: no split yet
  });

  it("says neither in words", () => {
    const e = byId("japan-2026-10-15");
    expect(splitVerdict({ ...e, split: { ...e.split!, label: "neither" } })).toBe("Both moved a little; neither explains it alone.");
  });
});

describe("the coverage", () => {
  const japan = byId("japan-2026-10-15");
  const econ = japan.coverage!.sources.economyNews;

  it("lists the sources in the page's order", () => {
    expect(sourcesOf(japan).map((s) => s.key)).toEqual(["centralBank", "economyNews", "sectorNews", "filings"]);
    expect(sourcesOf(byId("canada-2026-08-05"))).toEqual([]);
  });

  it("lists every news headline once, earliest first, and shows three outlets then the rest", () => {
    const items = newsItems(japan);
    expect(new Set(items.map((i) => i.link)).size).toBe(items.length);
    expect([...items].map((i) => i.publishedAt).sort()).toEqual(items.map((i) => i.publishedAt));
    const { top, rest } = topNews(items);
    expect(top).toHaveLength(3);
    expect(new Set(top.map((i) => i.outlet)).size).toBe(3);
    expect(top.length + rest.length).toBe(items.length);
    expect(moreLabel(rest)).toMatch(/^\+\d+ more, from \d+ outlets?$/);
    expect(outletCount(econ)).toBe(14);
  });

  it("says what it left out and nothing when it left nothing", () => {
    expect(leftOut(econ)).toBe("Left out of the 71 headlines the search returned: 14 from outlets that generate pages from price or filing data.");
    expect(leftOut({ ...econ, excluded: 0, nonEnglish: 0, undated: 0 })).toBeNull();
    expect(leftOut({ ...econ, nonEnglish: 2 })).toContain("2 not in English");
    expect(leftOut({ ...econ, noSubject: 3, duplicates: 1 })).toContain("3 that do not name their subject, ");
    expect(leftOut({ ...econ, noSubject: 3, duplicates: 1 })).toContain("1 repeated");
  });
});

describe("how it is calculated", () => {
  it("holds the sigma, the searches, the filing line and the Google News note", () => {
    const lines = methodLines(byId("japan-2026-10-15"));
    expect(sigmaLine(byId("japan-2026-10-15"))).toBe(
      "−3.1σ against global banks and financial companies (IXG): the close sat outside ±2.5σ of the residual over the last 60 trading days (σ = 1.42%).",
    );
    expect(lines.join("\n")).toContain('Searched: "Bank of Japan" OR');
    expect(lines.join("\n")).toContain("No company announcement was filed with the US regulator in the window (CIK 0000067088).");
    expect(lines.join("\n")).toContain("Links go via Google News.");
    expect(lines.join("\n")).toContain("European Central Bank's daily exchange rate");
  });
});

describe("sentence", () => {
  it("capitalises a stored reason and leaves nothing alone", () => {
    expect(sentence("no 6-K was filed in the window")).toBe("No 6-K was filed in the window");
    expect(sentence("")).toBe("");
  });
});

describe("the head of the ledger", () => {
  it("names the move at the last close and points at its entry", () => {
    const h = headLine(events);
    expect(h.kind).toBe("tripped");
    expect(h.text).toBe("Japan moved unusually at the last close");
    expect(h.href).toBe(`#${events[0].id}`);
  });

  it("names several when several moved at once", () => {
    const two = [events[0], { ...events[2], sessionsAgo: 0 }, ...events.slice(3)];
    expect(headLine(two).text).toBe("Japan and Brazil moved unusually at the last close");
    const three = [events[0], { ...events[1], sessionsAgo: 0 }, { ...events[2], sessionsAgo: 0 }];
    expect(headLine(three).text).toBe("Japan, South Korea and Brazil moved unusually at the last close");
  });

  it("is quiet when the newest entry is older, says how long ago and points at it", () => {
    const h = headLine(events.slice(1));
    expect(h.kind).toBe("quiet");
    expect(h.text).toBe("Nothing unusual at the last close · last unusual move: South Korea, 9 sessions ago");
    expect(h.href).toBe(`#${events[1].id}`);
  });

  it("is empty with no events, and has nothing to point at", () => {
    expect(headLine([])).toEqual({ kind: "empty", text: "Nothing unusual yet", href: null });
  });

  it("uses none of the review's jargon", () => {
    for (const h of [headLine(events), headLine(events.slice(1)), headLine([])]) {
      expect(h.text).not.toMatch(/tripped|band|threshold|sensor/i);
    }
  });
});

describe("the ex-dividend caveat", () => {
  const korea = byId("korea-2026-10-02");
  const withDividend = (dividend: object, status = "ok", attempts = 2): LedgerEvent => ({
    ...korea,
    coverage: korea.coverage && {
      ...korea.coverage,
      sources: { ...korea.coverage.sources, dividend: { status, attempts, fetchedAt: "2026-10-03T21:00:00Z", ...dividend } as never },
    },
  });

  it("names the amount, the date and the share of the previous close, and says the figure is not corrected", () => {
    const line = dividendLine(korea);
    expect(line).toMatch(/^Ex-dividend session · \$0\.55 a share went ex on 2 Oct, about \d+\.\d% of the previous close\./);
    expect(line).toContain("the figure above is not corrected for it");
  });

  it("prints the amount in its own currency when it is not dollars, and keeps two decimals", () => {
    expect(dividendLine(withDividend({ dividend: { date: "2026-10-02", amount: 1.2, currency: "CAD" } }))).toContain("1.20 CAD a share");
    expect(dividendLine(withDividend({ dividend: { date: "2026-10-02", amount: 1.249, currency: "USD" } }))).toContain("$1.249 a share");
  });

  it("leaves out the share when there is no previous close", () => {
    const e = { ...withDividend({ dividend: { date: "2026-10-02", amount: 0.5 } }), price: null };
    expect(dividendLine(e)).toMatch(/\$0\.50 a share went ex on 2 Oct\. The close falls/);
  });

  it("says nothing for an empty answer, which is the ordinary session", () => {
    expect(dividendLine(byId("japan-2026-10-15"))).toBeNull();
    expect(dividendLine(byId("canada-2026-08-05"))).toBeNull(); // no coverage yet
    expect(dividendLine(byId("cat-2026-09-10"))).toBeNull(); // no dividend source recorded
  });

  it("says a failed lookup is unknown, and whether it will be tried again", () => {
    expect(dividendLine(byId("brazil-2026-09-18"))).toContain("has not been checked yet");
    expect(dividendLine(byId("colombia-2026-08-27"))).toContain("could not be checked");
  });

  it("is not a news source: the page lists the explanations and leaves the dividend out", () => {
    expect(sourcesOf(korea).map((x) => x.key)).toEqual(["sectorNews", "filings"]);
  });
});
