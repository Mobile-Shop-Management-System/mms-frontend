"use client";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

function pct(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / prev * 100).toFixed(1);
}

function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

function StatCard({ title, value, trend, trendUp, footer, loading }) {
  return (
    <div className="rounded-2xl border bg-card p-6 flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        )}
        {!loading && trend != null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
              trendUp
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trendUp ? "↗" : "↘"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground block">
        {loading ? <Skeleton className="h-3 w-24" /> : footer}
      </span>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useDashboard();

  const todayRevenue     = data?.today_revenue ?? 0;
  const yesterdayRevenue = data?.yesterday_revenue ?? 0;
  const todaySales       = data?.today_sales_count ?? 0;
  const yesterdaySales   = data?.yesterday_sales_count ?? 0;
  const totalItems       = data?.total_items ?? 0;
  const lowStock         = data?.low_stock_count ?? 0;
  const usedPhones       = data?.used_phones_available ?? 0;

  const revTrend   = pct(todayRevenue, yesterdayRevenue);
  const salesTrend = pct(todaySales, yesterdaySales);

  const stats = [
    {
      title:   "Today's Revenue",
      value:   fmtMoney(todayRevenue),
      trend:   revTrend,
      trendUp: revTrend >= 0,
      footer:  `Yesterday: ${fmtMoney(yesterdayRevenue)}`,
    },
    {
      title:   "Today's Sales",
      value:   `${todaySales} sales`,
      trend:   salesTrend,
      trendUp: salesTrend >= 0,
      footer:  `Yesterday: ${yesterdaySales} sales`,
    },
    {
      title:   "Total Items",
      value:   `${totalItems} items`,
      trend:   null,
      footer:  lowStock > 0 ? `${lowStock} low stock alerts` : "All items well stocked",
    },
    {
      title:   "Used Phones",
      value:   `${usedPhones} available`,
      trend:   null,
      footer:  "In stock for sale",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => (
        <StatCard key={s.title} {...s} loading={isLoading} />
      ))}
    </div>
  );
}
