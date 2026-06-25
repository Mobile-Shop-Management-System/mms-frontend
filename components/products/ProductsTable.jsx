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
  useProductList, useProductDetail,
  useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useBrandDropdown, useCategoryDropdown,
} from "@/hooks/useProducts";

const PAGE_SIZE = 10;

const TYPE_STYLES = {
  handset:   "bg-primary/10 text-primary border-primary/20",
  accessory: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  part:      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
};

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

function FormSelect({ label, value, onValueChange, error, className, placeholder, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value || "_none"} onValueChange={(v) => onValueChange(v === "_none" ? "" : v)}>
        <SelectTrigger className={cn(error && "border-destructive focus-visible:ring-destructive/30")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

const EMPTY = { name: "", brand: "", category: "", model_number: "", description: "" };

function ProductDialog({ open, onOpenChange, record }) {
  const isEdit = Boolean(record);
  const { mutate: create, isPending: creating } = useCreateProductMutation();
  const { mutate: update, isPending: updating } = useUpdateProductMutation();
  const isPending = creating || updating;
  const { data: brands = [] } = useBrandDropdown();
  const { data: categories = [] } = useCategoryDropdown();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(record ? {
      name: record.name ?? "",
      brand: record.brand ?? "",
      category: record.category ?? "",
      model_number: record.model_number ?? "",
      description: record.description ?? "",
    } : EMPTY);
    setErrors({});
  }, [record, open]);

  const set = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: undefined })); };
  const setSel = (name) => (value) => { setForm(f => ({ ...f, [name]: value === "_none" ? "" : value })); setErrors(p => ({ ...p, [name]: undefined })); };
  const close = (v) => { if (!v) { setForm(EMPTY); setErrors({}); } onOpenChange(v); };

  const submit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = { ...form, brand: form.brand ? Number(form.brand) : undefined, category: form.category ? Number(form.category) : undefined };
    const opts = {
      onSuccess: () => { toast.success(isEdit ? "Product updated." : "Product added."); close(false); },
      onError: (err) => {
        const e = err?.response?.data?.errors;
        if (e) setErrors(e);
        else toast.error(err?.response?.data?.message ?? "Something went wrong.");
      },
    };
    isEdit ? update({ id: record.id, data: payload }, opts) : create(payload, opts);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update product details." : "Add a new product to the catalog."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product Name *" name="name" value={form.name} onChange={set} required placeholder="e.g. iPhone 15 Pro" error={errors.name} className="col-span-2" />
            <FormSelect label="Brand *" value={form.brand} onValueChange={setSel("brand")} error={errors.brand} placeholder="Select brand…">
              <SelectItem value="_none" disabled>Select brand…</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </FormSelect>
            <FormSelect label="Category *" value={form.category} onValueChange={setSel("category")} error={errors.category} placeholder="Select category…">
              <SelectItem value="_none" disabled>Select category…</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </FormSelect>
            <Field label="Model Number" name="model_number" value={form.model_number} onChange={set} placeholder="e.g. A3290" error={errors.model_number} className="col-span-2" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">Description</label>
            <textarea name="description" value={form.description} onChange={set} rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Optional description…" />
          </div>
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ record, onClose }) {
  const { mutate, isPending } = useDeleteProductMutation();
  const confirm = () => mutate(record.id, {
    onSuccess: () => { toast.success("Product deleted."); onClose(); },
    onError: (err) => { toast.error(err?.response?.data?.message ?? "Failed to delete."); onClose(); },
  });
  return (
    <Dialog open={Boolean(record)} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">"{record?.name}"</span>? This will deactivate it and all its variants.
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

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}

function ProductDetailDialog({ productId, onClose }) {
  const { data: product, isLoading } = useProductDetail(productId);
  const variants = product?.variants ?? [];
  const createdAt = product?.created_at
    ? new Date(product.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <Dialog open={Boolean(productId)} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          {isLoading ? <Skeleton className="h-6 w-48 rounded-lg" /> : <DialogTitle className="text-base">{product?.name}</DialogTitle>}
          <DialogDescription>Product details</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            ))}
          </div>
        ) : product ? (
          <div className="space-y-5 py-1">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label="Brand" value={product.brand_name} />
              <DetailRow label="Category" value={product.category_name} />
              <DetailRow label="Model Number" value={product.model_number} />
              <DetailRow label="Status" value={
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                  product.is_active
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border")}>
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              } />
              {createdAt && <DetailRow label="Created" value={createdAt} />}
              {product.variant_count != null && (
                <DetailRow label="Variants" value={`${product.variant_count} variant${product.variant_count !== 1 ? "s" : ""}`} />
              )}
            </div>
            {product.description && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
                <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
              </div>
            )}
            {variants.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Variants</span>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        {["SKU", "Color", "Storage", "RAM", "Sell Price"].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map(v => (
                        <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono text-muted-foreground">{v.sku || "—"}</td>
                          <td className="px-3 py-2">{v.color || "—"}</td>
                          <td className="px-3 py-2">{v.storage || "—"}</td>
                          <td className="px-3 py-2">{v.ram || "—"}</td>
                          <td className="px-3 py-2 font-semibold tabular-nums whitespace-nowrap">
                            {v.selling_price ? `PKR ${Number(v.selling_price).toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ProductsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const { data: brands = [] } = useBrandDropdown();

  const params = { page, page_size: PAGE_SIZE, ...(search && { search }), ...(brandFilter && { brand: brandFilter }) };
  const { data, isLoading } = useProductList(params);
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
            <input placeholder="Search products…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={brandFilter ? String(brandFilter) : "_all"} onValueChange={v => { setBrandFilter(v === "_all" ? "" : v); setPage(1); }}>
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Brands</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" /> Add Product
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Product", "Brand", "Category", "Model #", "Status", ""].map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {[36, 24, 20, 20, 14, 7].map((w, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className={`h-4 w-${w} rounded-lg`} /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">No products found.</td></tr>
              ) : rows.map(product => (
                <tr key={product.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3.5 max-w-48">
                    <button
                      onClick={() => setSelectedProductId(product.id)}
                      className="font-medium text-left truncate hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{product.brand_name ?? product.brand ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    {product.category_type ? (
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize",
                        TYPE_STYLES[product.category_type] ?? "bg-muted text-muted-foreground border-border")}>
                        {product.category_name ?? product.category_type}
                      </span>
                    ) : <span className="text-muted-foreground">{product.category_name ?? "—"}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{product.model_number || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                      product.is_active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border")}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted data-popup-open:bg-muted transition-colors">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => setEditRecord(product)}>
                          <Pencil className="size-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteRecord(product)}>
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
              {totalCount === 0 ? "No products" : `Showing ${start}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} products`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} record={null} />
      <ProductDialog open={Boolean(editRecord)} onOpenChange={v => { if (!v) setEditRecord(null); }} record={editRecord} />
      <DeleteDialog record={deleteRecord} onClose={() => setDeleteRecord(null)} />
      <ProductDetailDialog productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
    </>
  );
}
