"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { RowAvatar } from "@/components/ui/row-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS = {
  cash:          "Cash",
  card:          "Card",
  easypaisa:     "Easypaisa",
  jazzcash:      "JazzCash",
  bank_transfer: "Bank Transfer",
};

const METHOD_STYLES = {
  cash:          "bg-primary/10 text-primary border-primary/20",
  card:          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  easypaisa:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  jazzcash:      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  bank_transfer: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/40">
      <td className="px-5 py-3.5"><Skeleton className="size-8 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-12" /></td>
    </tr>
  );
}

export function RecentSales() {
  const { data, isLoading } = useDashboard();
  const sales = data?.recent_sales ?? [];

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <p className="text-sm font-semibold">Recent Transactions</p>
        <p className="text-xs text-muted-foreground mt-0.5">Last 5 completed sales</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="w-14 px-5 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paid Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Method</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : sales.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No sales recorded yet.
                  </td>
                </tr>
              )
              : sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <RowAvatar name={sale.customer_name || "Walk-in"} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium leading-tight">
                      {sale.customer_name || <span className="text-muted-foreground italic">Walk-in</span>}
                    </p>
                    {sale.customer_phone && (
                      <p className="text-[11px] text-muted-foreground leading-tight">{sale.customer_phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                    {sale.invoice_number}
                  </td>
                  <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                    {fmtMoney(sale.paid_amount)}
                    {sale.remaining_amount > 0 && (
                      <p className="text-[11px] text-orange-600 dark:text-orange-400">
                        Balance: {fmtMoney(sale.remaining_amount)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-1 rounded-full border",
                      sale.status === "khata_pending"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                    )}>
                      {sale.status === "khata_pending" ? "Khata" : "Paid"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                      METHOD_STYLES[sale.payment_method] ?? "bg-muted text-muted-foreground border-border"
                    )}>
                      {PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(sale.created_at)}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
