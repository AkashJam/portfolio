import { describe, expect, it } from "vitest";

import eventsFixture from "@/e2e/fixtures/events.json";
import {
  bandCaption,
  breakoutDirection,
  chipsFor,
  contextLine,
  entryHeading,
  entryVia,
  etClock,
  headLine,
  leftOut,
  noSplitText,
  outletCount,
  sentence,
  sessionShort,
  sessionsAgoLabel,
  sigmaLabel,
  signedChange,
  signedPercent,
  sourcesOf,
  splitView,
} from "@/lib/ledger";
import { eventsResponseSchema, type LedgerEvent } from "@/lib/market-schemas";

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
    expect(entryVia(byId("japan-2026-10-15"))).toBe("as seen through MUFG · Mitsubishi UFJ · 15 Oct, at the close");
    expect(entryVia(byId("cat-2026-09-10"))).toBe("through CAT · Caterpillar · 10 Sep, at the close");
  });

  it("says which side the line left on, and against what", () => {
    expect(breakoutDirection(byId("japan-2026-10-15"))).toBe("down");
    expect(breakoutDirection(byId("korea-2026-10-02"))).toBe("up");
    expect(contextLine(byId("japan-2026-10-15"))).toBe("−3.1σ against its sector (IXG).");
    expect(bandCaption(byId("japan-2026-10-15"))).toContain("left it below on Thursday");
    expect(bandCaption(byId("korea-2026-10-02"))).toContain("left it above");
    expect(bandCaption(byId("japan-2026-10-15"))).toContain("±2.5σ of the residual over 60 sessions (σ = 1.42%)");
  });

  it("has no benchmark sentence when it has no benchmark", () => {
    const e = { ...byId("japan-2026-10-15"), trigger: { ...byId("japan-2026-10-15").trigger, benchmark: null } };
    expect(contextLine(e)).toContain("no sector fund");
  });
});

describe("the split", () => {
  it("reads both parts and why the news was routed as it was", () => {
    const v = splitView(byId("japan-2026-10-15"));
    expect(v?.label).toBe("both");
    expect(v?.currencyLine).toBe("JPY against the dollar −1.9% (2.6σ)");
    expect(v?.stockLine).toBe("MUFG net of its sector and its currency −2.5% (2.2σ)");
    expect(v?.note).toContain("all asked");
    expect(v?.fix).toContain("ECB fix, about 16:00 CET");
    expect(splitView(byId("korea-2026-10-02"))?.note).toContain("not an economy query");
    expect(splitView(byId("brazil-2026-09-18"))?.note).toContain("central bank and an economy query");
  });

  it("is absent, with a reason, where no split could be made", () => {
    expect(splitView(byId("cat-2026-09-10"))).toBeNull();
    expect(noSplitText(byId("cat-2026-09-10").split?.reason)).toContain("global name has no home currency");
    expect(noSplitText(byId("colombia-2026-08-27").split?.reason)).toContain("publishes no daily rate");
    expect(noSplitText("something_new")).toBe("The move is not split by currency.");
    expect(splitView(byId("canada-2026-08-05"))).toBeNull(); // pending: no split yet
  });
});

describe("the coverage", () => {
  const japan = byId("japan-2026-10-15");
  const econ = japan.coverage!.sources.economyNews;

  it("lists the sources in the page's order", () => {
    expect(sourcesOf(japan).map((s) => s.key)).toEqual(["centralBank", "economyNews", "sectorNews", "filings"]);
    expect(sourcesOf(byId("canada-2026-08-05"))).toEqual([]);
  });

  it("orders outlet chips earliest first, with New York times", () => {
    const before = chipsFor(econ, "before");
    expect(before).toHaveLength(9);
    const times = before.map((c) => c.time);
    expect([...times].sort()).toEqual(times);
    expect(chipsFor(econ, "after")).toHaveLength(5);
    expect(outletCount(econ)).toBe(14);
  });

  it("says what it left out and nothing when it left nothing", () => {
    expect(leftOut(econ)).toBe("Left out of the 71 headlines the search returned: 14 from outlets that generate pages from price or filing data.");
    expect(leftOut({ ...econ, excluded: 0, nonEnglish: 0, undated: 0 })).toBeNull();
    expect(leftOut({ ...econ, nonEnglish: 2 })).toContain("2 not in English");
  });
});

describe("sentence", () => {
  it("capitalises a stored reason and leaves nothing alone", () => {
    expect(sentence("no 6-K was filed in the window")).toBe("No 6-K was filed in the window");
    expect(sentence("")).toBe("");
  });
});

describe("the head of the ledger", () => {
  it("is tripped when the last close tripped something, naming it", () => {
    const h = headLine(events);
    expect(h.kind).toBe("tripped");
    expect(h.word).toBe("Japan tripped at the last close.");
    expect(h.facts).toBe("17 of 18 inside their band");
  });

  it("names several when several tripped at once", () => {
    const two = [events[0], { ...events[2], sessionsAgo: 0 }, ...events.slice(3)];
    expect(headLine(two).word).toBe("Japan and Brazil tripped at the last close.");
    expect(headLine(two).facts).toBe("16 of 18 inside their band");
    const three = [events[0], { ...events[1], sessionsAgo: 0 }, { ...events[2], sessionsAgo: 0 }];
    expect(headLine(three).word).toBe("Japan, South Korea and Brazil tripped at the last close.");
  });

  it("is quiet when the newest entry is older, and says how long ago", () => {
    const h = headLine(events.slice(1));
    expect(h.kind).toBe("quiet");
    expect(h.word).toBe("Nothing past threshold.");
    expect(h.facts).toBe("18 of 18 inside their band · last trip was South Korea, 9 sessions ago");
  });

  it("is empty with no events", () => {
    expect(headLine([]).kind).toBe("empty");
  });
});
