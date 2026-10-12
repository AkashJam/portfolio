"use client";

import { useState } from "react";

import { useAtlasWindow } from "@/components/atlas/AtlasWindow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ColumnKey,
  type SortDir,
  formatChange,
  formatEur,
  formatPercent,
  formatUsd,
  formatYears,
  gapLabel,
  provenance,
  sortRows,
} from "@/lib/atlas";
import type { AtlasRow, WindowChange, WindowStart } from "@/lib/market-schemas";
import { cn } from "@/lib/utils";

/**
 * The /atlas countries table (Phase 11 step 1; mockups/atlas-v1/atlas.html
 * #countries). Twenty-three rows, eight measures, sortable on every column.
 * The window comes from the shared context (step 3), so the scatter and the
 * table always read the same years.
 */

interface Column {
  key: ColumnKey;
  label: string;
  sub: (end: string) => string;
}

const COLUMNS: Column[] = [
  { key: "shares", label: "Shares", sub: () => "change · before inflation" },
  { key: "housing", label: "Housing", sub: () => "change · after inflation" },
  { key: "prices", label: "Prices", sub: (end) => `change · to ${end}` },
  { key: "currency", label: "Currency", sub: () => "vs EUR · change" },
  {
    key: "everydaySpendingEur",
    label: "Spending",
    sub: () => "€ / person / month",
  },
  { key: "gniPpp", label: "Income", sub: () => "$ / person · price-adj." },
  { key: "unemployment", label: "Unemp.", sub: () => "%" },
  { key: "lifeExpectancy", label: "Life exp.", sub: () => "years" },
];

const num = "px-2 text-right font-mono tabular-nums last:pr-4";

// The provenance rides on every value: a native tooltip for pointer users and
// the same words, visually hidden, for everyone else. Step 7 swaps this for the
// ringed-i disclosure tier.
function Provenance({ text }: { text: string }) {
  return <span className="sr-only">{`, ${text}`}</span>;
}

function ChangeCell({ m, window }: { m: WindowChange; window: WindowStart }) {
  const value = m.change?.[window] ?? null;
  const title = provenance(m);
  if (value === null) {
    return (
      <TableCell className={cn(num, "text-text-muted")} title={title}>
        {"—"}
        {m.reason && (
          <small className="ml-1 text-[11px]">
            {gapLabel(m.reason, window)}
          </small>
        )}
        <Provenance text={title} />
      </TableCell>
    );
  }
  const rounded = Math.round(value);
  return (
    <TableCell
      className={cn(
        num,
        rounded > 0 && "text-market-up",
        rounded < 0 && "text-market-down",
      )}
      title={title}
    >
      {formatChange(value)}
      {m.derived && (
        <small className="ml-1 block text-[11px] text-text-muted">
          {m.derived}
        </small>
      )}
      <Provenance text={title} />
    </TableCell>
  );
}

function LevelCell({
  m,
  format,
}: {
  m: { value: number | null; reason?: string; source: string; asOf: string };
  format: (v: number) => string;
}) {
  const title = provenance(m);
  return (
    <TableCell
      className={cn(num, m.value === null && "text-text-muted")}
      title={title}
    >
      {m.value === null ? "—" : format(m.value)}
      <Provenance text={title} />
    </TableCell>
  );
}

export function CountriesTable({ rows }: { rows: AtlasRow[] }) {
  const { window, end } = useAtlasWindow();
  const [sort, setSort] = useState<{ key: ColumnKey; dir: SortDir }>({
    key: "everydaySpendingEur",
    dir: "asc",
  });
  const sorted = sortRows(rows, sort.key, sort.dir, window);

  // First press on a column sorts it high-to-low for change measures, since
  // the question is "who rose most"; a repeat press flips it.
  function onSort(key: ColumnKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  }

  return (
    <div className="panel-elevated overflow-hidden rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 pr-2">City</TableHead>
            {COLUMNS.map((c) => {
              const active = sort.key === c.key;
              return (
                <TableHead
                  key={c.key}
                  className="px-2 text-right"
                  aria-sort={
                    active
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={cn(
                      "inline-flex flex-col items-end rounded-sm text-right hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand",
                      active && "text-brand-hover",
                    )}
                  >
                    <span>
                      {c.label}
                      {active && (
                        <span aria-hidden="true">
                          {sort.dir === "asc" ? " ▲" : " ▼"}
                        </span>
                      )}
                    </span>
                    <small className="max-w-[7rem] whitespace-normal text-[11px] font-normal text-text-muted">
                      {c.sub(end)}
                    </small>
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.slug} id={r.slug} className="scroll-mt-24">
              <TableCell className="whitespace-normal py-3 pl-4 pr-2">
                <span className="flex min-w-[10rem] flex-col">
                  <span className="font-medium">{r.city}</span>
                  <small className="text-xs text-text-muted">
                    {r.country} {"·"}{" "}
                    {r.sensor
                      ? `market sensor ${r.sensor}`
                      : "no market sensor"}
                  </small>
                </span>
              </TableCell>
              <ChangeCell m={r.shares} window={window} />
              <ChangeCell m={r.housing} window={window} />
              <ChangeCell m={r.prices} window={window} />
              <ChangeCell m={r.currency} window={window} />
              <LevelCell m={r.everydaySpendingEur} format={formatEur} />
              <LevelCell m={r.gniPpp} format={formatUsd} />
              <LevelCell m={r.unemployment} format={formatPercent} />
              <LevelCell m={r.lifeExpectancy} format={formatYears} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
