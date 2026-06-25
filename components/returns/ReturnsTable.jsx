"use client";

import { useState, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, Eye, RotateCcw,
  ArrowLeft, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { RowAvatar } from "@/components/ui/row-avatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useReturnList, useReturnDetail, useCreateReturnMutation } from "@/hooks/useReturns";
import { useSaleByInvoice, useSaleDetail } from "@/hooks/useSales";

const PAGE_SIZE = 10;

/* ── helpers ─────────────────────────────────────────────────── */
function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  return (words[0][0] + (words[words.length - 1]?.[0] ?? "")).toUpperCase();
}

/* ── Product thumbnail ────────────────────────────────────────── */
function ProductThumb({ name, src, size = "sm" }) {
  const dim = size === "lg" ? "size-16" : "size-10";
  const text = size === "lg" ? "text-lg font-bold" : "text-xs font-bold";
  return (
    <Avatar className={cn(dim, "shrink-0 rounded-xl border border-border")}>
      {src && <AvatarImage src={src} alt={name ?? ""} className="object-cover" />}
      <AvatarFallback className={cn("rounded-xl bg-muted text-muted-foreground", text)}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/* ── Pagination ───────────────────────────────────────────────── */
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
      <button onClick={() => onPageChange((p) => Math.max(1, p - 1))} disabled={page === 1}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors">
        <ChevronLeft className="size-3.5" />
      </button>
      {range().map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="size-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)}
            className={cn("size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              p === page ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted text-muted-foreground")}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors">
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

/* ── Return Detail Dialog ─────────────────────────────────────── */
function ReturnDetailDialog({ returnId, open, onOpenChange }) {
  const { data: ret, isLoading } = useReturnDetail(returnId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-4" />
            {isLoading
              ? <span className="inline-block h-5 w-32 animate-pulse rounded-lg bg-muted" />
              : `Return #${ret?.return_number ?? returnId}`}
          </DialogTitle>
          <DialogDescription>
            {ret?.invoice_number ? `For invoice ${ret.invoice_number}` : "Return details"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : ret ? (
          <div className="space-y-5">

            {/* Customer + date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-0.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Customer</p>
                <p className="text-sm font-semibold">{ret.customer_name || "Walk-in"}</p>
                {ret.customer_phone && <p className="text-xs text-muted-foreground">{ret.customer_phone}</p>}
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-0.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Date</p>
                <p className="text-sm font-semibold">{formatDate(ret.created_at)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(ret.created_at)}</p>
              </div>
            </div>

            {ret.reason && (
              <div className="rounded-xl border border-border bg-amber-500/5 border-amber-500/20 p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                <p className="text-sm">{ret.reason}</p>
              </div>
            )}

            {/* Items — rich product cards */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Returned Items</p>
              {(ret.items ?? []).map((item) => (
                <div key={item.id}
                  className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                  <ProductThumb name={item.item_name} src={item.item_image} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{item.item_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.variant_name}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.item_brand && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.item_brand}
                        </span>
                      )}
                      {item.item_category && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {item.item_category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs text-muted-foreground">Qty × {item.quantity}</p>
                    <p className="text-xs text-muted-foreground">{fmtMoney(item.unit_price)} ea.</p>
                    <p className="text-sm font-bold text-green-600">{fmtMoney(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex justify-between items-center">
              <span className="text-sm font-bold">Total Refund</span>
              <span className="text-xl font-bold text-green-600">{fmtMoney(ret.total_refund)}</span>
            </div>

          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Could not load return details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── New Return Dialog ────────────────────────────────────────── */
function NewReturnDialog({ open, onOpenChange }) {
  const [step, setStep]               = useState("lookup");
  const [invoiceInput, setInvoiceInput] = useState("");
  const [lookupQuery, setLookupQuery]   = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  // checkedMap / qtyMap keyed by item key — derive display directly from saleDetail.items
  const [checkedMap, setCheckedMap]   = useState({});
  const [qtyMap, setQtyMap]           = useState({});
  const [reason, setReason]           = useState("");

  const { data: foundSale, isFetching: isLooking }      = useSaleByInvoice(lookupQuery);
  const { data: saleDetail, isLoading: isLoadingDetail } = useSaleDetail(selectedSaleId);
  const createMutation = useCreateReturnMutation();

  // No useEffect needed — render saleDetail.items directly
  const saleItems = saleDetail?.items ?? [];

  function itemKey(item) {
    return item.variant ? `${item.item}-${item.variant}` : `${item.item}`;
  }
  function isChecked(item) {
    const k = itemKey(item);
    return k in checkedMap ? checkedMap[k] : true; // default: all checked
  }
  function getQty(item) {
    const k = itemKey(item);
    return k in qtyMap ? qtyMap[k] : item.quantity; // default: full qty
  }

  function handleLookup() {
    const q = invoiceInput.trim().toUpperCase();
    if (!q) return;
    setLookupQuery(q);
  }

  function handleSaleConfirm() {
    if (!foundSale) return;
    setCheckedMap({});
    setQtyMap({});
    setSelectedSaleId(foundSale.id);
    setStep("select");
  }

  function handleToggle(item) {
    const k = itemKey(item);
    setCheckedMap((prev) => ({ ...prev, [k]: !isChecked(item) }));
  }

  function handleQtyChange(item, delta) {
    const k   = itemKey(item);
    const cur = getQty(item);
    const next = Math.max(1, Math.min(item.quantity, cur + delta));
    setQtyMap((prev) => ({ ...prev, [k]: next }));
  }

  async function handleSubmit() {
    const payload = saleItems
      .filter((item) => isChecked(item))
      .map((item) => ({
        item_id:    item.item,
        variant_id: item.variant ?? null,
        item_name:  item.item_name,
        quantity:   getQty(item),
        unit_price: item.unit_price,
      }));

    if (!payload.length) { toast.error("Select at least one item to return."); return; }

    try {
      await createMutation.mutateAsync({
        sale_id: selectedSaleId,
        items:   payload,
        reason,
      });
      toast.success("Return processed. Stock has been restored.");
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to process return.");
    }
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("lookup"); setInvoiceInput(""); setLookupQuery("");
      setSelectedSaleId(null); setCheckedMap({}); setQtyMap({}); setReason("");
    }, 200);
  }

  const checkedItems  = saleItems.filter((item) => isChecked(item));
  const totalRefund   = checkedItems.reduce(
    (sum, item) => sum + Number(item.unit_price) * getQty(item), 0
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-4" /> Process Return
          </DialogTitle>
          <DialogDescription>
            {step === "lookup"
              ? "Enter the invoice number from the original sale."
              : `Sale ${foundSale?.invoice_number} — select items to return.`}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Lookup ── */}
        {step === "lookup" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="e.g. INV-20260621-001"
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <Button size="sm" onClick={handleLookup} disabled={isLooking || !invoiceInput.trim()}>
                {isLooking ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Find
              </Button>
            </div>

            {lookupQuery && !isLooking && !foundSale && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive text-sm">
                <AlertCircle className="size-4 shrink-0" />
                No sale found for "{lookupQuery}".
              </div>
            )}

            {foundSale && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                  <CheckCircle2 className="size-4" /> Sale found
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="font-mono font-semibold">{foundSale.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{fmtMoney(foundSale.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{foundSale.customer_name || "Walk-in"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p>{formatDate(foundSale.created_at)}</p>
                  </div>
                </div>
                <Button className="w-full" size="sm" onClick={handleSaleConfirm}>
                  Select Items to Return →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Select items ── */}
        {step === "select" && (
          <div className="space-y-4">
            <button
              onClick={() => { setStep("lookup"); setSelectedSaleId(null); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to lookup
            </button>

            {isLoadingDetail ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : saleItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No items found for this sale.</p>
            ) : (
              <div className="space-y-2">
                {saleItems.map((item) => {
                  const checked = isChecked(item);
                  const qty     = getQty(item);
                  return (
                    <label
                      key={itemKey(item)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                        checked ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggle(item)}
                        className="size-4 accent-primary cursor-pointer shrink-0"
                      />

                      <ProductThumb name={item.item_name} src={item.item_image} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight truncate">{item.item_name}</p>
                        {item.variant_name && (
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtMoney(item.unit_price)} each · max {item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                        <button type="button" onClick={() => handleQtyChange(item, -1)}
                          disabled={!checked || qty <= 1}
                          className="size-6 flex items-center justify-center rounded border border-border bg-background hover:bg-muted disabled:opacity-40 text-sm font-bold transition-colors">
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                        <button type="button" onClick={() => handleQtyChange(item, +1)}
                          disabled={!checked || qty >= item.quantity}
                          className="size-6 flex items-center justify-center rounded border border-border bg-background hover:bg-muted disabled:opacity-40 text-sm font-bold transition-colors">
                          +
                        </button>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Reason for return
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Defective product, wrong item, customer changed mind…"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            {/* Summary bar */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {checkedItems.length} item{checkedItems.length !== 1 ? "s" : ""} ·{" "}
                </span>
                <span className="font-bold text-green-600">Refund: {fmtMoney(totalRefund)}</span>
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createMutation.isPending || checkedItems.length === 0}
              >
                {createMutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
                Confirm Return
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Table ───────────────────────────────────────────────── */
export function ReturnsTable() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [viewReturnId, setViewReturnId] = useState(null);
  const [newOpen, setNewOpen]       = useState(false);

  const { data, isLoading } = useReturnList({
    page,
    page_size: PAGE_SIZE,
    ...(search && { search }),
  });

  const rows       = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;

  const handleSearch = useCallback((e) => { setSearch(e.target.value); setPage(1); }, []);

  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background min-w-0 flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Invoice, customer or return #…"
              value={search}
              onChange={handleSearch}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setNewOpen(true)}>
            <RotateCcw className="size-3.5" />
            New Return
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Return #", "Invoice", "Customer", "Items", "Total Refund", "Date"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="w-14 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-24 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No returns found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-muted-foreground">
                      {row.return_number}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      {row.invoice_number || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <RowAvatar name={row.customer_name || "Walk-in"} />
                        <div>
                          <div className="font-medium text-sm">{row.customer_name || "Walk-in"}</div>
                          {row.customer_phone && (
                            <div className="text-xs text-muted-foreground">{row.customer_phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">
                      {row.items_count ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-green-600 whitespace-nowrap">
                      {fmtMoney(row.total_refund)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      <div>{formatDate(row.created_at)}</div>
                      <div className="text-muted-foreground/70">{formatTime(row.created_at)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setViewReturnId(row.id)}
                        className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="size-3.5" />
                      </button>
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
              {totalCount === 0 ? "No returns" : `Showing ${start}–${end} of ${totalCount} returns`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <ReturnDetailDialog
        returnId={viewReturnId}
        open={Boolean(viewReturnId)}
        onOpenChange={(v) => { if (!v) setViewReturnId(null); }}
      />

      <NewReturnDialog open={newOpen} onOpenChange={setNewOpen} />
    </>
  );
}
