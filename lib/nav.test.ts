import { describe, expect, it } from "vitest";

import {
  atlasMapItem,
  isActive,
  navItems,
  siteLinks,
  surfaceLinks,
} from "@/lib/nav";

describe("the nav list", () => {
  it("reads Home, Projects, Blog, About, then Market and Atlas, in that order", () => {
    expect(navItems.map((i) => i.label)).toEqual([
      "Home",
      "Projects",
      "Blog",
      "About",
      "Market",
      "Atlas",
    ]);
  });

  it("splits into the four site pages and the two live surfaces", () => {
    expect(siteLinks.map((i) => i.label)).toEqual([
      "Home",
      "Projects",
      "Blog",
      "About",
    ]);
    expect(surfaceLinks.map((i) => i.label)).toEqual(["Market", "Atlas"]);
  });

  it("has a unique address and icon per item", () => {
    expect(new Set(navItems.map((i) => i.href)).size).toBe(navItems.length);
    expect(new Set(navItems.map((i) => i.icon)).size).toBe(navItems.length);
  });

  it("keeps the map section as a palette-only entry on /atlas", () => {
    expect(atlasMapItem.href).toBe("/atlas#map");
    expect(navItems.some((i) => i.href === atlasMapItem.href)).toBe(false);
  });
});

describe("isActive", () => {
  it("marks Home only on the home page", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/atlas")).toBe(false);
  });

  it("marks a section for itself and everything below it, and not for a lookalike", () => {
    expect(isActive("/atlas", "/atlas")).toBe(true);
    expect(isActive("/market", "/market/SIM:NOVA")).toBe(true);
    expect(isActive("/blog", "/blog/some-post")).toBe(true);
    expect(isActive("/market", "/marketing")).toBe(false);
    expect(isActive("/about", "/atlas")).toBe(false);
  });
});
