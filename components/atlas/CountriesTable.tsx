"use client";

import { LABEL } from "@/lib/atlas-labels";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";

import { useAtlasHome } from "@/components/atlas/AtlasHome";
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
  formatChange,
  formatEur,
  formatPercent,
  formatUsd,
  formatYears,
  gapLabel,
  provenance,
  sortRows,
} from "@/lib/atlas";
import { SwipeHint } from "@/components/atlas/SwipeHint";
import { useScrollEdges } from "@/components/atlas/useScrollEdges";
import { useTargetSlug } from "@/components/atlas/useTargetSlug";
import { cityCountLine, cityHref } from "@/lib/atlas-absences";
import { computedLine, deltaUnit, homeDelta, homeMoney } from "@/lib/atlas-home";
import { cellNote } from "@/lib/atlas-notes";
import { DEFAULT_SORT, parseTable, tableSearch, type TableState } from "@/lib/atlas-url";
import { columnInfo, vintageOf } from "@/lib/atlas-provenance";
import type { AtlasRow, DisplayRate, WindowStart } from "@/lib/market-schemas";
import { cn } from "@/lib/utils";

/**
 * The /atlas countries table (Phase 11 step 1; mockups/atlas-v1/atlas.html
 * #countries; Phase 22 I56). Twenty-three rows, four columns to start and four
 * more behind "More columns", sortable on every column; both choices live in the
 * address (`?cols=`, `?sort=`).
 * The window comes from the shared context (step 3), so the scatter and the
 * table always read the same years.
 */

interface Column {
  key: ColumnKey;
  label: string;
  sub: (end: string) => string;
  /** Behind "More columns". */
  more?: boolean;
  /** A rise is a gain and a fall a loss, so the figure is coloured; inflation is not. */
  tone?: boolean;
}

const COLUMNS: Column[] = [
  { key: "housing", label: LABEL.housing.short, sub: () => "change · after inflation", tone: true },
  { key: "prices", label: LABEL.prices.short, sub: (end) => `change · to ${end}` },
  {
    key: "everydaySpendingEur",
    label: LABEL.everydaySpendingEur.short,
    sub: () => "€ per person",
  },
  { key: "shares", label: LABEL.shares.short, sub: () => "change · before inflation", more: true, tone: true },
  { key: "currency", label: LABEL.currency.short, sub: () => "against the euro · change", more: true, tone: true },
  { key: "gniPpp", label: LABEL.gniPpp.short, sub: () => "$ per person · local prices", more: true },
  { key: "unemployment", label: LABEL.unemployment.short, sub: () => "%", more: true },
  { key: "lifeExpectancy", label: LABEL.lifeExpectancy.short, sub: () => "years", more: true },
];

/** Tells the scroll cue the first column is pinned, so its left cue is a shadow, not a mask. */
const PINNED_ATTR = { "data-pinned": "" };

/**
 * Below 768px the city column stays pinned while the figures scroll under it
 * (bearing.md #107): opaque, with a hairline on its right edge.
 */
const PINNED =
  "max-md:sticky max-md:left-0 max-md:z-[1] max-md:bg-panel max-md:shadow-[1px_0_0_var(--hairline)]";

const num = "px-2 text-right font-mono tabular-nums last:pr-4";

/** What every cell needs to know about its column, computed once per render. */
interface ColumnCtx {
  rows: AtlasRow[];
  window: WindowStart;
  /** The home city, when one is set: every other cited figure gains a comparison line. */
  home: AtlasRow | null;
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
  const delta = ctx.home ? homeDelta(row, ctx.home, k, ctx.window) : null;
  const deltaLine = delta && (
    <small data-testid="home-delta" className="block text-meta text-brand-hover">
      {delta}
      <span className="sr-only">{` against ${ctx.home?.city}, computed`}</span>
    </small>
  );
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
      className="ml-1.5 inline-block size-[5px] rounded-full bg-stale align-[2px]"
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
          {deltaLine}
        </CellButton>
      ) : (
        <>
          {children}
          {dot}
          {hidden}
          {deltaLine}
        </>
      )}
    </TableCell>
  );
}

function ChangeCell({
  row,
  k,
  ctx,
  tone,
  className: extra,
}: {
  row: AtlasRow;
  k: "shares" | "housing" | "prices" | "currency";
  ctx: ColumnCtx;
  tone: boolean;
  className?: string;
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
        className={cn("text-text-muted", extra)}
      >
        {"—"}
        {m.reason && (
          <small className="ml-1 text-meta">
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
        tone && rounded > 0 && "text-market-up",
        tone && rounded < 0 && "text-market-down",
        extra,
      )}
    >
      {formatChange(value)}
      {m.derived && (
        <small className="block text-meta text-text-muted">{m.derived}</small>
      )}
    </DataCell>
  );
}

function LevelCell({
  row,
  k,
  ctx,
  format,
  className,
}: {
  row: AtlasRow;
  k: "everydaySpendingEur" | "gniPpp" | "unemployment" | "lifeExpectancy";
  ctx: ColumnCtx;
  format: (v: number) => string;
  className?: string;
}) {
  const m = row[k];
  return (
    <DataCell
      row={row}
      k={k}
      ctx={ctx}
      source={m.source}
      asOf={m.asOf}
      className={cn(m.value === null && "text-text-muted", className)}
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
  home,
  rate,
}: {
  k: ColumnKey;
  rows: AtlasRow[];
  window: WindowStart;
  end: string;
  home: AtlasRow | null;
  rate: DisplayRate | null;
}) {
  const info = columnInfo(k, rows, window, end);
  return (
    <>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        {info.rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-meta uppercase tracking-wider text-text-muted">
              {r.label}
            </dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 border-t border-hairline pt-2.5">{info.note}</p>
      {home && (
        <p data-testid="computed-line" className="mt-2.5 border-t border-hairline pt-2.5 text-brand-hover">
          <b className="text-meta font-medium uppercase tracking-wider">Computed</b> {computedLine(k, home, window, end, rate)}
        </p>
      )}
    </>
  );
}

export function CountriesTable({ rows }: { rows: AtlasRow[] }) {
  const { window, end } = useAtlasWindow();
  const { home, rate } = useAtlasHome();
  const [table, setTable] = useState<TableState>({ more: false, ...DEFAULT_SORT });
  const panelId = useId();
  // The address names the columns and the order; it is read after hydration, because
  // the page is static and cannot see the query string on the server. (`window` here is
  // the shared year window, so the browser's is reached as `globalThis`.)
  useEffect(() => {
    const read = () => setTable(parseTable(globalThis.location.search));
    read();
    globalThis.addEventListener("popstate", read);
    return () => globalThis.removeEventListener("popstate", read);
  }, []);
  function update(next: TableState) {
    setTable(next);
    const { pathname, search, hash } = globalThis.location;
    globalThis.history.replaceState(null, "", `${pathname}${tableSearch(search, next)}${hash}`);
  }
  const sort = table;
  const target = useTargetSlug();
  const edges = useScrollEdges();
  // The home row is pinned above the sort; the rest keep their order.
  const sortedAll = sortRows(rows, sort.key, sort.dir, window);
  const sorted = home ? [home, ...sortedAll.filter((r) => r.slug !== home.slug)] : sortedAll;
  const spendFormat = rate ? (v: number) => homeMoney(v, rate) : formatEur;
  const ctxs = useMemo(() => {
    const out = {} as Record<ColumnKey, ColumnCtx>;
    for (const c of COLUMNS) {
      const v = vintageOf(rows, c.key);
      out[c.key] = {
        rows,
        window,
        home,
        modal: v.modal,
        olderSlugs: new Set(v.older.flatMap((o) => o.rows.map((r) => r.slug))),
      };
    }
    return out;
  }, [rows, window, home]);

  // First press on a column sorts it high-to-low for change measures, since
  // the question is "who rose most"; a repeat press flips it.
  function onSort(key: ColumnKey) {
    update({
      ...table,
      key,
      dir: table.key === key ? (table.dir === "asc" ? "desc" : "asc") : "desc",
    });
  }
  const hiddenWhenClosed = (c: Column) => (c.more && !table.more ? "hidden" : undefined);

  return (
    <DisclosureGroup>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="text-small text-read">{cityCountLine(rows)}</p>
        <button
          type="button"
          aria-expanded={table.more}
          aria-controls={panelId}
          onClick={() => update({ ...table, more: !table.more })}
          className="rounded-sm text-small text-brand-hover hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {table.more ? "Fewer columns ▴" : "More columns ▾"}
        </button>
      </div>
      <SwipeHint />
      <div id={panelId} className="panel-elevated overflow-hidden rounded-2xl">
        <Table
          containerClassName="atlas-edge-cue"
          containerProps={{ ref: edges.attach, ...PINNED_ATTR, ...edges.attrs }}
        >
          <TableHeader>
            <TableRow>
              <TableHead className={cn("pl-4 pr-2", PINNED)}>City</TableHead>
              {COLUMNS.map((c) => {
                const active = sort.key === c.key;
                return (
                  <TableHead
                    key={c.key}
                    className={cn("px-2 text-right", hiddenWhenClosed(c))}
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
                            home={home}
                            rate={rate}
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
                        className="max-w-[7rem] cursor-pointer whitespace-normal text-right text-meta font-normal text-text-muted"
                      >
                        {c.key === "everydaySpendingEur" && rate ? `${rate.currency} / person / month` : c.sub(end)}
                      </small>
                      {home && (
                        <small data-testid="delta-unit" className="max-w-[7rem] whitespace-normal text-right text-meta font-normal text-brand-hover">
                          {deltaUnit(c.key)}
                        </small>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow
                key={r.slug}
                id={r.slug}
                data-target={r.slug === target ? "true" : undefined}
                data-home={r.slug === home?.slug ? "true" : undefined}
                className="data-[home=true]:bg-brand/[0.07] data-[target=true]:bg-brand/15 data-[target=true]:shadow-[inset_3px_0_0_var(--brand)]"
              >
                <TableCell
                  className={cn(
                    "whitespace-normal py-3 pl-4 pr-2",
                    PINNED,
                    // A highlighted row's tint has to show on the pinned cell too, which is opaque.
                    "max-md:in-data-[target=true]:bg-[color-mix(in_oklab,var(--brand)_15%,var(--panel))]",
                  )}
                >
                  <span className="flex min-w-[10rem] flex-col">
                    <span className="flex items-center gap-1.5">
                      {cityHref(r) ? (
                        <Link
                          href={cityHref(r)!}
                          className="font-medium underline-offset-4 hover:text-brand-hover hover:underline"
                        >
                          {r.city}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.city}</span>
                      )}
                      <InfoButton
                        label={`About ${r.city}`}
                        title={`${r.city}, ${r.country}`}
                      >
                        <p data-testid="sensor-note">
                          {r.sensor ? (
                            <>
                              Market sensor{" "}
                              <Link
                                href={`/market/${r.slug}`}
                                className="font-mono underline underline-offset-4 hover:text-brand-hover"
                              >
                                {r.sensor}
                              </Link>
                              , a US-listed company. The link opens its price page; this page shows no market figure.
                            </>
                          ) : (
                            "No market sensor: no US-listed bank or telecom stands in for this country."
                          )}
                        </p>
                      </InfoButton>
                    </span>
                    {r.slug === home?.slug && (
                      <span data-testid="home-tag" className="text-meta uppercase tracking-wider text-brand-hover">
                        home
                      </span>
                    )}
                    <small className="text-meta text-text-muted">{r.country}</small>
                  </span>
                </TableCell>
                {COLUMNS.map((c) => {
                  const className = hiddenWhenClosed(c);
                  const ctx = ctxs[c.key];
                  switch (c.key) {
                    case "shares":
                    case "housing":
                    case "prices":
                    case "currency":
                      return (
                        <ChangeCell key={c.key} row={r} k={c.key} ctx={ctx} tone={!!c.tone} className={className} />
                      );
                    case "everydaySpendingEur":
                      return <LevelCell key={c.key} row={r} k={c.key} ctx={ctx} format={spendFormat} className={className} />;
                    case "gniPpp":
                      return <LevelCell key={c.key} row={r} k={c.key} ctx={ctx} format={formatUsd} className={className} />;
                    case "unemployment":
                      return <LevelCell key={c.key} row={r} k={c.key} ctx={ctx} format={formatPercent} className={className} />;
                    case "lifeExpectancy":
                      return <LevelCell key={c.key} row={r} k={c.key} ctx={ctx} format={formatYears} className={className} />;
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DisclosureGroup>
  );
}
