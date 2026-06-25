"use client";

import { Package, CheckCircle2, AlertTriangle, Boxes } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useImeiList, useAccessoryStockList, useLowStock } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";

const STATS = [
  {
    key: "total_imei",
    label: "Total IMEI Units",
    icon: Package,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "available",
    label: "Available for Sale",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    key: "low_stock",
    label: "Low Stock Alerts",
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    key: "total_accessories",
    label: "Accessory Stock Lines",
    icon: Boxes,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
];

function StatCard({ stat, value, loading }) {
  const Icon = stat.icon;
  return (
    <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
      <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
        <Icon className={cn("size-5", stat.color)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
        {loading ? (
          <Skeleton className="h-7 w-16 mt-1 rounded-lg" />
        ) : (
          <p className="text-2xl font-bold leading-tight tabular-nums">{value ?? "—"}</p>
        )}
      </div>
    </div>
  );
}

export function InventoryStats() {
  const { data: imeiTotal, isLoading: loadingTotal } = useImeiList({ page_size: 1 });
  const { data: imeiAvailable, isLoading: loadingAvailable } = useImeiList({ status: "available", page_size: 1 });
  const { data: lowStockData, isLoading: loadingLowStock } = useLowStock();
  const { data: accessoryData, isLoading: loadingAccessories } = useAccessoryStockList({ page_size: 1 });

  const lowStockCount = Array.isArray(lowStockData)
    ? lowStockData.length
    : lowStockData?.count ?? 0;

  const values = {
    total_imei: imeiTotal?.count,
    available: imeiAvailable?.count,
    low_stock: lowStockCount,
    total_accessories: accessoryData?.count,
  };

  const loading = {
    total_imei: loadingTotal,
    available: loadingAvailable,
    low_stock: loadingLowStock,
    total_accessories: loadingAccessories,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATS.map((stat) => (
        <StatCard
          key={stat.key}
          stat={stat}
          value={values[stat.key]}
          loading={loading[stat.key]}
        />
      ))}
    </div>
  );
}
