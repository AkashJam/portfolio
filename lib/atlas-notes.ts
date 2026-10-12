import { type ColumnKey, columnValue, formatChange } from "@/lib/atlas";
import { against, moved } from "@/lib/atlas-readings";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";

// Tier 3 of the three disclosure tiers (bearing.md): a caveat that belongs to
// one cell, behind a ringed i on that cell. It is reserved for genuine
// exceptions: three cells today. Where a note quotes figures it computes them
// from the rows and the window; nothing that moves is typed.

export interface CellNote {
  title: string;
  body: string;
  foot?: string;
}

export function cellNote(
  row: AtlasRow,
  key: ColumnKey,
  rows: AtlasRow[],
  win: WindowStart,
): CellNote | null {
  if (row.slug === "ireland" && key === "gniPpp" && row.gniPpp.value !== null) {
    return {
      title: "Ireland’s income",
      body: "This figure is inflated by multinational profit-shifting: it reflects corporate domicile more than Irish incomes. The figure is the World Bank’s and is reproduced unchanged; the distortion is in the underlying economy, not the citation.",
    };
  }

  if (row.slug === "turkiye" && key === "shares") {
    const shares = columnValue(row, "shares", win);
    const prices = columnValue(row, "prices", win);
    if (shares === null || prices === null) return null;
    const real = against(shares, prices);
    const lira = columnValue(row, "currency", win);
    const verb = moved(prices);
    return {
      title: "Türkiye’s shares",
      body:
        "OECD publishes this series before inflation, in local currency, so the figure is not an inflation-adjusted gain. " +
        `Read it against the prices column beside it: prices ${verb} ${formatChange(prices)} over the same years, ` +
        `which leaves ${formatChange(real)} after inflation` +
        (lira === null
          ? "."
          : `, while the lira moved ${formatChange(lira)} against the euro.`),
      foot: "This is why shares are never deflated here: doing it for you would make the figure ours rather than OECD’s.",
    };
  }

  if (key === "currency" && row.currency.derived) {
    return {
      title: `${row.country}’s currency`,
      body:
        `The ECB publishes no rate for ${row.country}’s currency, so this figure goes via the dollar: ${row.currency.source}. ` +
        "If the OECD series falls more than three months behind, the cell drops to a stated gap rather than showing a stale figure.",
    };
  }

  return null;
}
