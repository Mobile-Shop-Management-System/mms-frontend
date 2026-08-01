"use client";

import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { LineChart, Activity, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

/** Per-card solid colour themes — fully opaque fills with white content */
const THEMES = {
  cyan: "from-cyan-500 to-cyan-600 border-cyan-600 hover:shadow-cyan-500/40",
  rose: "from-rose-500 to-rose-600 border-rose-600 hover:shadow-rose-500/40",
  indigo:
    "from-indigo-500 to-indigo-600 border-indigo-600 hover:shadow-indigo-500/40",
};

/** Chart line/fill colour drawn on top of the solid card */
const CHART_COLOR = "#ffffff";

function SparkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg bg-foreground text-background text-xs px-2.5 py-1.5 font-semibold shadow-lg pointer-events-none">
      {fmtMoney(v)}
    </div>
  );
}

function SparklineCard({
  title,
  value,
  sub,
  data,
  gradId,
  icon: Icon,
  theme,
  loading,
}) {
  const t = THEMES[theme] ?? THEMES.cyan;
  const colorVar = CHART_COLOR;

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-linear-to-br p-6 flex flex-col gap-4 text-white",
        "transition-all duration-300 hover:shadow-xl",
        t,
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-white/85">{title}</p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-110">
            <Icon className="size-4.5 text-white" />
          </span>
        </div>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          {loading ? (
            <Skeleton className="h-7 w-36 bg-white/25" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-white">
              {value}
            </p>
          )}
        </div>
        <span className="text-xs text-white/80 block">
          {loading ? <Skeleton className="h-3 w-28 bg-white/25" /> : sub}
        </span>
      </div>

      <div className="h-20">
        {loading ? (
          <Skeleton className="h-full w-full rounded-lg bg-white/25" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorVar} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={colorVar} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<SparkTooltip />}
                cursor={{
                  stroke: colorVar,
                  strokeWidth: 1,
                  strokeDasharray: "3 2",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={colorVar}
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: colorVar,
                  stroke: "rgba(0,0,0,0.25)",
                  strokeWidth: 2,
                }}
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

  const daily = data?.daily_revenue ?? [];
  const week = daily.slice(-7);
  const total = week.reduce((s, d) => s + d.revenue, 0);
  const sales = week.reduce((s, d) => s + d.count, 0);

  const cards = [
    {
      title: "7-Day Revenue",
      value: fmtMoney(total),
      sub: `${sales} sales in the last 7 days`,
      data: week,
      gradId: "grad-revenue",
      icon: LineChart,
      theme: "cyan",
    },
    {
      title: "Daily Sales Volume",
      value: `${sales} units`,
      sub: "Total transactions this week",
      data: week.map((d) => ({ ...d, revenue: d.count })),
      gradId: "grad-units",
      icon: Activity,
      theme: "rose",
    },
    {
      title: "Avg. Sale Value",
      value: fmtMoney(sales ? total / sales : 0),
      sub: "Per transaction this week",
      data: week,
      gradId: "grad-avg",
      icon: Receipt,
      theme: "indigo",
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
