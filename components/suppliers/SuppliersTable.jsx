"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import { exportToCSV } from "@/lib/csv-utils";
import { CSVImportDialog } from "@/components/ui/csv-import-dialog";
import { RowAvatar } from "@/components/ui/row-avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useSupplierList, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation,
} from "@/hooks/useSuppliers";

const PAGE_SIZE = 10;

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

const EMPTY_FORM = { name: "", contact_person: "", email: "", phone: "", address: "" };

function SupplierDialog({ open, onOpenChange, record }) {
  const isEdit = Boolean(record);
  const { mutate: create, isPending: creating } = useCreateSupplierMutation();
  const { mutate: update, isPending: updating } = useUpdateSupplierMutation();
  const isPending = creating || updating;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        name: record?.name ?? "",
        contact_person: record?.contact_person ?? "",
        email: record?.email ?? "",
        phone: record?.phone ?? "",
        address: record?.address ?? "",
      });
      setErrors({});
    }
  }, [open, record]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const opts = {
      onSuccess: () => { toast.success(isEdit ? "Supplier updated." : "Supplier added."); onOpenChange(false); },
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update supplier details." : "Add a new supplier."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Name *" name="name" value={form.name} onChange={set} required placeholder="Supplier name" error={errors.name} />
          <Field label="Contact Person" name="contact_person" value={form.contact_person} onChange={set} placeholder="e.g. Ahmed Khan" error={errors.contact_person} />
          <Field label="Email" name="email" type="email" value={form.email} onChange={set} placeholder="email@example.com" error={errors.email} />
          <Field label="Phone" name="phone" value={form.phone} onChange={set} placeholder="+92 300 0000000" error={errors.phone} />
          <Field label="Address" name="address" as="textarea" value={form.address} onChange={set} placeholder="Full address…" error={errors.address} />
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Supplier"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSupplierDialog({ open, onOpenChange, record }) {
  const { mutate, isPending } = useDeleteSupplierMutation();
  const confirm = () => mutate(record.id, {
    onSuccess: () => { toast.success("Supplier deleted."); onOpenChange(false); },
    onError: (err) => { toast.error(err?.response?.data?.message ?? "Failed to delete."); onOpenChange(false); },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Supplier</DialogTitle>
          <DialogDescription>Delete <span className="font-semibold text-foreground">{record?.name}</span>? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={isPending} onClick={confirm}>{isPending ? "Deleting…" : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SuppliersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data, isLoading, refetch } = useSupplierList({ page, page_size: PAGE_SIZE, ...(search && { search }) });
  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;
  const { mutateAsync: createSupplier } = useCreateSupplierMutation();

  const handleSearch = useCallback((e) => { setSearch(e.target.value); setPage(1); }, []);

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error("No suppliers to export");
      return;
    }
    const exportData = rows.map(({ id, name, contact_person, email, phone, address }) => ({
      id,
      name,
      contact_person: contact_person || "",
      email: email || "",
      phone: phone || "",
      address: address || "",
    }));
    exportToCSV(exportData, `suppliers_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Suppliers exported successfully");
  };

  const handleImport = async (csvData) => {
    if (csvData.length === 0) {
      throw new Error("CSV file is empty");
    }

    const headers = Object.keys(csvData[0]).map(h => h.toLowerCase());
    if (!headers.includes("name")) {
      throw new Error("CSV must contain a 'name' column");
    }

    setIsImporting(true);
    try {
      let success = 0;
      let failed = 0;

      for (const row of csvData) {
        try {
          const payload = {
            name: row.name?.trim(),
            contact_person: row.contact_person?.trim() || null,
            email: row.email?.trim() || null,
            phone: row.phone?.trim() || null,
            address: row.address?.trim() || null,
          };

          await createSupplier(payload);
          success++;
        } catch (err) {
          failed++;
          console.error(`Failed to import row:`, row, err);
        }
      }

      await refetch();
      if (failed > 0) {
        toast.warning(`Imported ${success} suppliers, ${failed} failed`);
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
            <input placeholder="Search suppliers…" value={search} onChange={handleSearch} className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0" />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} disabled={isImporting}>
              <Upload className="size-3.5" /> Import
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" /> Add Supplier
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Name", "Contact Person", "Email", "Phone", "Address"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                    ))}
                    <td className="px-4 py-3.5"><Skeleton className="h-7 w-16 rounded-lg" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">No suppliers found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <RowAvatar name={row.name} />
                        <span className="font-medium">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.contact_person || "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.email || "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{row.phone || "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground max-w-xs truncate">{row.address || "—"}</td>
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
          {isLoading ? <Skeleton className="h-4 w-44 rounded-lg" /> : (
            <p className="text-xs text-muted-foreground">{totalCount === 0 ? "No suppliers" : `Showing ${start}–${end} of ${totalCount} suppliers`}</p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <SupplierDialog open={addOpen} onOpenChange={setAddOpen} record={null} />
      <SupplierDialog open={Boolean(editRecord)} onOpenChange={(v) => { if (!v) setEditRecord(null); }} record={editRecord} />
      <DeleteSupplierDialog open={Boolean(deleteRecord)} onOpenChange={(v) => { if (!v) setDeleteRecord(null); }} record={deleteRecord} />

      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        moduleLabel="Suppliers"
      />
    </>
  );
}
