"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Lock } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useUsedPhoneList,
  useCreateUsedPhoneMutation,
  useUpdateUsedPhoneMutation,
  useDeleteUsedPhoneMutation,
} from "@/hooks/useUsedPhones";

const PAGE_SIZE = 10;

const CONDITIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

function conditionLabel(val) {
  return CONDITIONS.find((c) => c.value === val)?.label ?? val ?? "—";
}

function conditionColor(val) {
  switch (val) {
    case "excellent": return "text-green-600";
    case "good": return "text-blue-600";
    case "fair": return "text-orange-500";
    case "poor": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function Field({ label, className, error, as: As = "input", ...props }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <As
        {...props}
        className={cn(
          "w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
          As === "textarea" ? "py-2 min-h-18 resize-none" : "h-9",
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
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(error && "border-destructive focus-visible:ring-destructive/30")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

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

const STATUS_STYLES = {
  available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  sold:      "bg-muted text-muted-foreground border-border",
  returned:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
};

const EMPTY_FORM = {
  customer_name: "",
  customer_phone: "",
  customer_cnic: "",
  phone_brand: "",
  phone_model: "",
  imei: "",
  variant: "",
  condition: "good",
  status: "available",
  purchase_price: "",
  selling_price: "",
  description: "",
  notes: "",
};

function UsedPhoneDialog({ open, onOpenChange, record }) {
  const isEdit = Boolean(record);
  const isSold = record?.status === "sold";
  const { mutate: create, isPending: creating } = useCreateUsedPhoneMutation();
  const { mutate: update, isPending: updating } = useUpdateUsedPhoneMutation();
  const isPending = creating || updating;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        customer_name: record?.customer_name ?? "",
        customer_phone: record?.customer_phone ?? "",
        customer_cnic: record?.customer_cnic ?? "",
        phone_brand: record?.phone_brand ?? "",
        phone_model: record?.phone_model ?? "",
        imei: record?.imei ?? "",
        variant: record?.variant ?? "",
        condition: record?.condition ?? "good",
        status: record?.status ?? "available",
        purchase_price: record?.purchase_price ?? "",
        selling_price: record?.selling_price ?? "",
        description: record?.description ?? "",
        notes: record?.notes ?? "",
      });
      setErrors({});
    }
  }, [open, record]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };
  const setSel = (name) => (value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? "Record updated." : "Used phone purchase recorded.");
        onOpenChange(false);
      },
      onError: (err) => {
        const e = err?.response?.data?.errors;
        if (e) setErrors(e);
        else toast.error(err?.response?.data?.message ?? "Something went wrong.");
      },
    };
    if (isEdit) update({ id: record.id, data: form }, opts);
    else create(form, opts);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Record" : "Buy Used Phone"}</DialogTitle>
          <DialogDescription>
            {isSold
              ? "This record is locked because the phone has been sold."
              : isEdit
              ? "Update used phone purchase details."
              : "Record a used phone purchase from a customer."}
          </DialogDescription>
        </DialogHeader>
        {isSold && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
            <Lock className="size-4 shrink-0" />
            This phone has been sold and cannot be edited.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Info</p>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Customer Name *"
              name="customer_name"
              value={form.customer_name}
              onChange={set}
              required
              placeholder="Full name"
              error={errors.customer_name}
              className="col-span-3"
            />
            <Field
              label="Phone"
              name="customer_phone"
              value={form.customer_phone}
              onChange={set}
              placeholder="+92 300 0000000"
              error={errors.customer_phone}
              className="col-span-2"
            />
            <Field
              label="CNIC"
              name="customer_cnic"
              value={form.customer_cnic}
              onChange={set}
              placeholder="00000-0000000-0"
              error={errors.customer_cnic}
            />
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Details</p>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Brand *"
              name="phone_brand"
              value={form.phone_brand}
              onChange={set}
              required
              placeholder="e.g. Samsung"
              error={errors.phone_brand}
            />
            <Field
              label="Model *"
              name="phone_model"
              value={form.phone_model}
              onChange={set}
              required
              placeholder="e.g. Galaxy S23"
              error={errors.phone_model}
            />
            <Field
              label="Variant"
              name="variant"
              value={form.variant}
              onChange={set}
              placeholder="e.g. 128GB Black"
              error={errors.variant}
            />
            <Field
              label="IMEI"
              name="imei"
              value={form.imei}
              onChange={set}
              placeholder="15-digit IMEI"
              error={errors.imei}
              className="col-span-2"
            />
            <FormSelect label="Condition" value={form.condition} onValueChange={setSel("condition")} error={errors.condition}>
              {CONDITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </FormSelect>
            <FormSelect label="Status" value={form.status} onValueChange={setSel("status")} error={errors.status} className="col-span-3">
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </FormSelect>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Purchase Price *"
              name="purchase_price"
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={set}
              required
              placeholder="0.00"
              error={errors.purchase_price}
            />
            <Field
              label="Selling Price"
              name="selling_price"
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={set}
              placeholder="0.00"
              error={errors.selling_price}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Description"
              name="description"
              as="textarea"
              value={form.description}
              onChange={set}
              placeholder="Phone condition details, accessories included, etc."
              error={errors.description}
            />
            <Field
              label="Notes"
              name="notes"
              as="textarea"
              value={form.notes}
              onChange={set}
              placeholder="Internal notes…"
              error={errors.notes}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || isSold}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Record Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUsedPhoneDialog({ open, onOpenChange, record }) {
  const { mutate, isPending } = useDeleteUsedPhoneMutation();
  const confirm = () =>
    mutate(record.id, {
      onSuccess: () => {
        toast.success("Record deleted.");
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message ?? "Failed to delete.");
        onOpenChange(false);
      },
    });
  const phoneName = record ? `${record.phone_brand} ${record.phone_model}` : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Record</DialogTitle>
          <DialogDescription>
            Delete the record for <span className="font-semibold text-foreground">{phoneName}</span>? This cannot be undone.
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

export function UsedPhonesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { data, isLoading } = useUsedPhoneList({ page, page_size: PAGE_SIZE, ...(search && { search }) });
  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background min-w-0 flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search records…"
              value={search}
              onChange={handleSearch}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" /> Buy Used Phone
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Customer", "Phone", "IMEI", "Variant", "Condition", "Status", "Purchase Price", "Selling Price"].map((col) => (
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
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-18 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-7 w-16 rounded-lg" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <RowAvatar name={row.customer_name} />
                        <div>
                          <div className="font-medium">{row.customer_name}</div>
                          {row.customer_phone && (
                            <div className="text-xs text-muted-foreground">{row.customer_phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                      {row.phone_brand} {row.phone_model}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{row.imei || "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.variant || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("font-semibold capitalize", conditionColor(row.condition))}>
                        {conditionLabel(row.condition)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", STATUS_STYLES[row.status] ?? "bg-muted text-muted-foreground border-border")}>
                        {row.status ?? "available"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                      {row.purchase_price ? `PKR ${Number(row.purchase_price).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                      {row.selling_price ? `PKR ${Number(row.selling_price).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {row.status === "sold" ? (
                          <span
                            title="Cannot edit a sold record"
                            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/40 cursor-not-allowed"
                          >
                            <Lock className="size-3.5" />
                          </span>
                        ) : (
                          <button onClick={() => setEditRecord(row)} className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Pencil className="size-3.5" />
                          </button>
                        )}
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
              {totalCount === 0 ? "No records" : `Showing ${start}–${end} of ${totalCount} records`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <UsedPhoneDialog open={addOpen} onOpenChange={setAddOpen} record={null} />
      <UsedPhoneDialog
        open={Boolean(editRecord)}
        onOpenChange={(v) => { if (!v) setEditRecord(null); }}
        record={editRecord}
      />
      <DeleteUsedPhoneDialog
        open={Boolean(deleteRecord)}
        onOpenChange={(v) => { if (!v) setDeleteRecord(null); }}
        record={deleteRecord}
      />
    </>
  );
}
