"use client";

import { AlertTriangle, PackageCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLowStock } from "@/hooks/useInventory";

function AlertSkeleton() {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
          </div>
          <div className="space-y-2 text-right shrink-0">
            <Skeleton className="h-4 w-14 rounded-lg ml-auto" />
            <Skeleton className="h-3 w-20 rounded-lg ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LowStockAlerts() {
  const { data, isLoading } = useLowStock();
  const items = Array.isArray(data) ? data : (data?.results ?? []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
        <AlertSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-16 flex flex-col items-center gap-4 text-center">
        <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <PackageCheck className="size-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold">All stock levels healthy</p>
          <p className="text-sm text-muted-foreground mt-1">No accessories are below their reorder level.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
        <p className="text-sm font-semibold">
          Low Stock Alerts
          <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length} item{items.length !== 1 ? "s" : ""})</span>
        </p>
      </div>

      <div className="divide-y divide-border/60">
        {items.map((item, i) => {
          const qty = item.quantity ?? 0;
          const reorder = item.reorder_level ?? 0;
          const pct = reorder > 0 ? Math.min(100, Math.round((qty / reorder) * 100)) : 0;

          return (
            <div key={item.id ?? i} className="flex items-center gap-4 px-5 py-4">
              <div className="size-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {item.product_name ?? item.product ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.branch_name ?? item.branch ?? "All branches"}
                </p>
                <div className="mt-2 h-1.5 w-full max-w-32 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                  {qty} left
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reorder at {reorder}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
