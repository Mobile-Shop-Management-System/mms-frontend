"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useVariantList, useCreateVariantMutation, useUpdateVariantMutation, useDeleteVariantMutation,
  useProductDropdown,
} from "@/hooks/useProducts";

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = totalPages <= 7 ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : page <= 4 ? [1, 2, 3, 4, 5, "…", totalPages]
    : page >= totalPages - 3 ? [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    : [1, "…", page - 1, page, page + 1, "…", totalPages];
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={page === 1}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="size-3.5" />
      </button>
      {pages.map((p, i) => p === "…"
        ? <span key={`e${i}`} className="size-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
        : <button key={p} onClick={() => onPageChange(p)}
            className={cn("size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              p === page ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted text-muted-foreground")}>
            {p}
          </button>
      )}
      <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function Field({ label, className, error, ...props }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input {...props} className={cn(
        "w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
        error ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring/50"
      )} />
      {error && <p className="text-xs text-destructive">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

const EMPTY = { product: "", storage: "", ram: "", color: "", cost_price: "", selling_price: "", reorder_level: "5" };

function VariantDialog({ open, onOpenChange, record }) {
  const isEdit = Boolean(record);
  const { mutate: create, isPending: creating } = useCreateVariantMutation();
  const { mutate: update, isPending: updating } = useUpdateVariantMutation();
  const isPending = creating || updating;
  const { data: productOptions = [] } = useProductDropdown();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(record ? {
      product: record.product ?? "",
      storage: record.storage ?? "",
      ram: record.ram ?? "",
      color: record.color ?? "",
      cost_price: record.cost_price ?? "",
      selling_price: record.selling_price ?? "",
      reorder_level: record.reorder_level ?? "5",
    } : EMPTY);
    setErrors({});
  }, [record, open]);

  const set = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: undefined })); };
  const setSel = (name) => (value) => { setForm(f => ({ ...f, [name]: value === "_none" ? "" : value })); setErrors(p => ({ ...p, [name]: undefined })); };
  const close = (v) => { if (!v) { setForm(EMPTY); setErrors({}); } onOpenChange(v); };

  const submit = (e) => {
    e.preventDefault();
    setErrors({});
    const opts = {
      onSuccess: () => { toast.success(isEdit ? "Variant updated." : "Variant added."); close(false); },
      onError: (err) => {
        const e = err?.response?.data?.errors;
        if (e) setErrors(e);
        else toast.error(err?.response?.data?.message ?? "Something went wrong.");
      },
    };
    if (isEdit) {
      const data = { ...form, reorder_level: form.reorder_level ? Number(form.reorder_level) : 5 };
      delete data.product;
      update({ id: record.id, data }, opts);
    } else {
      const { product, ...rest } = form;
      const data = { ...rest, reorder_level: rest.reorder_level ? Number(rest.reorder_level) : 5 };
      create({ productId: product, data }, opts);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Variant" : "Add Variant"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update this variant." : "Add a storage / color variant to a product."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">Product *</label>
              <Select value={form.product ? String(form.product) : "_none"} onValueChange={setSel("product")}>
                <SelectTrigger className={cn(errors.product && "border-destructive focus-visible:ring-destructive/30")}>
                  <SelectValue placeholder="Select product…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" disabled>Select product…</SelectItem>
                  {productOptions.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.brand_name ? `${p.brand_name} ${p.name}` : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product && <p className="text-xs text-destructive">{Array.isArray(errors.product) ? errors.product[0] : errors.product}</p>}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Storage" name="storage" value={form.storage} onChange={set} placeholder="128GB" error={errors.storage} />
            <Field label="RAM" name="ram" value={form.ram} onChange={set} placeholder="8GB" error={errors.ram} />
            <Field label="Color" name="color" value={form.color} onChange={set} placeholder="Black" error={errors.color} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Cost Price *" name="cost_price" type="number" value={form.cost_price} onChange={set} required placeholder="0" error={errors.cost_price} />
            <Field label="Selling Price *" name="selling_price" type="number" value={form.selling_price} onChange={set} required placeholder="0" error={errors.selling_price} />
            <Field label="Reorder Level" name="reorder_level" type="number" value={form.reorder_level} onChange={set} placeholder="5" error={errors.reorder_level} />
          </div>
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Variant"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ record, onClose }) {
  const { mutate, isPending } = useDeleteVariantMutation();
  const confirm = () => mutate(record.id, {
    onSuccess: () => { toast.success("Variant deleted."); onClose(); },
    onError: (err) => { toast.error(err?.response?.data?.message ?? "Failed to delete."); onClose(); },
  });
  return (
    <Dialog open={Boolean(record)} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Variant</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the variant <span className="font-semibold text-foreground">"{record?.sku}"</span>? This will deactivate it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>{isPending ? "Deleting…" : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VariantsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const { data: productOptions = [] } = useProductDropdown();

  const params = { page, page_size: PAGE_SIZE, ...(search && { search }), ...(productFilter && { product: productFilter }) };
  const { data, isLoading } = useVariantList(params);
  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input placeholder="Search SKU or variant…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={productFilter ? String(productFilter) : "_all"} onValueChange={v => { setProductFilter(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Products</SelectItem>
                {productOptions.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.brand_name ? `${p.brand_name} ${p.name}` : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" /> Add Variant
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["SKU", "Product", "Color", "Storage", "RAM", "Cost Price", "Sell Price", "Reorder", ""].map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-14 text-center text-sm text-muted-foreground">No variants found.</td></tr>
              ) : rows.map(v => (
                <tr key={v.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{v.sku}</td>
                  <td className="px-4 py-3.5 font-medium max-w-40 truncate">{v.product_name ?? v.product ?? "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{v.color || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{v.storage || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{v.ram || "—"}</td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums whitespace-nowrap">
                    {v.cost_price ? `PKR ${Number(v.cost_price).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums whitespace-nowrap">
                    {v.selling_price ? `PKR ${Number(v.selling_price).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">{v.reorder_level ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted data-popup-open:bg-muted transition-colors">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => setEditRecord(v)}>
                          <Pencil className="size-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteRecord(v)}>
                          <Trash2 className="size-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-border/60">
          {isLoading ? <Skeleton className="h-4 w-40 rounded-lg" /> : (
            <p className="text-xs text-muted-foreground">
              {totalCount === 0 ? "No variants" : `Showing ${start}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} variants`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <VariantDialog open={dialogOpen} onOpenChange={setDialogOpen} record={null} />
      <VariantDialog open={Boolean(editRecord)} onOpenChange={v => { if (!v) setEditRecord(null); }} record={editRecord} />
      <DeleteDialog record={deleteRecord} onClose={() => setDeleteRecord(null)} />
    </>
  );
}
