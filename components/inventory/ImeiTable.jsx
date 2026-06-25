"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useImeiList, useCreateImeiMutation, useUpdateImeiMutation, useDeleteImeiMutation } from "@/hooks/useInventory";
import { useProductDropdown, useVariantDropdown } from "@/hooks/useProducts";
import { useBranchDropdown } from "@/hooks/useBranches";

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  sold:      "bg-primary/10 text-primary border-primary/20",
  defective: "bg-destructive/10 text-destructive border-destructive/20",
  returned:  "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  in_repair: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
};

const PTA_STYLES = {
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  non_pta:  "bg-muted text-muted-foreground border-border",
};

function Pill({ label, styles }) {
  return (
    <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", styles)}>
      {String(label).replace(/_/g, " ")}
    </span>
  );
}

function FilterSelect({ value, onChange, placeholder, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function TableSkeleton() {
  return Array.from({ length: PAGE_SIZE }).map((_, i) => (
    <tr key={i} className="border-b border-border/40">
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-32 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="size-7 w-7 rounded-lg" /></td>
    </tr>
  ));
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
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      {range().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="size-7 flex items-center justify-center text-xs text-muted-foreground">
            …
          </span>
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
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function Field({ label, className, error, ...inputProps }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        {...inputProps}
        className={cn(
          "w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
          error
            ? "border-destructive focus:ring-destructive/30"
            : "border-input focus:ring-ring/50"
        )}
      />
      {error && (
        <p className="text-xs text-destructive leading-tight">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  imei1: "",
  imei2: "",
  product: "",
  color: "",
  variant: "",
  cost_price: "",
  selling_price: "",
  pta_status: "approved",
  branch: "",
  purchased_date: "",
};

function SelectField({ label, className, error, children, ...props }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <select {...props} className={cn(
        "w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 transition-colors",
        error ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring/50"
      )}>
        {children}
      </select>
      {error && <p className="text-xs text-destructive leading-tight">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

const EMPTY_EDIT_FORM = {
  status: "",
  pta_status: "",
  color: "",
  cost_price: "",
  selling_price: "",
  branch: "",
};

function EditImeiDialog({ open, onOpenChange, record }) {
  const { mutate: updateImei, isPending } = useUpdateImeiMutation();
  const { data: branchOptions = [] } = useBranchDropdown();
  const [form, setForm] = useState(EMPTY_EDIT_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && record) {
      setForm({
        status: record.status ?? "",
        pta_status: record.pta_status ?? "",
        color: record.color ?? "",
        cost_price: record.cost_price ?? "",
        selling_price: record.selling_price ?? "",
        branch: record.branch ?? "",
      });
      setErrors({});
    }
  }, [open, record]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleOpenChange = (val) => {
    if (!val) setErrors({});
    onOpenChange(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      ...form,
      branch: form.branch ? Number(form.branch) : undefined,
    };
    updateImei({ id: record.id, data: payload }, {
      onSuccess: () => { toast.success("IMEI unit updated."); handleOpenChange(false); },
      onError: (err) => {
        const apiErrors = err?.response?.data?.errors;
        if (apiErrors) setErrors(apiErrors);
        else toast.error(err?.response?.data?.message ?? "Failed to update unit.");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit IMEI Unit</DialogTitle>
          <DialogDescription className="font-mono text-xs">{record?.imei1}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Status" name="status" value={form.status} onChange={set} error={errors.status}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="defective">Defective</option>
              <option value="returned">Returned</option>
              <option value="in_repair">In Repair</option>
            </SelectField>

            <SelectField label="PTA Status" name="pta_status" value={form.pta_status} onChange={set} error={errors.pta_status}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="non_pta">Non-PTA</option>
            </SelectField>

            <Field label="Color" name="color" value={form.color} onChange={set} placeholder="e.g. Midnight Black" error={errors.color} />
            <Field label="Cost Price (PKR)" name="cost_price" type="number" value={form.cost_price} onChange={set} error={errors.cost_price} />
            <Field label="Selling Price (PKR)" name="selling_price" type="number" value={form.selling_price} onChange={set} error={errors.selling_price} />

            <SelectField label="Branch" name="branch" value={form.branch} onChange={set} error={errors.branch}>
              <option value="">Select branch…</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
              ))}
            </SelectField>
          </div>
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteImeiDialog({ open, onOpenChange, record }) {
  const { mutate: deleteImei, isPending } = useDeleteImeiMutation();

  const confirm = () => {
    deleteImei(record.id, {
      onSuccess: () => { toast.success("IMEI unit deleted."); onOpenChange(false); },
      onError: (err) => { toast.error(err?.response?.data?.message ?? "Failed to delete unit."); onOpenChange(false); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete IMEI Unit</DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            <span className="font-mono font-semibold text-foreground">{record?.imei1}</span>.
            This action cannot be undone.
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

function RegisterImeiDialog({ open, onOpenChange }) {
  const { mutate: createImei, isPending } = useCreateImeiMutation();
  const { data: productOptions = [] } = useProductDropdown();
  const { data: branchOptions = [] } = useBranchDropdown();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const { data: variantOptions = [], isLoading: variantsLoading } = useVariantDropdown(
    form.product ? Number(form.product) : null
  );

  const set = (e) => {
    const { name, value } = e.target;
    if (name === "product") {
      setForm((f) => ({ ...f, product: value, variant: "" }));
      setErrors((prev) => ({ ...prev, product: undefined, variant: undefined }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOpenChange = (val) => {
    if (!val) { setForm(EMPTY_FORM); setErrors({}); }
    onOpenChange(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      ...form,
      product: form.product ? Number(form.product) : undefined,
      branch: form.branch ? Number(form.branch) : undefined,
      variant: form.variant ? Number(form.variant) : undefined,
    };
    createImei(payload, {
      onSuccess: () => { toast.success("IMEI unit registered."); handleOpenChange(false); },
      onError: (err) => {
        const apiErrors = err?.response?.data?.errors;
        if (apiErrors) setErrors(apiErrors);
        else toast.error(err?.response?.data?.message ?? "Failed to register unit.");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register IMEI Unit</DialogTitle>
          <DialogDescription>Add a new phone unit to inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="IMEI 1 *" name="imei1" value={form.imei1} onChange={set} required placeholder="354678901234567" error={errors.imei1} />
            <Field label="IMEI 2" name="imei2" value={form.imei2} onChange={set} placeholder="Optional" error={errors.imei2} />

            <SelectField label="Product *" name="product" value={form.product} onChange={set} required error={errors.product}>
              <option value="">Select product…</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand_name ? `${p.brand_name} ${p.name}` : p.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Variant *"
              name="variant"
              value={form.variant}
              onChange={set}
              required
              error={errors.variant}
              disabled={!form.product || variantsLoading}
            >
              <option value="">
                {!form.product ? "Select product first…" : variantsLoading ? "Loading…" : "Select variant…"}
              </option>
              {variantOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.storage, v.ram, v.color].filter(Boolean).join(" / ") || v.sku}
                </option>
              ))}
            </SelectField>

            <SelectField label="Branch *" name="branch" value={form.branch} onChange={set} required error={errors.branch} className="col-span-2">
              <option value="">Select branch…</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
              ))}
            </SelectField>

            <Field label="Color" name="color" value={form.color} onChange={set} placeholder="e.g. Midnight Black" error={errors.color} />
            <Field label="Cost Price (PKR) *" name="cost_price" type="number" value={form.cost_price} onChange={set} error={errors.cost_price} />
            <Field label="Selling Price (PKR)" name="selling_price" type="number" value={form.selling_price} onChange={set} error={errors.selling_price} />
            <Field label="Purchase Date *" name="purchased_date" type="date" value={form.purchased_date} onChange={set} required error={errors.purchased_date} />
          </div>
          <SelectField label="PTA Status" name="pta_status" value={form.pta_status} onChange={set} error={errors.pta_status}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="non_pta">Non-PTA</option>
          </SelectField>
          {errors.non_field_errors && (
            <p className="text-xs text-destructive">{errors.non_field_errors[0]}</p>
          )}
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registering…" : "Register Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImeiTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ptaFilter, setPtaFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const params = {
    page,
    page_size: PAGE_SIZE,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(ptaFilter && { pta_status: ptaFilter }),
  };

  const { data, isLoading } = useImeiList(params);
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
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background min-w-0 flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search IMEI or model…"
              value={search}
              onChange={handleSearch}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <FilterSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              placeholder="All Statuses"
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="defective">Defective</option>
              <option value="returned">Returned</option>
              <option value="in_repair">In Repair</option>
            </FilterSelect>

            <FilterSelect
              value={ptaFilter}
              onChange={(v) => { setPtaFilter(v); setPage(1); }}
              placeholder="All PTA"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="non_pta">Non-PTA</option>
            </FilterSelect>

            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" />
              Register
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["IMEI", "Product / Model", "Color / Storage", "PTA Status", "Branch", "Status", "Selling Price"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  )
                )}
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No IMEI units found.
                  </td>
                </tr>
              ) : (
                rows.map((unit) => (
                  <tr
                    key={unit.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {unit.imei1 ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 font-medium max-w-44 truncate">
                      {unit.product_name ?? unit.product ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      {[unit.color, unit.storage_variant ?? unit.storage]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill
                        label={unit.pta_status ?? "—"}
                        styles={PTA_STYLES[unit.pta_status] ?? "bg-muted text-muted-foreground border-border"}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {unit.branch_name ?? unit.branch ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill
                        label={unit.status ?? "—"}
                        styles={STATUS_STYLES[unit.status] ?? "bg-muted text-muted-foreground border-border"}
                      />
                    </td>
                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap">
                      {unit.selling_price
                        ? `PKR ${Number(unit.selling_price).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted data-popup-open:bg-muted transition-colors">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => setEditRecord(unit)}>
                            <Pencil className="size-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteRecord(unit)}>
                            <Trash2 className="size-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-border/60">
          {isLoading ? (
            <Skeleton className="h-4 w-44 rounded-lg" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? "No units found"
                : `Showing ${start}–${end} of ${totalCount} units`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <RegisterImeiDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditImeiDialog
        open={Boolean(editRecord)}
        onOpenChange={(v) => { if (!v) setEditRecord(null); }}
        record={editRecord}
      />
      <DeleteImeiDialog
        open={Boolean(deleteRecord)}
        onOpenChange={(v) => { if (!v) setDeleteRecord(null); }}
        record={deleteRecord}
      />
    </>
  );
}
