import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AtlasWindowProvider } from "@/components/atlas/AtlasWindow";
import { WorldMap } from "@/components/atlas/WorldMap";
import type { AtlasRow, WindowChange } from "@/lib/market-schemas";

// The exceptions line (bearing.md #106) cannot be seen in the UI until step 6's
// measure control exists, so the currency view is rendered here.

const ch = (
  v: number | null,
  extra: Partial<WindowChange> = {},
): WindowChange => ({
  change: extra.reason === "euro" ? null : { "2021": v, "2016": v, "2010": v },
  years: null,
  source: "test",
  asOf: "2024",
  ...extra,
});
const lv = { value: 1, source: "test", asOf: "2024" };
const row = (
  slug: string,
  code: string,
  country: string,
  currency: WindowChange,
): AtlasRow => ({
  slug,
  code,
  country,
  city: country,
  sensor: null,
  hasCityPage: false,
  region: "europe",
  shares: ch(10),
  housing: ch(10),
  prices: ch(10),
  currency,
  everydaySpendingEur: lv,
  gniPpp: lv,
  unemployment: lv,
  lifeExpectancy: lv,
});

const ROWS = [
  row("italy", "IT", "Italy", ch(null, { reason: "euro" })),
  row("israel", "IL", "Israel", {
    ...ch(null, { reason: "unpublished" }),
    change: { "2021": 4, "2016": 13, "2010": null },
  }),
  row("chile", "CL", "Chile", ch(-30, { derived: "via USD" })),
  row("japan", "JP", "Japan", ch(-19)),
];

// createElement keeps this a .test.ts (the unit tier only picks those up). The provider's
// typed props require `children`, which the lint rule would have us pass as an argument.
const render = (measure: "housing" | "currency") =>
  renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop
    createElement(AtlasWindowProvider, {
      windows: ["2021", "2016", "2010"],
      end: "2024",
      children: createElement(WorldMap, { rows: ROWS, measure }),
    }),
  );

describe("WorldMap", () => {
  it("shows no exceptions line on housing, where nothing is an exception", () => {
    const html = render("housing");
    expect(html).not.toContain("No figure:");
    expect(html).not.toContain("derived via the dollar");
  });

  it("states the three kinds under the legend on currency, Chile asterisked", () => {
    const html = render("currency");
    expect(html).toContain(
      "No figure: the euro area has no rate against itself; Israel has no 2010 rate.",
    );
    expect(html).toContain("Chile");
    expect(html).toContain("figure is derived via the dollar.");
    expect(html).toContain("CL*");
  });

  it("puts the figure and the caveat in each link's name", () => {
    const html = render("currency");
    expect(html).toContain(
      "Italy: no figure, currency against the euro, change 2010–24, euro area, no rate against itself",
    );
    expect(html).toContain(
      "Israel: no figure, currency against the euro, change 2010–24, no 2010 rate",
    );
    expect(html).toContain(
      "Chile: −30%, currency against the euro, change 2010–24, derived via the dollar",
    );
    expect(html).toContain(
      "Japan: −19%, currency against the euro, change 2010–24</",
    );
  });

  it("offers the no-figure legend item only when a country has no figure", () => {
    expect(render("currency")).toContain("no figure");
    expect(render("housing")).not.toMatch(/>no figure</);
  });

  it("links every drawn country to its row, in both drawings", () => {
    const html = render("housing");
    for (const slug of ["italy", "israel", "chile", "japan"]) {
      expect(html.split(`href="#${slug}"`).length - 1).toBe(2);
    }
  });
});
