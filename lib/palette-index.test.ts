import { describe, expect, it } from "vitest";

import { buildPaletteIndex, hintLine, paletteFilter, splitMatch, type PostDoc, type ProjectDoc } from "@/lib/palette-index";
import type { AtlasRow, Sensor } from "@/lib/market-schemas";

const projects: ProjectDoc[] = [
  { slug: "market-ticker", title: "Market (Ticker)", tags: ["Go", "Redis", "TimescaleDB"], draft: false },
  { slug: "microlearning", title: "Microlearning", tags: ["React", "Go"], draft: false },
  { slug: "unfinished", title: "Unfinished", tags: [], draft: true },
];

const posts: PostDoc[] = [
  { path: "redis-leader-lease", date: "2026-09-01", title: "One reader, many replicas: coordinating a single upstream feed with a Redis lease", tags: ["Redis", "Go", "Coordination"], draft: false },
  { path: "ticker-pipeline-design", date: "2026-09-20", title: "One tick, five candles: aggregating a feed you can't trust to arrive once", tags: ["Go", "Redis", "TimescaleDB"], draft: false },
  { path: "canvas-chart-in-react", date: "2026-08-10", title: "A chart that redraws itself", tags: ["React", "Canvas"], draft: false },
  { path: "half-written", date: "2026-10-01", title: "Half written", tags: ["Redis"], draft: true },
];

const sensors = [
  { symbol: "MUFG", name: "Mitsubishi UFJ", group: "country", country: "Japan", theme: null, slug: "japan" },
  { symbol: "NVDA", name: "NVIDIA", group: "global", country: null, theme: "Semiconductors", slug: null },
] as unknown as Sensor[];

const rows = [
  { slug: "japan", city: "Tokyo", country: "Japan", hasCityPage: true },
  { slug: "peru", city: "Lima", country: "Peru", hasCityPage: false },
] as unknown as AtlasRow[];

const index = buildPaletteIndex({ projects, posts, sensors, atlasRows: rows, includeDrafts: false });

describe("buildPaletteIndex", () => {
  it("leaves drafts out of a production build and keeps them in development", () => {
    expect(index.projects.map((p) => p.label)).toEqual(["Market (Ticker)", "Microlearning"]);
    expect(index.posts).toHaveLength(3);
    const dev = buildPaletteIndex({ projects, posts, sensors, atlasRows: rows, includeDrafts: true });
    expect(dev.projects).toHaveLength(3);
    expect(dev.posts).toHaveLength(4);
  });

  it("addresses a case study and a post as their pages", () => {
    expect(index.projects[0].href).toBe("/projects/market-ticker");
    expect(index.posts[0].href).toBe("/blog/ticker-pipeline-design");
  });

  it("lists posts newest first, as /blog does", () => {
    expect(index.posts.map((p) => p.href)).toEqual([
      "/blog/ticker-pipeline-design",
      "/blog/redis-leader-lease",
      "/blog/canvas-chart-in-react",
    ]);
  });

  it("shows a post's tags as its second line and searches them", () => {
    expect(index.posts[1].sub).toBe("Redis · Go · Coordination");
    expect(index.posts[1].keywords).toEqual(["Redis", "Go", "Coordination"]);
  });

  it("names a country company by country and company, and a global one by its theme", () => {
    expect(index.companies).toEqual([
      { href: "/market/japan", label: "MUFG", sub: "Japan · Mitsubishi UFJ", keywords: [] },
      { href: "/market/NVDA", label: "NVDA", sub: "Semiconductors", keywords: [] },
    ]);
  });

  it("lists only the cities that have a page", () => {
    expect(index.cities).toEqual([{ href: "/atlas/japan", label: "Tokyo", sub: "Japan", keywords: [] }]);
  });

  it("builds from nothing when the ticker cannot be asked", () => {
    const bare = buildPaletteIndex({ projects, posts, sensors: null, atlasRows: null, includeDrafts: false });
    expect(bare.companies).toEqual([]);
    expect(bare.cities).toEqual([]);
    expect(bare.posts).toHaveLength(3);
  });
});

describe("paletteFilter", () => {
  const matches = (entries: { label: string; sub: string; keywords: string[] }[], q: string) =>
    entries.filter((e) => paletteFilter(`${e.label} ${e.sub}`, q, e.keywords) > 0).map((e) => e.label);

  it('finds "redis" in one project and three posts by title or tag, as the mock shows', () => {
    expect(matches(index.projects, "redis")).toEqual(["Market (Ticker)"]);
    expect(matches(index.posts, "redis")).toHaveLength(2); // the fixture has two non-draft Redis posts
  });

  it("is not fuzzy: letters in order are not a match", () => {
    expect(matches(index.posts, "rds")).toEqual([]);
  });

  it("needs every word, in any order, and ignores case", () => {
    expect(matches(index.posts, "LEASE redis")).toHaveLength(1);
    expect(matches(index.posts, "redis canvas")).toEqual([]);
  });

  it("finds a company by its country and a city by its country", () => {
    expect(matches(index.companies, "japan")).toEqual(["MUFG"]);
    expect(matches(index.cities, "japan")).toEqual(["Tokyo"]);
  });

  it("matches everything for an empty query", () => {
    expect(paletteFilter("anything", "   ")).toBe(1);
  });
});

describe("splitMatch", () => {
  it("marks every occurrence of each query word, keeping the original case", () => {
    expect(splitMatch("Go · Redis · TimescaleDB", "redis")).toEqual([
      { text: "Go · ", mark: false },
      { text: "Redis", mark: true },
      { text: " · TimescaleDB", mark: false },
    ]);
  });

  it("marks several words and leaves unmatched text whole", () => {
    expect(splitMatch("a Redis lease", "lease redis").filter((s) => s.mark).map((s) => s.text)).toEqual(["Redis", "lease"]);
    expect(splitMatch("nothing here", "zzz")).toEqual([{ text: "nothing here", mark: false }]);
  });

  it("takes a query with regex characters literally", () => {
    expect(splitMatch("C++ (draft)", "c++").filter((s) => s.mark).map((s) => s.text)).toEqual(["C++"]);
    expect(splitMatch("plain", "")).toEqual([{ text: "plain", mark: false }]);
  });
});

describe("hintLine", () => {
  it("counts the groups it names from the index", () => {
    expect(hintLine({ posts: new Array(18).fill(0), companies: new Array(18).fill(0), cities: new Array(17).fill(0) } as never)).toBe(
      "Type to search 18 posts, 18 companies and 17 cities",
    );
  });
});
