"use client";

import { useMemo, useState, type ReactNode } from "react";

import { useAtlasWindow } from "@/components/atlas/AtlasWindow";
import {
  CellButton,
  DisclosureGroup,
  InfoButton,
} from "@/components/atlas/Disclosure";
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
import { cellNote } from "@/lib/atlas-notes";
import { columnInfo, vintageOf } from "@/lib/atlas-provenance";
import type { AtlasRow, WindowStart } from "@/lib/market-schemas";
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

/** What every cell needs to know about its column, computed once per render. */
interface ColumnCtx {
  rows: AtlasRow[];
  window: WindowStart;
  olderSlugs: Set<string>;
  modal: string;
}

/**
 * One cell: the figure, its source and as-of for screen readers (the column's
 * Tier 2 popover carries them for everyone else), the amber dot when the figure
 * is older than its column's vintage, and, on the few cells that have one, a
 * Tier 3 note behind the whole cell.
 */
function DataCell({
  row,
  k,
  ctx,
  source,
  asOf,
  className,
  children,
}: {
  row: AtlasRow;
  k: ColumnKey;
  ctx: ColumnCtx;
  source: string;
  asOf: string;
  className?: string;
  children: ReactNode;
}) {
  const note = cellNote(row, k, ctx.rows, ctx.window);
  const old = ctx.olderSlugs.has(row.slug);
  const hidden = (
    <span className="sr-only">
      {`, ${provenance({ source, asOf })}`}
      {old ? `; older than the column, which is ${ctx.modal}` : ""}
      {note ? `. Note: ${note.title}` : ""}
    </span>
  );
  const dot = old && (
    <span
      aria-hidden="true"
      className="ml-1.5 inline-block size-[5px] rounded-full bg-simulated align-[2px]"
    />
  );
  return (
    <TableCell className={cn(num, className)}>
      {note ? (
        <CellButton
          title={note.title}
          panel={
            <>
              <p>{note.body}</p>
              {note.foot && <p className="mt-2 text-text-muted">{note.foot}</p>}
            </>
          }
        >
          <span className="flex flex-col items-end">{children}</span>
          {dot}
          {hidden}
        </CellButton>
      ) : (
        <>
          {children}
          {dot}
          {hidden}
        </>
      )}
    </TableCell>
  );
}

function ChangeCell({
  row,
  k,
  ctx,
}: {
  row: AtlasRow;
  k: "shares" | "housing" | "prices" | "currency";
  ctx: ColumnCtx;
}) {
  const m = row[k];
  const value = m.change?.[ctx.window] ?? null;
  if (value === null) {
    return (
      <DataCell
        row={row}
        k={k}
        ctx={ctx}
        source={m.source}
        asOf={m.asOf}
        className="text-text-muted"
      >
        {"—"}
        {m.reason && (
          <small className="ml-1 text-[11px]">
            {gapLabel(m.reason, ctx.window)}
          </small>
        )}
      </DataCell>
    );
  }
  const rounded = Math.round(value);
  return (
    <DataCell
      row={row}
      k={k}
      ctx={ctx}
      source={m.source}
      asOf={m.asOf}
      className={cn(
        rounded > 0 && "text-market-up",
        rounded < 0 && "text-market-down",
      )}
    >
      {formatChange(value)}
      {m.derived && (
        <small className="block text-[11px] text-text-muted">{m.derived}</small>
      )}
    </DataCell>
  );
}

function LevelCell({
  row,
  k,
  ctx,
  format,
}: {
  row: AtlasRow;
  k: "everydaySpendingEur" | "gniPpp" | "unemployment" | "lifeExpectancy";
  ctx: ColumnCtx;
  format: (v: number) => string;
}) {
  const m = row[k];
  return (
    <DataCell
      row={row}
      k={k}
      ctx={ctx}
      source={m.source}
      asOf={m.asOf}
      className={cn(m.value === null && "text-text-muted")}
    >
      {m.value === null ? "—" : format(m.value)}
    </DataCell>
  );
}

/** The Tier 2 popover body: provenance rows, then the exact term one tier down. */
function ColumnPanel({
  k,
  rows,
  window,
  end,
}: {
  k: ColumnKey;
  rows: AtlasRow[];
  window: WindowStart;
  end: string;
}) {
  const info = columnInfo(k, rows, window, end);
  return (
    <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {info.rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              {r.label}
            </dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 border-t border-hairline pt-2.5">{info.note}</p>
    </>
  );
}

export function CountriesTable({ rows }: { rows: AtlasRow[] }) {
  const { window, end } = useAtlasWindow();
  const [sort, setSort] = useState<{ key: ColumnKey; dir: SortDir }>({
    key: "everydaySpendingEur",
    dir: "asc",
  });
  const sorted = sortRows(rows, sort.key, sort.dir, window);
  const ctxs = useMemo(() => {
    const out = {} as Record<ColumnKey, ColumnCtx>;
    for (const c of COLUMNS) {
      const v = vintageOf(rows, c.key);
      out[c.key] = {
        rows,
        window,
        modal: v.modal,
        olderSlugs: new Set(v.older.flatMap((o) => o.rows.map((r) => r.slug))),
      };
    }
    return out;
  }, [rows, window]);

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
    <DisclosureGroup>
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
                    <div className="flex flex-col items-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <InfoButton
                          label={`About the ${c.label.toLowerCase()} column`}
                          title={`${c.label}: where this comes from`}
                        >
                          <ColumnPanel
                            k={c.key}
                            rows={rows}
                            window={window}
                            end={end}
                          />
                        </InfoButton>
                        <button
                          type="button"
                          onClick={() => onSort(c.key)}
                          className={cn(
                            "rounded-sm text-right hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand",
                            active && "text-brand-hover",
                          )}
                        >
                          {c.label}
                          {active && (
                            <span aria-hidden="true">
                              {sort.dir === "asc" ? " ▲" : " ▼"}
                            </span>
                          )}
                        </button>
                      </div>
                      {/* Pointer convenience only: the label button is the keyboard and
                          accessibility target, so the unit line is not a second tab stop. */}
                      <small
                        onClick={() => onSort(c.key)}
                        className="max-w-[7rem] cursor-pointer whitespace-normal text-right text-[11px] font-normal text-text-muted"
                      >
                        {c.sub(end)}
                      </small>
                    </div>
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
                <ChangeCell row={r} k="shares" ctx={ctxs.shares} />
                <ChangeCell row={r} k="housing" ctx={ctxs.housing} />
                <ChangeCell row={r} k="prices" ctx={ctxs.prices} />
                <ChangeCell row={r} k="currency" ctx={ctxs.currency} />
                <LevelCell
                  row={r}
                  k="everydaySpendingEur"
                  ctx={ctxs.everydaySpendingEur}
                  format={formatEur}
                />
                <LevelCell
                  row={r}
                  k="gniPpp"
                  ctx={ctxs.gniPpp}
                  format={formatUsd}
                />
                <LevelCell
                  row={r}
                  k="unemployment"
                  ctx={ctxs.unemployment}
                  format={formatPercent}
                />
                <LevelCell
                  row={r}
                  k="lifeExpectancy"
                  ctx={ctxs.lifeExpectancy}
                  format={formatYears}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DisclosureGroup>
  );
}
