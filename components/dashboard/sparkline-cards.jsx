"use client";

import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

function SparkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg bg-foreground text-background text-xs px-2.5 py-1.5 font-semibold shadow-lg pointer-events-none">
      {fmtMoney(v)}
    </div>
  );
}

function SparklineCard({ title, value, sub, data, colorVar, gradId, loading }) {
  return (
    <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          {loading ? (
            <Skeleton className="h-7 w-36" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground block">
          {loading ? <Skeleton className="h-3 w-28" /> : sub}
        </span>
      </div>

      <div className="h-20">
        {loading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorVar} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={colorVar} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<SparkTooltip />}
                cursor={{ stroke: colorVar, strokeWidth: 1, strokeDasharray: "3 2" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={colorVar}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: colorVar, stroke: "var(--color-background)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function SparklineCards() {
  const { data, isLoading } = useDashboard();

  const daily  = data?.daily_revenue ?? [];
  const week   = daily.slice(-7);
  const total  = week.reduce((s, d) => s + d.revenue, 0);
  const sales  = week.reduce((s, d) => s + d.count, 0);

  const cards = [
    {
      title:    "7-Day Revenue",
      value:    fmtMoney(total),
      sub:      `${sales} sales in the last 7 days`,
      data:     week,
      colorVar: "var(--color-primary)",
      gradId:   "grad-revenue",
    },
    {
      title:    "Daily Sales Volume",
      value:    `${sales} units`,
      sub:      "Total transactions this week",
      data:     week.map((d) => ({ ...d, revenue: d.count })),
      colorVar: "var(--color-primary)",
      gradId:   "grad-units",
    },
    {
      title:    "Avg. Sale Value",
      value:    fmtMoney(sales ? total / sales : 0),
      sub:      "Per transaction this week",
      data:     week,
      colorVar: "var(--color-primary)",
      gradId:   "grad-avg",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <SparklineCard key={c.title} {...c} loading={isLoading} />
      ))}
    </div>
  );
}
