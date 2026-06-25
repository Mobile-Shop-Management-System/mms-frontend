"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Receipt, Printer } from "lucide-react";
import { RowAvatar } from "@/components/ui/row-avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSaleList, useSaleDetail } from "@/hooks/useSales";
import { printReceipt } from "@/lib/printReceipt";

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const range = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      {range().map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="size-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background hover:bg-muted text-muted-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}

function paymentBadge(method) {
  const map = {
    cash:          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    card:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    easypaisa:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    jazzcash:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    bank_transfer: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return map[method] ?? "bg-muted text-muted-foreground";
}

function paymentLabel(method) {
  const map = {
    cash: "Cash", card: "Card",
    easypaisa: "Easypaisa", jazzcash: "JazzCash", bank_transfer: "Bank Transfer",
  };
  return map[method] ?? method ?? "—";
}

function SaleDetailDialog({ saleId, open, onOpenChange }) {
  const { data: sale, isLoading } = useSaleDetail(saleId);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printReceipt(sale);
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-4" />
            {isLoading ? <span className="inline-block h-5 w-32 animate-pulse rounded-lg bg-muted" /> : `Invoice #${sale?.invoice_number ?? saleId}`}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? (
              <span className="inline-block h-4 w-48 animate-pulse rounded-lg bg-muted" />
            ) : (
              sale?.created_at ? `${formatDate(sale.created_at)} at ${formatTime(sale.created_at)}` : ""
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : sale ? (
          <div className="space-y-5">
            {/* Customer info */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
              <p className="text-sm font-medium">{sale.customer_name || "Walk-in Customer"}</p>
              {sale.customer_phone && <p className="text-xs text-muted-foreground">{sale.customer_phone}</p>}
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Item</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sale.items ?? []).map((item, i) => (
                      <tr key={i} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2.5">{item.item_name ?? item.name ?? `Item #${item.item_id}`}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">
                          PKR {Number(item.unit_price).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold">
                          PKR {(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>PKR {Number(sale.subtotal ?? sale.total_amount ?? 0).toLocaleString()}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">- PKR {Number(sale.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                <span>Total</span>
                <span>PKR {Number(sale.total ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment Method</span>
                <span>{paymentLabel(sale.payment_method)}</span>
              </div>
            </div>

            {/* Payment Details Section */}
            {sale && (
              <div className={`rounded-lg border-2 p-3 space-y-2 ${
                sale.khata && sale.khata.remaining_amount > 0
                  ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                  : "border-green-300 bg-green-50 dark:bg-green-900/20"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Payment Details
                  </p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    sale.khata && sale.khata.remaining_amount > 0
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }`}>
                    {sale.khata && sale.khata.remaining_amount > 0 ? "Khata Pending" : "Paid"}
                  </span>
                </div>

                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">PKR {Number(sale.total).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">Paid Amount</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    PKR {sale.khata ? Number(sale.khata.paid_amount).toLocaleString() : Number(sale.total).toLocaleString()}
                  </span>
                </div>

                {sale.khata && sale.khata.remaining_amount > 0 && (
                  <div className="flex justify-between text-sm bg-orange-100 dark:bg-orange-900/40 p-2 rounded">
                    <span className="font-bold text-orange-700 dark:text-orange-400">Remaining Amount</span>
                    <span className="font-bold text-orange-700 dark:text-orange-400">
                      PKR {Number(sale.khata.remaining_amount).toLocaleString()}
                    </span>
                  </div>
                )}

                {sale.khata && sale.khata.payments && sale.khata.payments.length > 0 && (
                  <div className="border-t border-orange-200 dark:border-orange-800 pt-2 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Payment History:</p>
                    <div className="space-y-1">
                      {sale.khata.payments.map((payment, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                          <span>{new Date(payment.created_at).toLocaleDateString("en-PK")} - {payment.payment_method}</span>
                          <span>PKR {Number(payment.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sale.notes && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm">{sale.notes}</p>
              </div>
            )}

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="size-4" /> {isPrinting ? "Preparing..." : "Print Receipt"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Could not load sale details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SalesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewSaleId, setViewSaleId] = useState(null);
  const [printSaleId, setPrintSaleId] = useState(null);

  const hasFilters = Boolean(search || dateFrom || dateTo);

  const { data, isLoading } = useSaleList({
    page,
    page_size: PAGE_SIZE,
    ...(search    && { search }),
    ...(dateFrom  && { date_from: dateFrom }),
    ...(dateTo    && { date_to: dateTo }),
  });
  const { data: saleToPrint } = useSaleDetail(printSaleId);

  useEffect(() => {
    if (saleToPrint && printSaleId) {
      printReceipt(saleToPrint);
      setPrintSaleId(null);
    }
  }, [saleToPrint, printSaleId]);

  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;

  const handleSearch = useCallback((e) => { setSearch(e.target.value); setPage(1); }, []);
  const handleDateFrom = useCallback((e) => { setDateFrom(e.target.value); setPage(1); }, []);
  const handleDateTo   = useCallback((e) => { setDateTo(e.target.value);   setPage(1); }, []);
  const clearFilters   = useCallback(() => { setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }, []);

  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
          {/* Search */}
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background min-w-0 flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Invoice, name or phone…"
              value={search}
              onChange={handleSearch}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          {/* Date From */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={handleDateFrom}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
            />
          </div>
          {/* Date To */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={handleDateTo}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
            />
          </div>
          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-8 px-3 rounded-lg text-xs text-muted-foreground border border-border bg-background hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Invoice #", "Customer", "Items", "Total", "Payment Method", "Date"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-12 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="size-7 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No sales found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold">
                      {row.invoice_number ?? `#${row.id}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <RowAvatar name={row.customer_name || "Walk-in"} />
                        <div>
                          <div className="font-medium">{row.customer_name || "Walk-in"}</div>
                          {row.customer_phone && (
                            <div className="text-xs text-muted-foreground">{row.customer_phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">
                      {row.items?.length ?? row.items_count ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                      PKR {Number(row.total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        paymentBadge(row.payment_method)
                      )}>
                        {paymentLabel(row.payment_method)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap text-xs">
                      <div>{formatDate(row.created_at)}</div>
                      <div className="text-muted-foreground/70">{formatTime(row.created_at)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewSaleId(row.id)} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Eye className="size-3.5" />
                        </button>
                        <button onClick={() => setPrintSaleId(row.id)} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Printer className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-border/60">
          {isLoading ? (
            <Skeleton className="h-4 w-44 rounded-lg" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {totalCount === 0 ? "No sales" : `Showing ${start}–${end} of ${totalCount} sales`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <SaleDetailDialog
        saleId={viewSaleId}
        open={Boolean(viewSaleId)}
        onOpenChange={(v) => { if (!v) setViewSaleId(null); }}
      />
    </>
  );
}
