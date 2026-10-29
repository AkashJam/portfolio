import { describe, expect, it } from "vitest";

import { homeAddress, parseHashParts, readHome, resolveView, viewAddress, withParam } from "@/lib/atlas-url";

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
