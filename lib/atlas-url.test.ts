import { describe, expect, it } from "vitest";

import { compareSearch, homeAddress, parseCompare, parseHashParts, parseTable, tableSearch, readHome, resolveView, viewAddress, withParam } from "@/lib/atlas-url";

describe("parseHashParts", () => {
  it("reads sections, rows and the legacy home apart", () => {
    expect(parseHashParts("#map")).toEqual({ section: "map", target: null, legacyHome: null });
    expect(parseHashParts("#italy")).toEqual({ section: null, target: "italy", legacyHome: null });
    expect(parseHashParts("#italy&home=japan")).toEqual({ section: null, target: "italy", legacyHome: "japan" });
    expect(parseHashParts("#home=japan")).toEqual({ section: null, target: null, legacyHome: "japan" });
    expect(parseHashParts("")).toEqual({ section: null, target: null, legacyHome: null });
  });
});

describe("resolveView", () => {
  it("prefers ?view=, then the hash's section, then Countries for a row, then Compare", () => {
    expect(resolveView("?view=map", "#countries")).toBe("map");
    expect(resolveView("", "#countries")).toBe("countries");
    expect(resolveView("", "#italy")).toBe("countries");
    expect(resolveView("", "")).toBe("compare");
    expect(resolveView("?view=bogus", "")).toBe("compare");
    expect(resolveView("?home=japan", "")).toBe("compare");
  });
});

describe("withParam", () => {
  it("sets, replaces and removes one parameter and keeps the rest", () => {
    expect(withParam("", "view", "map")).toBe("?view=map");
    expect(withParam("?measure=currency&view=map", "view", "countries")).toBe("?measure=currency&view=countries");
    expect(withParam("?view=map", "view", null)).toBe("");
    expect(withParam("?year=2022&view=map", "view", null)).toBe("?year=2022");
  });
});

describe("viewAddress", () => {
  it("omits the default view, unless a row would reopen Countries", () => {
    expect(viewAddress("", "", "compare")).toEqual({ search: "", hash: "" });
    expect(viewAddress("?view=map", "", "compare")).toEqual({ search: "", hash: "" });
    expect(viewAddress("", "", "map")).toEqual({ search: "?view=map", hash: "" });
    expect(viewAddress("", "#italy", "compare")).toEqual({ search: "?view=compare", hash: "#italy" });
    expect(viewAddress("?home=japan", "#map", "countries")).toEqual({ search: "?home=japan&view=countries", hash: "" });
  });
});

describe("home in the address", () => {
  it("reads ?home= first, then the legacy hash, and writes ?home= dropping the hash form", () => {
    expect(readHome("?home=italy", "#home=japan")).toBe("italy");
    expect(readHome("", "#italy&home=japan")).toBe("japan");
    expect(readHome("", "")).toBeNull();
    expect(homeAddress("?view=map", "#italy&home=japan", "japan")).toEqual({ search: "?view=map&home=japan", hash: "#italy" });
    expect(homeAddress("?home=japan", "", null)).toEqual({ search: "", hash: "" });
  });
});

describe("compare in the address", () => {
  const WINDOWS = ["2010", "2016", "2021"] as never[];
  it("reads a question, a built pair and a window, and falls back to the first question", () => {
    expect(parseCompare("", WINDOWS)).toMatchObject({ chip: "spend-housing", window: null });
    expect(parseCompare("?q=spend-life&window=2016", WINDOWS)).toMatchObject({ chip: "spend-life", x: "everydaySpendingEur", y: "lifeExpectancy", window: "2016" });
    expect(parseCompare("?x=shares&y=prices", WINDOWS)).toMatchObject({ chip: null, x: "shares", y: "prices" });
    expect(parseCompare("?x=shares&y=shares", WINDOWS).chip).toBe("spend-housing");
    expect(parseCompare("?x=bogus&y=prices&window=1999", WINDOWS)).toMatchObject({ chip: "spend-housing", window: null });
  });
  it("writes only what differs from the defaults and keeps the other parameters", () => {
    const first = parseCompare("", WINDOWS);
    expect(compareSearch("?view=compare", first, "2010" as never)).toBe("?view=compare");
    expect(compareSearch("", { ...first, chip: "spend-life", x: "everydaySpendingEur", y: "lifeExpectancy" }, "2010" as never)).toBe("?q=spend-life");
    expect(compareSearch("?q=spend-life", { chip: null, x: "shares", y: "prices", window: "2016" as never }, "2010" as never)).toBe("?x=shares&y=prices&window=2016");
    expect(compareSearch("?x=shares&y=prices&home=japan", first, "2010" as never)).toBe("?home=japan");
  });
});

describe("the countries table address", () => {
  it("reads the defaults from a plain address", () => {
    expect(parseTable("")).toEqual({ more: false, key: "everydaySpendingEur", dir: "asc" });
  });

  it("reads columns and sort, and ignores what it cannot read", () => {
    expect(parseTable("?cols=more&sort=housing.desc")).toEqual({ more: true, key: "housing", dir: "desc" });
    expect(parseTable("?sort=housing")).toEqual({ more: false, key: "housing", dir: "asc" });
    expect(parseTable("?cols=all&sort=bogus.desc")).toEqual({ more: false, key: "everydaySpendingEur", dir: "asc" });
  });

  it("writes only what differs from the defaults and leaves the other parameters", () => {
    const d = { more: false, key: "everydaySpendingEur", dir: "asc" } as const;
    expect(tableSearch("?view=countries", d)).toBe("?view=countries");
    expect(tableSearch("?view=countries", { more: true, key: "housing", dir: "desc" })).toBe("?view=countries&cols=more&sort=housing.desc");
    expect(tableSearch("?cols=more&sort=housing.desc&home=japan", d)).toBe("?home=japan");
  });
});
