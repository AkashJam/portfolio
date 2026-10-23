import { describe, expect, it } from "vitest";

import type { AtlasResponse, Sensor } from "@/lib/market-schemas";
import { cityParams, recordParams, recordPaths } from "@/lib/static-params";

const sensor = (symbol: string, slug: string | null): Sensor =>
  ({ symbol, name: symbol, group: slug ? "country" : "global", slug, country: null, theme: null, region: null, liquidity: null, note: null, liquidityUsdM: null, liquidityAsOf: null, order: 0 }) as Sensor;

const sensors = [sensor("MUFG", "japan"), sensor("NVDA", null)];

describe("cityParams", () => {
  it("lists only cities that have a page", () => {
    const atlas = { rows: [{ slug: "japan", hasCityPage: true }, { slug: "chile", hasCityPage: false }] } as unknown as AtlasResponse;
    expect(cityParams(atlas)).toEqual([{ city: "japan" }]);
  });

  it("is empty when the ticker could not answer", () => {
    expect(cityParams(null)).toEqual([]);
  });
});

describe("recordParams and recordPaths", () => {
  it("address a country by its slug and a global name by its symbol", () => {
    expect(recordParams(sensors)).toEqual([{ sensor: "japan" }, { sensor: "NVDA" }]);
    expect(recordPaths(sensors)).toEqual(["/market/japan", "/market/NVDA"]);
  });

  it("are empty when the ticker could not answer", () => {
    expect(recordParams(null)).toEqual([]);
    expect(recordPaths(null)).toEqual([]);
  });
});
