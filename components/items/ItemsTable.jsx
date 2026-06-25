"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Download, Upload } from "lucide-react";
import { exportToCSV } from "@/lib/csv-utils";
import { CSVImportDialog } from "@/components/ui/csv-import-dialog";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useItemList,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useCreateVariantMutation,
  useDeleteVariantMutation,
  useUploadImageMutation,
  useDeleteImageMutation,
} from "@/hooks/useItems";
import { useCategoryDropdown } from "@/hooks/useCategories";
import { useSupplierDropdown } from "@/hooks/useSuppliers";
import { useBrandDropdown } from "@/hooks/useBrands";

const PAGE_SIZE = 10;

// Derive backend host from NEXT_PUBLIC_API_URL (e.g. http://localhost:8000/api/v1 → http://localhost:8000)
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "");

function resolveImageUrl(src) {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${BACKEND_URL}${src}`;
}

function Field({ label, className, error, ...props }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        {...props}
        className={cn(
          "w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
          error ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring/50"
        )}
      />
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

function TextareaField({ label, className, error, ...props }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        {...props}
        className={cn(
          "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors min-h-18 resize-none",
          error ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring/50"
        )}
      />
      {error && <p className="text-xs text-destructive">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  const range = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={page === 1 || totalPages <= 1}
        className={cn(
          "size-8 flex items-center justify-center rounded-md border text-sm transition-colors",
          page === 1 || totalPages <= 1
            ? "border-muted-foreground/20 bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
            : "border-border bg-background hover:bg-muted text-muted-foreground"
        )}
      >
        <ChevronLeft className="size-4" />
      </button>
      {range().map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="size-8 flex items-center justify-center text-xs text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "size-8 flex items-center justify-center rounded-md border text-xs font-medium transition-colors",
              p === page
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages || totalPages <= 1}
        className={cn(
          "size-8 flex items-center justify-center rounded-md border text-sm transition-colors",
          page === totalPages || totalPages <= 1
            ? "border-muted-foreground/20 bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
            : "border-border bg-background hover:bg-muted text-muted-foreground"
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

const EMPTY_FORM = {
  name: "",
  brand: "",
  category: "",
  supplier: "",
  quantity_in_stock: "",
  purchase_price: "",
  selling_price: "",
  description: "",
};

const EMPTY_NEW_VARIANT = { name: "", qty: 0, price: "" };

function ItemDialog({ open, onOpenChange, record }) {
  const isEdit = Boolean(record);
  const { mutate: create, isPending: creating } = useCreateItemMutation();
  const { mutate: update, isPending: updating } = useUpdateItemMutation();
  const { mutate: createVariant } = useCreateVariantMutation();
  const { mutate: deleteVariant, isPending: deletingVariant } = useDeleteVariantMutation();
  const { mutate: uploadImage } = useUploadImageMutation();
  const { mutate: deleteImage } = useDeleteImageMutation();
  const isPending = creating || updating;

  const { data: categories = [] } = useCategoryDropdown();
  const { data: suppliers = [] } = useSupplierDropdown();
  const { data: brands = [] } = useBrandDropdown();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [pendingVariants, setPendingVariants] = useState([]);
  const [newVariant, setNewVariant] = useState(EMPTY_NEW_VARIANT);
  const [deletingVariantId, setDeletingVariantId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // null = idle, 0–100 = uploading
  const [localImages, setLocalImages] = useState([]);

  useEffect(() => {
    if (open) {
      setForm({
        name: record?.name ?? "",
        brand: record?.brand ?? "",
        category: record?.category ?? "",
        supplier: record?.supplier ?? "",
        quantity_in_stock: record?.quantity_in_stock ?? "",
        purchase_price: record?.purchase_price ?? "",
        selling_price: record?.selling_price ?? "",
        description: record?.description ?? "",
      });
      setErrors({});
      setPendingVariants([]);
      setNewVariant(EMPTY_NEW_VARIANT);
      setDeletingVariantId(null);
      setLocalImages(record?.images ?? []);
    }
  }, [open, record]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };
  const setSel = (name) => (value) => {
    setForm((f) => ({ ...f, [name]: value === "_none" ? "" : value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const setVariantField = (e) => {
    const { name, value } = e.target;
    setNewVariant((v) => ({ ...v, [name]: value }));
  };

  const addVariant = () => {
    const trimmed = newVariant.name.trim();
    if (!trimmed) return;
    setPendingVariants((prev) => [
      ...prev,
      {
        name: trimmed,
        quantity_in_stock: newVariant.qty !== "" ? Number(newVariant.qty) : 0,
        selling_price: newVariant.price !== "" ? newVariant.price : null,
      },
    ]);
    setNewVariant(EMPTY_NEW_VARIANT);
  };

  const removePendingVariant = (index) => {
    setPendingVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingVariant = (variantId) => {
    if (!record?.id) return;
    setDeletingVariantId(variantId);
    deleteVariant(
      { itemId: record.id, variantId },
      {
        onSuccess: () => setDeletingVariantId(null),
        onError: (err) => {
          setDeletingVariantId(null);
          toast.error(err?.response?.data?.message ?? "Failed to delete variant.");
        },
      }
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !record?.id) return;
    const fd = new FormData();
    fd.append("image", file);
    setUploadProgress(0);
    uploadImage(
      {
        itemId: record.id,
        formData: fd,
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      },
      {
        onSuccess: (res) => {
          setUploadProgress(null);
          const newImg = res?.data?.data;
          if (newImg) setLocalImages((prev) => [...prev, newImg]);
        },
        onError: (err) => {
          setUploadProgress(null);
          toast.error(err?.response?.data?.message ?? "Failed to upload image.");
        },
      }
    );
    e.target.value = "";
  };

  const handleDeleteImage = (imageId) => {
    if (!record?.id) return;
    deleteImage(
      { itemId: record.id, imageId },
      {
        onSuccess: () => setLocalImages((prev) => prev.filter((img) => img.id !== imageId)),
        onError: (err) => {
          toast.error(err?.response?.data?.message ?? "Failed to delete image.");
        },
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      ...form,
      brand: form.brand ? Number(form.brand) : null,
      category: form.category ? Number(form.category) : null,
      supplier: form.supplier ? Number(form.supplier) : null,
      quantity_in_stock: form.quantity_in_stock !== "" ? Number(form.quantity_in_stock) : 0,
    };
    const opts = {
      onSuccess: (res) => {
        const savedItem = res?.data?.data ?? res?.data ?? {};
        const itemId = savedItem?.id ?? record?.id;
        // Fire variant creations after item saved
        if (pendingVariants.length > 0 && itemId) {
          pendingVariants.forEach((v) => {
            createVariant(
              { itemId, data: v },
              {
                onError: (err) => {
                  toast.error(`Variant "${v.name}": ${err?.response?.data?.message ?? "Failed to create."}`);
                },
              }
            );
          });
        }
        toast.success(isEdit ? "Item updated." : "Item added.");
        onOpenChange(false);
      },
      onError: (err) => {
        const e = err?.response?.data?.errors;
        if (e) setErrors(e);
        else toast.error(err?.response?.data?.message ?? "Something went wrong.");
      },
    };
    if (isEdit) update({ id: record.id, data: payload }, opts);
    else create(payload, opts);
  };

  const existingVariants = record?.variants ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update item details." : "Add a new item to inventory."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Name *"
              name="name"
              value={form.name}
              onChange={set}
              required
              placeholder="Item name"
              error={errors.name}
              className="col-span-2"
            />
            <FormSelect label="Brand" value={form.brand} onValueChange={setSel("brand")} error={errors.brand} placeholder="No brand">
              <SelectItem value="_none">No brand</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </FormSelect>
            <FormSelect label="Category" value={form.category} onValueChange={setSel("category")} error={errors.category} placeholder="No category">
              <SelectItem value="_none">No category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </FormSelect>
            <FormSelect label="Supplier" value={form.supplier} onValueChange={setSel("supplier")} error={errors.supplier} placeholder="No supplier">
              <SelectItem value="_none">No supplier</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </FormSelect>
            <Field
              label="Qty in Stock"
              name="quantity_in_stock"
              type="number"
              min="0"
              value={form.quantity_in_stock}
              onChange={set}
              error={errors.quantity_in_stock}
            />
            <Field
              label="Purchase Price"
              name="purchase_price"
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={set}
              error={errors.purchase_price}
            />
            <Field
              label="Selling Price *"
              name="selling_price"
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={set}
              required
              error={errors.selling_price}
              className="col-span-2"
            />
          </div>
          <TextareaField
            label="Description"
            name="description"
            value={form.description}
            onChange={set}
            placeholder="Optional…"
            error={errors.description}
          />

          {/* Variants section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variants</p>

            {/* Existing saved variants (edit mode only) */}
            {isEdit && existingVariants.map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 font-medium">{v.name}</span>
                <span className="text-muted-foreground">Qty: {v.quantity_in_stock}</span>
                {v.selling_price && (
                  <span className="text-muted-foreground">PKR {Number(v.selling_price).toLocaleString()}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteExistingVariant(v.id)}
                  disabled={deletingVariantId === v.id}
                  className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

            {/* Pending new variants */}
            {pendingVariants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-2 py-1">
                <span className="flex-1 font-medium">{v.name}</span>
                <span className="text-muted-foreground">Qty: {v.quantity_in_stock}</span>
                {v.selling_price && (
                  <span className="text-muted-foreground">PKR {Number(v.selling_price).toLocaleString()}</span>
                )}
                <button
                  type="button"
                  onClick={() => removePendingVariant(i)}
                  className="size-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

            {/* Add variant row */}
            <div className="flex items-end gap-2">
              <Field
                label="Variant Name"
                name="name"
                value={newVariant.name}
                onChange={setVariantField}
                placeholder="e.g. 128GB Black"
                className="flex-1"
              />
              <Field
                label="Qty"
                name="qty"
                type="number"
                min="0"
                value={newVariant.qty}
                onChange={setVariantField}
                className="w-20"
              />
              <Field
                label="Price (opt)"
                name="price"
                type="number"
                min="0"
                value={newVariant.price}
                onChange={setVariantField}
                className="w-28"
              />
              <button
                type="button"
                onClick={addVariant}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* Images section — edit mode only */}
          {isEdit && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Images</p>
              <div className="flex flex-wrap gap-2">
                {localImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={resolveImageUrl(img.image)}
                      alt=""
                      className="size-16 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-0.5 right-0.5 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <label className={cn(
                  "size-16 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted transition-colors",
                  uploadProgress !== null && "opacity-50 cursor-wait"
                )}>
                  <Plus className="size-4 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageUpload}
                    disabled={uploadProgress !== null}
                  />
                </label>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteItemDialog({ open, onOpenChange, record }) {
  const { mutate, isPending } = useDeleteItemMutation();
  const confirm = () =>
    mutate(record.id, {
      onSuccess: () => {
        toast.success("Item deleted.");
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message ?? "Failed to delete.");
        onOpenChange(false);
      },
    });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogDescription>
            Delete <span className="font-semibold text-foreground">{record?.name}</span>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={isPending} onClick={confirm}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDetailDialog({ record, open, onOpenChange }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = record?.images ?? [];
  const variants = record?.variants ?? [];

  useEffect(() => { if (open) setActiveImage(0); }, [open, record?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record?.name}</DialogTitle>
          <DialogDescription>
            {[record?.brand_name, record?.category_name, record?.supplier_name].filter(Boolean).join(" · ") || "Item details"}
          </DialogDescription>
        </DialogHeader>

        {/* Images */}
        {images.length > 0 && (
          <div className="space-y-2">
            <img
              src={resolveImageUrl(images[activeImage]?.image)}
              alt={record?.name}
              className="w-full h-48 object-cover rounded-xl border border-border"
            />
            {images.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "size-12 rounded-lg overflow-hidden border-2 transition-colors",
                      i === activeImage ? "border-primary" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <img src={resolveImageUrl(img.image)} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Selling Price</p>
            <p className="text-lg font-bold">PKR {Number(record?.selling_price ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">In Stock</p>
            <p className={cn(
              "text-lg font-bold",
              (record?.quantity_in_stock ?? 0) <= 0
                ? "text-destructive"
                : (record?.quantity_in_stock ?? 0) <= 5
                ? "text-orange-500"
                : "text-foreground"
            )}>
              {record?.quantity_in_stock ?? 0}
            </p>
          </div>
          {Number(record?.purchase_price) > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Purchase Price</p>
              <p className="text-sm font-semibold">PKR {Number(record.purchase_price).toLocaleString()}</p>
            </div>
          )}
          {record?.brand_name && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Brand</p>
              <p className="text-sm font-semibold">{record.brand_name}</p>
            </div>
          )}
          {record?.category_name && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Category</p>
              <p className="text-sm font-semibold">{record.category_name}</p>
            </div>
          )}
          {record?.supplier_name && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 col-span-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Supplier</p>
              <p className="text-sm font-semibold">{record.supplier_name}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {record?.description && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm">{record.description}</p>
          </div>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Variants</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Variant</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2.5 font-medium">{v.name}</td>
                      <td className={cn(
                        "px-3 py-2.5 text-right font-semibold",
                        v.quantity_in_stock <= 0
                          ? "text-destructive"
                          : v.quantity_in_stock <= 5
                          ? "text-orange-500"
                          : "text-muted-foreground"
                      )}>
                        {v.quantity_in_stock}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {v.selling_price
                          ? `PKR ${Number(v.selling_price).toLocaleString()}`
                          : <span className="text-muted-foreground text-xs">same as item</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ItemsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data, isLoading, refetch } = useItemList({ page, page_size: PAGE_SIZE, ...(search && { search }) });
  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;
  const { mutateAsync: createItem } = useCreateItemMutation();

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error("No items to export");
      return;
    }
    const exportData = rows.map(({ id, name, category_id, category_name, supplier_id, supplier_name, brand_id, brand_name, sku, quantity_in_stock, purchase_price, selling_price, description }) => ({
      id,
      name,
      category: category_name,
      supplier: supplier_name,
      brand: brand_name,
      sku,
      quantity_in_stock,
      purchase_price,
      selling_price,
      description: description || "",
    }));
    exportToCSV(exportData, `items_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Items exported successfully");
  };

  const handleImport = async (csvData) => {
    // Validate CSV structure
    if (csvData.length === 0) {
      throw new Error("CSV file is empty");
    }

    const requiredFields = ["name", "selling_price"];
    const firstRow = csvData[0];
    const headers = Object.keys(firstRow).map(h => h.toLowerCase());
    const missingFields = requiredFields.filter(f => !headers.includes(f.toLowerCase()));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    setIsImporting(true);
    try {
      let success = 0;
      let failed = 0;

      for (const row of csvData) {
        try {
          const payload = {
            name: row.name?.trim(),
            category: row.category ? parseInt(row.category) : null,
            supplier: row.supplier ? parseInt(row.supplier) : null,
            brand: row.brand ? parseInt(row.brand) : null,
            sku: row.sku?.trim() || null,
            quantity_in_stock: row.quantity_in_stock ? parseInt(row.quantity_in_stock) : 0,
            purchase_price: row.purchase_price ? parseFloat(row.purchase_price) : 0,
            selling_price: parseFloat(row.selling_price),
            description: row.description?.trim() || null,
          };

          await createItem(payload);
          success++;
        } catch (err) {
          failed++;
          console.error(`Failed to import row:`, row, err);
        }
      }

      await refetch();
      if (failed > 0) {
        toast.warning(`Imported ${success} items, ${failed} failed`);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background min-w-0 flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search items…"
              value={search}
              onChange={handleSearch}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} disabled={isImporting}>
              <Upload className="size-3.5" /> Import
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" /> Add Item
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Name", "Category", "Supplier", "Qty in Stock", "Selling Price", "Variants"].map((col) => (
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
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-7 w-16 rounded-lg" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No items found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <RowAvatar
                          name={row.name}
                          src={resolveImageUrl(
                            row.images?.find((i) => i.is_primary)?.image ?? row.images?.[0]?.image
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setViewRecord(row)}
                          className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                        >
                          {row.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.category_name || "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.supplier_name || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "font-semibold",
                          row.quantity_in_stock <= 0
                            ? "text-destructive"
                            : row.quantity_in_stock <= 5
                            ? "text-orange-500"
                            : "text-foreground"
                        )}
                      >
                        {row.quantity_in_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                      {row.selling_price ? `PKR ${Number(row.selling_price).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {row.variants?.length > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {row.variants.length} variant{row.variants.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditRecord(row)} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => setDeleteRecord(row)} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <Trash2 className="size-3.5" />
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
              {totalCount === 0 ? "No items" : `Showing ${start}–${end} of ${totalCount} items`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <ItemDetailDialog
        record={viewRecord}
        open={Boolean(viewRecord)}
        onOpenChange={(v) => { if (!v) setViewRecord(null); }}
      />
      <ItemDialog open={addOpen} onOpenChange={setAddOpen} record={null} />
      <ItemDialog
        open={Boolean(editRecord)}
        onOpenChange={(v) => { if (!v) setEditRecord(null); }}
        record={editRecord}
      />
      <DeleteItemDialog
        open={Boolean(deleteRecord)}
        onOpenChange={(v) => { if (!v) setDeleteRecord(null); }}
        record={deleteRecord}
      />

      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        moduleLabel="Items"
      />
    </>
  );
}
