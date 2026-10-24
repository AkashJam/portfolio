"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

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
import { SwipeHint } from "@/components/atlas/SwipeHint";
import { useScrollEdges } from "@/components/atlas/useScrollEdges";
import { useTargetSlug } from "@/components/atlas/useTargetSlug";
import { cityHref, noCityPageNote } from "@/lib/atlas-absences";
import { computedLine, deltaUnit, homeDelta, homeMoney } from "@/lib/atlas-home";
import { cellNote } from "@/lib/atlas-notes";
import { columnInfo, vintageOf } from "@/lib/atlas-provenance";
import type { AtlasRow, DisplayRate, WindowStart } from "@/lib/market-schemas";
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
        rounded > 0 && "text-market-up",
        rounded < 0 && "text-market-down",
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
  const [sort, setSort] = useState<{ key: ColumnKey; dir: SortDir }>({
    key: "everydaySpendingEur",
    dir: "asc",
  });
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
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );
  }

  return (
    <DisclosureGroup>
      <SwipeHint />
      <div className="panel-elevated overflow-hidden rounded-2xl">
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
                    {r.slug === home?.slug && (
                      <span data-testid="home-tag" className="text-meta uppercase tracking-wider text-brand-hover">
                        home
                      </span>
                    )}
                    <small className="text-meta text-text-muted">
                      {r.country} {"·"}{" "}
                      {r.sensor ? (
                        <>
                          market sensor{" "}
                          <Link
                            href={`/market/${r.slug}`}
                            className="font-mono underline-offset-4 hover:text-brand-hover hover:underline"
                          >
                            {r.sensor}
                          </Link>
                        </>
                      ) : (
                        "no market sensor"
                      )}
                      {noCityPageNote(r, rows) &&
                        ` · ${noCityPageNote(r, rows)}`}
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
                  format={spendFormat}
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
