"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveBadge } from "@/components/market/LiveBadge";
import { convertToEur, deriveFxRate } from "@/lib/currency";
import type { CostOfLivingDetail } from "@/lib/market-schemas";

/**
 * Cost-of-Living detail view (portfolio.md §18 `/market/[symbol]`,
 * `COL:`-prefixed slugs) — area chart with a Local/EUR toggle, expense
 * basket breakdown, and source provenance. SSR-only, no SSE (COL doesn't
 * stream).
 */
export function CostOfLivingChart({ detail }: { detail: CostOfLivingDetail }) {
  const [currency, setCurrency] = React.useState<"local" | "eur">("local");
  const rate = deriveFxRate(detail.localValue, detail.eurValue);

  const data = detail.series.map((p) => ({
    time: new Date(p.time).getTime(),
    value: currency === "eur" ? convertToEur(p.value, rate) : p.value,
  }));

  const basketTotal = detail.basket.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light">{detail.city}</h2>
          <p className="font-mono text-sm text-text-muted">
            {currency === "local"
              ? `${detail.localValue.toLocaleString()} ${detail.localCurrency} / month`
              : `€${detail.eurValue.toLocaleString()} / month`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge simulated={detail.simulated} />
          <Tabs value={currency} onValueChange={(v) => setCurrency(v as "local" | "eur")}>
            <TabsList>
              <TabsTrigger value="local">{detail.localCurrency}</TabsTrigger>
              <TabsTrigger value="eur">EUR</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis
              dataKey="time"
              tickFormatter={(t: number) => new Date(t).getFullYear().toString()}
              stroke="var(--color-text-faint)"
            />
            <YAxis stroke="var(--color-text-faint)" width={60} />
            <Tooltip
              contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-hairline)" }}
              labelFormatter={(label) => new Date(Number(label)).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-simulated)"
              fill="var(--color-simulated)"
              fillOpacity={0.15}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-muted">Expense basket</h3>
        {detail.basket.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <span className="w-40 shrink-0 truncate">{item.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel">
              <div
                className="h-full bg-simulated"
                style={{ width: `${(item.value / basketTotal) * 100}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right font-mono text-text-muted">
              {item.value.toLocaleString()} {detail.localCurrency}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-faint">
        {detail.source} · {detail.surveyYear} · 1 {detail.localCurrency} = €{rate.toFixed(4)}
      </p>
    </div>
  );
}
