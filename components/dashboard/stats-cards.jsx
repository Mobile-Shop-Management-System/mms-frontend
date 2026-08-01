"use client";

import {
  Wallet,
  ShoppingBag,
  Package,
  Smartphone,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

function pct(curr, prev) {
  if (!prev) return null;
  return (((curr - prev) / prev) * 100).toFixed(1);
}

function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

/** Per-card solid colour themes — fully opaque fills with white content */
const THEMES = {
  emerald:
    "from-emerald-500 to-emerald-600 border-emerald-600 hover:shadow-emerald-500/40",
  blue: "from-blue-500 to-blue-600 border-blue-600 hover:shadow-blue-500/40",
  amber:
    "from-amber-500 to-amber-600 border-amber-600 hover:shadow-amber-500/40",
  violet:
    "from-violet-500 to-violet-600 border-violet-600 hover:shadow-violet-500/40",
};

function StatCard({
  title,
  value,
  trend,
  trendUp,
  footer,
  icon: Icon,
  theme,
  loading,
}) {
  const t = THEMES[theme] ?? THEMES.blue;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-linear-to-br p-6 text-white",
        "flex flex-col gap-3 transition-all duration-300 hover:shadow-xl",
        t,
      )}
    >
      {/* decorative highlight */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/20 blur-2xl transition-transform duration-500 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white/85">{title}</p>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-110">
          <Icon className="size-5 text-white" />
        </span>
      </div>

      <div className="relative flex items-baseline gap-2.5 flex-wrap">
        {loading ? (
          <Skeleton className="h-8 w-32 bg-white/25" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        )}
        {!loading && trend != null && (
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 bg-white/20 text-white">
            <TrendIcon className="size-3" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <span className="relative text-xs text-white/80 block">
        {loading ? <Skeleton className="h-3 w-24 bg-white/25" /> : footer}
      </span>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useDashboard();

  const todayRevenue = data?.today_revenue ?? 0;
  const yesterdayRevenue = data?.yesterday_revenue ?? 0;
  const todaySales = data?.today_sales_count ?? 0;
  const yesterdaySales = data?.yesterday_sales_count ?? 0;
  const totalItems = data?.total_items ?? 0;
  const lowStock = data?.low_stock_count ?? 0;
  const usedPhones = data?.used_phones_available ?? 0;

  const revTrend = pct(todayRevenue, yesterdayRevenue);
  const salesTrend = pct(todaySales, yesterdaySales);

  const stats = [
    {
      title: "Today's Revenue",
      value: fmtMoney(todayRevenue),
      trend: revTrend,
      trendUp: revTrend >= 0,
      footer: `Yesterday: ${fmtMoney(yesterdayRevenue)}`,
      icon: Wallet,
      theme: "emerald",
    },
    {
      title: "Today's Sales",
      value: `${todaySales} sales`,
      trend: salesTrend,
      trendUp: salesTrend >= 0,
      footer: `Yesterday: ${yesterdaySales} sales`,
      icon: ShoppingBag,
      theme: "blue",
    },
    {
      title: "Total Items",
      value: `${totalItems} items`,
      trend: null,
      footer:
        lowStock > 0
          ? `${lowStock} low stock alerts`
          : "All items well stocked",
      icon: Package,
      theme: "amber",
    },
    {
      title: "Used Phones",
      value: `${usedPhones} available`,
      trend: null,
      footer: "In stock for sale",
      icon: Smartphone,
      theme: "violet",
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
